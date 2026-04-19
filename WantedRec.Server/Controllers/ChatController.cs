 
using System.Net.Http.Headers;
 

namespace WantedRec.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        
        public ChatController(ApplicationDbContext context, UserManager<ApplicationUser> userManager )
        {
            _context = context;
            _userManager = userManager;
            
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var users = await _userManager.Users
                .Include(i=>i.Ranks)
                .OrderBy(i=>i.RankId)
                .Where(u => u.Id != currentUserId)
                .Select(u => new
                {
                    u.Id,
                    PersonName=u.Ranks!.Name+"/"+ u.PersonName,
                    UnitName=_context.Units.Where(i=>i.Ur_no==u.ur_no).Select(i=>i.Name).FirstOrDefault()??"",
                    IsOnline = u.ConnectionId != null && u.ConnectionId.Length>10,
                    u.LastSeen
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("messages/{userId}")]
        public async Task<IActionResult> GetMessages(string userId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var messages = await _context.Messages
                .Where(m =>
                    (m.SenderId == currentUserId && m.ReceiverId == userId) ||
                    (m.SenderId == userId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.ContentEn,
                    m.SentAt,
                    m.IsRead,
                    m.ReadAt,
                    m.SenderId,
                    m.ReceiverId,
                    SenderName = m.Sender.PersonName,
                    m.IsDeleted
                    
                })
                .ToListAsync();

            return Ok(messages);
        }
 
        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadMessages()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var messages = await _context.Messages
                .Where(m => m.ReceiverId == userId && !m.IsRead)
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllMessages()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var messages = await _context.Messages
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();

            return Ok(messages);
        }
  
    }
 
}
