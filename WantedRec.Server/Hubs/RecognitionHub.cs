 
 

namespace WantedRec.Server.Hubs
{
    /// <summary>
    /// Hub للإشعارات الفورية عند التعرف على الوجوه.
    /// يُستخدم من RecognitionController لإرسال الحدث لكل المتصلين.
    /// </summary>
    public class RecognitionHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            // انضمام لمجموعة "monitors" — كل من يريد استقبال نتائج التعرف
            Groups.AddToGroupAsync(Context.ConnectionId, "monitors");
            return base.OnConnectedAsync();
        }
    }

    // ── DTO تُرسل عبر SignalR ─────────────────────────────
    public class RecognitionSignalDto
    {
        public long RecognitionId { get; set; }
        public int? PersonId { get; set; }
        public string? PersonFullName { get; set; }
        public string? CameraName { get; set; }
        public int? CameraId { get; set; }
        public double? Score { get; set; }
        public bool IsSuspect { get; set; }
        public string? PrimaryImageBase64 { get; set; }
        public string? SnapshotPath { get; set; }
        public DateTime RecognitionDateTime { get; set; }
        public int? UserDeviceId { get; set; }
        public bool IsLocalCamera { get; set; }
    }

    // ── Interface للـ notifier ────────────────────────────
    public interface IRecognitionNotifier
    {
        Task NotifyAsync(RecognitionSignalDto dto, CancellationToken ct = default);
    }

    // ── Implementation ────────────────────────────────────
    public class RecognitionNotifier : IRecognitionNotifier
    {
        private readonly IHubContext<RecognitionHub> _hub;

        public RecognitionNotifier(IHubContext<RecognitionHub> hub)
        {
            _hub = hub;
        }

        public async Task NotifyAsync(RecognitionSignalDto dto, CancellationToken ct = default)
        {
            // يُرسل لكل المتصلين في مجموعة "monitors"
            await _hub.Clients
                .Group("monitors")
                .SendAsync("RecognitionDetected", dto, ct);
        }
    }
}