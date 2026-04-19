namespace WantedRec.Server.DTOs
{
    public class CameraDetailDto : CameraDto
    {
        public string? Description { get; set; }
        public string? StreamUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Floor { get; set; }
        public DateTime? InstallationDate { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public string? Notes { get; set; }
    }
}
