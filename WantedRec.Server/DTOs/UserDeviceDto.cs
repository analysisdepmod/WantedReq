namespace WantedRec.Server.DTOs
{
    public class UserDeviceDto
    {
        public int UserDeviceId { get; set; }
        public string Name { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastSeenAt { get; set; }
    }
}