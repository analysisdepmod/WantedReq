using Microsoft.AspNetCore.Identity;

namespace WantedRec.Server.Hubs
{
    public class NotificationHub:Hub
    {
        
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
       
        public NotificationHub(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
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

       
    }
}
