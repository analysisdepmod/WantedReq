 

namespace WantedRec.Server.Hubs;

public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITranslationService _translationService;
    public ChatHub(ApplicationDbContext context, UserManager<ApplicationUser> userManager, ITranslationService translationService)
    {
        _context = context;
        _userManager = userManager;
        _translationService = translationService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            user.ConnectionId = Context.ConnectionId;
            user.LastSeen = DateTime.Now;
            await _userManager.UpdateAsync(user);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception exception)
    {
        var userId = Context.UserIdentifier;
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            user.ConnectionId = string.Empty;
            user.LastSeen = DateTime.Now;
            await _userManager.UpdateAsync(user);

           
        }

        await base.OnDisconnectedAsync(exception);
    }


    public async Task SendMessage(string toUserId, string content, bool isArabic, string token)
    {
        var senderId = Context.UserIdentifier;

        if (senderId == toUserId || string.IsNullOrWhiteSpace(content))
            return;

        string contentEn = content;
        var translated = await _translationService.TranslateAsync(content, isArabic, token);

        if (isArabic)
            contentEn = translated;
        else
            content = translated;

        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = toUserId,
            Content = content,
            ContentEn = contentEn,
            SentAt = DateTime.Now
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        var sender = await _userManager.FindByIdAsync(senderId);
        var receiver = await _userManager.FindByIdAsync(toUserId);

        var payload = new
        {
            message.Id,
            message.Content,
            message.ContentEn,
            message.SentAt,
            message.IsRead,
            message.ReadAt,
            message.SenderId,
            message.ReceiverId,
            SenderName = sender?.PersonName
        };

        await Clients.User(toUserId).SendAsync("ReceiveMessage", payload);
        await Clients.Caller.SendAsync("MessageSent", payload);
    }

    public async Task MarkMessageAsRead(int messageId)
    {
        var currentUserId = Context.UserIdentifier;

        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ReceiverId == currentUserId);

        if (message == null)
            return;

        if (!message.IsRead)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.Now;
            await _context.SaveChangesAsync();

            // إخطار المرسل أن الرسالة قُرئت
            var sender = await _userManager.FindByIdAsync(message.SenderId);
            if (!string.IsNullOrEmpty(sender?.ConnectionId))
            {
                await Clients.Client(sender.ConnectionId).SendAsync("MessageRead", new
                {
                    messageId = message.Id,
                    readAt = message.ReadAt
                });
            }
        }

        // إخطار القارئ بتحديث الحالة أيضًا إذا لزم
        await Clients.Caller.SendAsync("MessageMarkedAsRead", new
        {
            message.Id,
            message.IsRead,
            message.ReadAt
        });
    }

    public async Task DeleteMessage(int messageId)
    {
        var userId = Context.UserIdentifier;

        var message = await _context.Messages.FindAsync(messageId);
        if (message == null || message.SenderId != userId)
            return; // Unauthorized or not found

        message.IsDeleted = true;
        await _context.SaveChangesAsync();

        // إخطار المستقبل إذا كان متصل
        var receiver = await _userManager.FindByIdAsync(message.ReceiverId);
        if (!string.IsNullOrEmpty(receiver?.ConnectionId))
        {
            await Clients.User(receiver.Id).SendAsync("MessageDeleted", messageId);
        }

        // يمكن أيضًا إعلام المرسل لتحديث الواجهة
        await Clients.Caller.SendAsync("MessageDeletedConfirmed", messageId);
    }


    public async Task SendTyping(string toUserId)
    {
        var senderId = Context.UserIdentifier;
        var toUser = await _userManager.FindByIdAsync(toUserId);
        if (!string.IsNullOrEmpty(toUser?.ConnectionId))
        {
            await Clients.User(toUser.Id).SendAsync("UserTyping", senderId);
        }
    }
    public async Task MessageRead(int messageId, string senderId)
    {
        await Clients.User(senderId).SendAsync("MessageRead", messageId);
    }


    //خاص بالمحادثات الجماعية

    public async Task SendGroupMessage(int groupId, string content, bool isArabic, string token)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrWhiteSpace(content)) return;

        var group = await _context.ChatGroups.FindAsync(groupId);
        if (group == null || group.IsClosed) return;

        var isMember = await _context.ChatGroupUsers
            .AnyAsync(c => c.ChatGroupId == groupId && c.UserId == senderId);
        if (!isMember) return;

        var translated = await _translationService.TranslateAsync(content, isArabic, token);

        var message = new GroupMessage
        {
            ChatGroupId = groupId,
            SenderId = senderId,
            Content = isArabic ? content : translated,
            ContentEn = isArabic ? translated : content,
            SentAt = DateTime.Now
        };

        _context.GroupMessages.Add(message);
        await _context.SaveChangesAsync();

        var sender = await _userManager.FindByIdAsync(senderId);

        var payload = new
        {
            message.Id,
            message.Content,
            message.ContentEn,
            SenderId = senderId,
            SenderName = sender?.PersonName,
            SentAt = message.SentAt,
            GroupId = groupId
        };

        // أرسلها إلى الكل ما عدا المرسل
        var x = GetUsersConnectId(groupId);
        await  Clients.Users(x).SendAsync("ReceiveGroupMessage", payload);
        // أرسل تأكيد للمرسل
        await Clients.Caller.SendAsync("GroupMessageSent", payload);
    
    }

    public async Task EditGroupMessage(int groupId, int messageId, string newContent)
    {
        var userId = Context.UserIdentifier;

        var message = await _context.GroupMessages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ChatGroupId == groupId);

        if (message == null || message.SenderId != userId || message.IsDeleted)
            return;

        message.Content = newContent;
        message.IsEdited = true;
        await _context.SaveChangesAsync();

        var sender = await _userManager.FindByIdAsync(userId);

        var payload = new
        {
            message.Id,
            message.Content,
            SenderId = userId,
            SenderName = sender?.PersonName,
            SentAt = message.SentAt,
            IsEdited = true
        };

        
        
        await Clients.Users(GetUsersConnectId(groupId)).SendAsync("GroupMessageEdited", payload);

        // تأكيد للمرسل
        await Clients.Caller.SendAsync("GroupMessageEditConfirmed", payload);
    }

    public async Task MarkGroupAsRead(int groupId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        var now = DateTime.Now;

        var readEntry = await _context.ChatGroupUserReads
            .FirstOrDefaultAsync(r => r.ChatGroupId == groupId && r.UserId == userId);

        if (readEntry == null)
        {
            _context.ChatGroupUserReads.Add(new ChatGroupUserRead
            {
                ChatGroupId = groupId,
                UserId = userId,
                LastReadAt = now
            });
        }
        else
        {
            readEntry.LastReadAt = now;
        }

        await _context.SaveChangesAsync();

        await Clients.Caller.SendAsync("GroupMarkedAsRead", new
        {
            GroupId = groupId,
            ReadAt = now
        });
    }
    public async Task DeleteGroupMessage(int groupId, int messageId)
    {
        var userId = Context.UserIdentifier;

        var message = await _context.GroupMessages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ChatGroupId == groupId);

        if (message == null || message.SenderId != userId)
            return;

        message.IsDeleted = true;
        await _context.SaveChangesAsync();

        
        

        await Clients.Users(GetUsersConnectId(groupId)).SendAsync("GroupMessageDeleted", new
        {
            GroupId = groupId,
            MessageId = messageId
        });

        // تأكيد للمرسل
        await Clients.Caller.SendAsync("GroupMessageDeleteConfirmed", messageId);
    }


    public async Task JoinGroup(string groupId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
    }

    public async Task LeaveGroup(string groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
    }

   private   List<string> GetUsersConnectId(int groupId)
    {
       return   (from u in _context.ApplicationUser
               join g in _context.ChatGroupUsers on u.Id equals g.UserId
               where !string.IsNullOrEmpty(u.ConnectionId) && g.ChatGroupId==groupId
               select u.Id).ToList();
    }
}
