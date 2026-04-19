namespace WantedRec.Server.DTOs
{
    public class CameraDto
    {
        public int CameraId { get; set; }
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public string IpAddress { get; set; } = null!;
        public string? Area { get; set; }
        public bool IsIndoor { get; set; }
        public bool IsActive { get; set; }
    }

}
