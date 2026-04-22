namespace WantedRec.Server.Models
{
    public class UserDevice
    {
        public int UserDeviceId { get; set; }

        public string UserId { get; set; } = null!;
        public string Name { get; set; } = null!;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;

        public ICollection<Camera> Cameras { get; set; } = [];
    }
}