 
namespace WantedRec.Server.Hubs;

public class PresenceHub : Hub
{
    private readonly UserManager<ApplicationUser> _userManager;

    public PresenceHub(UserManager<ApplicationUser> userManager)
    {
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
            await Clients.Others.SendAsync("UserOnline", userId);
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
            await Clients.Others.SendAsync("UserOffline", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }
}
