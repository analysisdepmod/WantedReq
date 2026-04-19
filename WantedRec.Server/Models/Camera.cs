namespace WantedRec.Server.Models
{
    public class Camera
    {
        public int CameraId { get; set; }

        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public string IpAddress { get; set; }= null!;
        public string? StreamUrl { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Floor { get; set; }
        public string? Area { get; set; }
        public bool IsIndoor { get; set; }

        public bool IsActive { get; set; }
        public DateTime? InstallationDate { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public string? Notes { get; set; }

        // Navigation
        public ICollection<PersonFaceImage> FaceImages { get; set; } = [];
        public ICollection<Recognition> Recognitions { get; set; } = [];
    }

}
