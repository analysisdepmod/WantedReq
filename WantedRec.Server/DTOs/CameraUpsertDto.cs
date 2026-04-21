// ════════════════════════════════════════════════════════
//  WantedRec.Server/DTOs/CameraUpsertDto.cs
// ════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace WantedRec.Server.DTOs
{
    /// <summary>
    /// يُستخدم لإنشاء كاميرا جديدة أو تحديث كاميرا موجودة (POST / PUT)
    /// </summary>
    public class CameraUpsertDto
    {
        [Required(ErrorMessage = "اسم الكاميرا مطلوب")]
        [MaxLength(200)]
        public string Name { get; set; } = null!;

        [MaxLength(50)]
        public string? Code { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "عنوان IP مطلوب")]
        [MaxLength(100)]
        public string IpAddress { get; set; } = null!;

        [MaxLength(500)]
        public string? StreamUrl { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        [MaxLength(100)]
        public string? Floor { get; set; }

        [MaxLength(200)]
        public string? Area { get; set; }

        public bool IsIndoor { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime? InstallationDate { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}