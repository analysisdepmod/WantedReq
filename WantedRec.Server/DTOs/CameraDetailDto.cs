// ════════════════════════════════════════════════════════
//  WantedRec.Server/DTOs/CameraDetailDto.cs
// ════════════════════════════════════════════════════════

namespace WantedRec.Server.DTOs
{
    /// <summary>
    /// تفاصيل كاملة لكاميرا واحدة — يُرجع في GET /api/cameras/{id}
    /// </summary>
    public class CameraDetailDto : CameraDto
    {
        public string? Description { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Floor { get; set; }
        public DateTime? InstallationDate { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public string? Notes { get; set; }

        // إحصائيات — تُملأ في الـ Controller
        public int RecognitionsToday { get; set; }
        public int TotalRecognitions { get; set; }
        public DateTime? LastRecognitionAt { get; set; }
        public int? UserDeviceId { get; set; }
    }
}