 
using System.Net.Http.Headers;
 

namespace WantedRec.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        
        public NotificationsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager )
        {
            _context = context;
            _userManager = userManager;
            
        }
        //خاص بالاشعارات
 
        // ✅ 2. قائمة الإشعارات غير المقروءة
        [HttpGet("unreadNotifications")]
        public async Task<IActionResult> GetUnreadNotifications()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var notifications = await _context.SeenPosteds
                .Where(sp => sp.ApplicationUserId == userId && !sp.IsSeen)
                .OrderByDescending(sp => sp.Posteds!.PostedDate)
                .Select(sp => new
                {
                    sp.Id,
                    sp.Posteds!.Action,
                    sp.Posteds.ActionEn,
                    sp.Posteds.PostedDate,
                    sp.Posteds.Att_Controller_Name,
                    sp.Posteds.WhatAction,
                    sp.Posteds.Att_pk
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // ✅ 3. تعليم إشعار واحد كمقروء
        [HttpPost("mark-as-seen/{seenPostedId}")]
        public async Task<IActionResult> MarkAsSeen(int seenPostedId)
        {
            var seen = await _context.SeenPosteds.FindAsync(seenPostedId);
            if (seen == null) return NotFound();

            seen.IsSeen = true;
            seen.SeenDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok();
        }

        // ✅ 4. تعليم جميع الإشعارات كمقروءة
        [HttpPost("mark-all-as-seen")]
        public async Task<IActionResult> MarkAllAsSeen()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var unseenItems = await _context.SeenPosteds
                .Where(p => p.ApplicationUserId == userId && !p.IsSeen)
                .ToListAsync();

            foreach (var item in unseenItems)
            {
                item.IsSeen = true;
                item.SeenDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

    }
 
}
