
namespace WantedRec.Server.Hubs
{
    public class RecognitionHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            Groups.AddToGroupAsync(Context.ConnectionId, "monitors");
            return base.OnConnectedAsync();
        }
    }

    public class RecognitionSignalDto
    {
        public long RecognitionId { get; set; }
        public int? PersonId { get; set; }
        public string? PersonFullName { get; set; }
        public string? PersonDisplayName { get; set; }
        public string? NationalId { get; set; }
        public string? CameraName { get; set; }
        public int? CameraId { get; set; }
        public double? Score { get; set; }
        public bool IsSuspect { get; set; }
        public string? PrimaryImageBase64 { get; set; }
        public string? SnapshotPath { get; set; }
        public DateTime RecognitionDateTime { get; set; }
        public int? UserDeviceId { get; set; }
        public bool IsLocalCamera { get; set; }

        public PersonSecurityStatus? SecurityStatus { get; set; }
        public DangerLevel? DangerLevel { get; set; }
        public bool HasActiveAlert { get; set; }
        public bool IsArmedAndDangerous { get; set; }
        public string? SecurityReason { get; set; }
        public string? CaseNumber { get; set; }
        public string? IssuedBy { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public string? LastSeenLocation { get; set; }
        public string? AlertInstructions { get; set; }
        public string? Aliases { get; set; }
        public string? VehicleInfo { get; set; }
    }

    public interface IRecognitionNotifier
    {
        Task NotifyAsync(RecognitionSignalDto dto, CancellationToken ct = default);
    }

    public class RecognitionNotifier : IRecognitionNotifier
    {
        private readonly IHubContext<RecognitionHub> _hub;

        public RecognitionNotifier(IHubContext<RecognitionHub> hub)
        {
            _hub = hub;
        }

        public async Task NotifyAsync(RecognitionSignalDto dto, CancellationToken ct = default)
        {
            await _hub.Clients.Group("monitors").SendAsync("RecognitionDetected", dto, ct);
        }
    }
}
