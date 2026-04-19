using Azure.Messaging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using WantedRec.Server.Models;

namespace WantedRec.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/chat-groups")]
    public class ChatGroupsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHubContext<ChatHub> _chatHubContext;
        private readonly IMemoryCache _cache;
        private const string RANKS_CACHE_KEY = "all_ranks";
        public ChatGroupsController(ApplicationDbContext context, IMemoryCache cache, UserManager<ApplicationUser> userManager, IHubContext<ChatHub> chatHubContext)
        {
            _context = context;
            _userManager = userManager;
            _chatHubContext = chatHubContext;
            _cache = cache;
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetUserGroups()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var groups = await _context.ChatGroupUsers
                .Where(g => g.UserId == userId)
                .Select(g => new
                {
                    g.ChatGroup.Id,
                    g.ChatGroup.Name,
                    g.ChatGroup.IsClosed,
                    g.ChatGroup.CreatedAt,
                    MemberIds = g.ChatGroup.Members.Select(m => m.UserId)
                })
                .ToListAsync();

            return Ok(groups);
        }

        [HttpGet("{groupId}/users")]
        public async Task<IActionResult> GetGroupUsers(int groupId)
        {
            var users = await (from cgu in _context.ChatGroupUsers
                               join user in _context.Users on cgu.UserId equals user.Id
                               join rank in _context.Ranks on user.RankId equals rank.Id
                               join unit in _context.Units on user.ur_no equals unit.Ur_no
                               where cgu.ChatGroupId == groupId
                               orderby user.RankId
                               select new
                               {
                                   Id = user.Id,
                                   PersonName =rank.Name +" / "+ user.PersonName,
                                   UnitName = unit.Name
                               }).ToListAsync();


            return Ok(users);
        }


        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
        {
            var user = await _userManager.GetUserAsync(User);

            if (!await _userManager.IsInRoleAsync(user, "ChatManager"))
                return Forbid();

            var group = new ChatGroup
            {
                Name = dto.Name,
                CreatedByUserId = user.Id,
                Members = new List<ChatGroupUser>
        {
            new ChatGroupUser { UserId = user.Id, IsAdmin = true }
        }
            };

            _context.ChatGroups.Add(group);
            await _context.SaveChangesAsync();

            // جلب اسم الرتبة من الكاش (كما تم توضيحه مسبقاً)
            var allRanks = await _cache.GetOrCreateAsync(RANKS_CACHE_KEY, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6); // صلاحية الكاش
                return await _context.Ranks.ToListAsync();
            });

            var rankName = allRanks.FirstOrDefault(r => r.Id == user.RankId)?.Name ?? "رتبة غير معروفة";
            var senderDisplayName = $"{rankName} / {user.PersonName}";

            // إشعار كل المستخدمين (أو حسب السياسة)
            await _chatHubContext.Clients.All.SendAsync("GroupCreated", new
            {
                GroupId = group.Id,
                GroupName = group.Name,
                CreatedBy = senderDisplayName
            });

            return Ok(new { group.Id, group.Name });
        }


        //تحويل و ارسال جميع الاعضاء دفعة واحدة

        [HttpPost("{groupId}/users")]
        public async Task<IActionResult> AddUserToGroup(int groupId, [FromBody] AddUserDto dto)
        {
            var user = await _userManager.GetUserAsync(User);

            var isGroupAdmin = await _context.ChatGroupUsers
                .AnyAsync(c => c.ChatGroupId == groupId && c.UserId == user.Id && c.IsAdmin);

            if (!isGroupAdmin)
                return Forbid();

            var exists = await _context.ChatGroupUsers
                .AnyAsync(c => c.ChatGroupId == groupId && c.UserId == dto.UserId);

            if (exists)
                return Ok("المستخدم مضاف مسبقًا إلى المجموعة");

            var allRanks = await _cache.GetOrCreateAsync(RANKS_CACHE_KEY, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6); // صلاحية الكاش
                return await _context.Ranks.ToListAsync();
            });

                _context.ChatGroupUsers.Add(new ChatGroupUser
                {
                    ChatGroupId = groupId,
                    UserId = dto.UserId
                });
                await _context.SaveChangesAsync();

                var groupName = await _context.ChatGroups
                    .Where(g => g.Id == groupId)
                    .Select(g => g.Name)
                    .FirstOrDefaultAsync();

            if (user is null || allRanks is null)
                return Ok();

            var rankName = allRanks.FirstOrDefault(r => r.Id == user.RankId)?.Name ?? "بدون رتبة";


            await _chatHubContext.Clients
                      .User(dto.UserId)
                      .SendAsync("YouAreAddedToGroup", new
                      {
                          SenderId = user.Id,
                          SenderName = rankName + " / "+ user.PersonName,
                          GroupId = groupId,
                          GroupName = groupName
                      });

             
            return Ok();
        }

  
        [HttpGet("{groupId}/messages")]
        public async Task<IActionResult> GetMessages(int groupId)
        {
            var messages = await _context.GroupMessages
                .Where(m => m.ChatGroupId == groupId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.ContentEn,
                    m.SentAt,
                    m.SenderId,
                    SenderName = m.Sender.PersonName,
                    m.IsDeleted,
                    m.IsEdited,
                    HasAttachment = m.AttachmentData != null,
                    AttachmentName = m.AttachmentName,
                    attachmentMimeType = m.AttachmentMimeType
                })
                .ToListAsync();

            return Ok(messages);
        }







        [HttpPost("{groupId}/toggle-status")]
        public async Task<IActionResult> ToggleGroupStatus(int groupId)
        {
            var user = await _userManager.GetUserAsync(User);
            var isAdmin = await _context.ChatGroupUsers
                .AnyAsync(c => c.ChatGroupId == groupId && c.UserId == user.Id && c.IsAdmin);

            if (!isAdmin) return Forbid();

            var group = await _context.ChatGroups.FindAsync(groupId);
            if (group == null) return NotFound();

            group.IsClosed = !group.IsClosed;
            await _context.SaveChangesAsync();

            return Ok(new { group.IsClosed });
        }


        [HttpPut("{groupId}")]
        public async Task<IActionResult> UpdateGroup(int groupId, [FromBody] CreateGroupDto dto)
        {
            var user = await _userManager.GetUserAsync(User);
            var group = await _context.ChatGroups.FindAsync(groupId);
            if (group == null) return NotFound();

            var isAdmin = await _context.ChatGroupUsers.AnyAsync(c => c.ChatGroupId == groupId && c.UserId == user.Id && c.IsAdmin);
            if (!isAdmin) return Forbid();

            group.Name = dto.Name;
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{groupId}/users/{userId}")]
        public async Task<IActionResult> RemoveUser(int groupId, string userId)
        {
            var user = await _userManager.GetUserAsync(User);
            var isAdmin = await _context.ChatGroupUsers.AnyAsync(c => c.ChatGroupId == groupId && c.UserId == user.Id && c.IsAdmin);
            if (!isAdmin) return Forbid();

            if (userId == "all")
            {
                var allmembers = await _context.ChatGroupUsers.Where(c => c.ChatGroupId == groupId && c.UserId != user.Id).ToListAsync();
                if (allmembers == null) return NotFound();

                _context.ChatGroupUsers.RemoveRange(allmembers);
                await _context.SaveChangesAsync();
                return Ok();
            }
            var member = await _context.ChatGroupUsers.FirstOrDefaultAsync(c => c.ChatGroupId == groupId && c.UserId == userId);
            if (member == null) return NotFound();

            _context.ChatGroupUsers.Remove(member);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{groupId}")]
        public async Task<IActionResult> DeleteGroup(int groupId)
        {
            var user = await _userManager.GetUserAsync(User);
            var isAdmin = await _context.ChatGroupUsers.AnyAsync(c => c.ChatGroupId == groupId && c.UserId == user.Id && c.IsAdmin);
            if (!isAdmin) return Forbid();

            var group = await _context.ChatGroups
                .Include(g => g.Members)
                .Include(g => g.Messages)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null) return NotFound();
            try
            {
              
               var ChatGroupUserReads= _context.ChatGroupUserReads.Where(i => i.ChatGroupId == groupId).ToList();
                if (ChatGroupUserReads != null)
                    _context.ChatGroupUserReads.RemoveRange(ChatGroupUserReads);
                _context.ChatGroups.Remove(group);
                await _context.SaveChangesAsync();
                

                return Ok();
            }
            catch (Exception ex)
            {
                throw;
            }
           
        }

        [HttpGet("unread-group-count")]
        public async Task<IActionResult> GetUnreadCounts()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                // 1. احصل على جميع الكروبات التي ينتمي إليها المستخدم
                var userGroups = await _context.ChatGroupUsers
                    .Where(u => u.UserId == userId)
                    .Select(g => g.ChatGroupId)
                    .ToListAsync();

                var result = new List<object>();

                foreach (var groupId in userGroups)
                {
                    // 2. اجلب وقت آخر قراءة لهذا المستخدم في هذه المجموعة
                    var lastRead = await _context.ChatGroupUserReads
                        .Where(r => r.ChatGroupId == groupId && r.UserId == userId)
                        .Select(r => (DateTime?)r.LastReadAt)
                        .FirstOrDefaultAsync() ?? DateTime.MinValue;

                    // 3. احسب عدد الرسائل الجديدة
                    var count = await _context.GroupMessages
                        .Where(m => m.ChatGroupId == groupId && m.SentAt > lastRead && m.SenderId != userId)
                        .CountAsync();

                    result.Add(new
                    {
                        ChatGroupId = groupId,
                        UnreadCount = count
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "حدث خطأ أثناء جلب عدد الرسائل غير المقروءة.");
            }
        }


        [HttpPost("{groupId}/messages")]
        public async Task<IActionResult> SendMessageWithAttachment(int groupId, [FromForm] MessageWithFileDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(dto.Content) && dto.File == null)
                return BadRequest("محتوى الرسالة أو الملف مطلوب");

            var message = new GroupMessage
            {
                ChatGroupId = groupId,
                SenderId = userId,
                Content = dto.Content??"",
                ContentEn = dto.Content ?? "",
                SentAt = DateTime.Now,
                IsEdited = false,
                IsDeleted = false
            };

            if (dto.File != null && dto.File.Length > 0)
            {
                using var ms = new MemoryStream();
                await dto.File.CopyToAsync(ms);
                message.AttachmentData = ms.ToArray();
                message.AttachmentName = dto.File.FileName;
                message.AttachmentMimeType = dto.File.ContentType;

                if (string.IsNullOrEmpty(message.Content) || message.Content.Equals("@"))
                {
                    message.Content = message.AttachmentName;
                    message.ContentEn = message.AttachmentName;
                }
            }

            _context.GroupMessages.Add(message);
            await _context.SaveChangesAsync();

            await _chatHubContext.Clients.Users(GetUsersConnectId(groupId)).SendAsync("ReceiveGroupMessage", new
            {
                message.Id,
                message.Content,
                message.ContentEn,
                message.SentAt,
                message.SenderId,
                SenderName = User.Identity.Name,
                message.IsDeleted,
                message.IsEdited,
                HasAttachment = dto.File != null,
                FileName = message.AttachmentName,
                attachmentMimeType=message.AttachmentMimeType,
            });

            return Ok();
        }

        private List<string> GetUsersConnectId(int groupId)
        {
            return (from u in _context.ApplicationUser
                    join g in _context.ChatGroupUsers on u.Id equals g.UserId
                    where !string.IsNullOrEmpty(u.ConnectionId) && g.ChatGroupId == groupId
                    select u.Id).ToList();
        }

        [HttpGet("messages/{messageId}/file")]
        public async Task<IActionResult> DownloadAttachment(int messageId)
        {
            var message = await _context.GroupMessages.FindAsync(messageId);
            if (message == null || message.AttachmentData == null)
                return NotFound();

            // 👇 إذا كنت تحفظ نوع الملف (مثلاً "image/png" أو "application/pdf")
            var mimeType = message.AttachmentMimeType ?? "application/octet-stream";
            var fileName = message.AttachmentName ?? "file";

            return File(message.AttachmentData, mimeType, fileName);
        }

        public class MessageWithFileDto
        {
            public string Content { get; set; } = string.Empty;

            public IFormFile? File { get; set; }
        }
    }
}
