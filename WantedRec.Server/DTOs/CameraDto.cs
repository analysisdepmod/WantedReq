// ════════════════════════════════════════════════════════
//  WantedRec.Server/DTOs/CameraDto.cs
// ════════════════════════════════════════════════════════

namespace WantedRec.Server.DTOs
{
    /// <summary>
    /// DTO خفيف يُرجع في قائمة الكاميرات.
    /// يحتوي على StreamUrl و LocalDeviceIndex لأن الفرونت
    /// يحتاجهم لتحديد نوع الكاميرا وكيفية تشغيلها.
    /// </summary>
    public class CameraDto
    {
        public int CameraId { get; set; }
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public string IpAddress { get; set; } = null!;
        public string? Area { get; set; }
        public bool IsIndoor { get; set; }
        public bool IsActive { get; set; }

        /// <summary>
        /// نوع الكاميرا:
        ///   null         → local (webcam/USB)
        ///   "http://..." → IP MJPEG
        ///   "rtsp://..." → IP RTSP (proxy)
        /// </summary>
        public string? StreamUrl { get; set; }

        /// <summary>
        /// رقم جهاز الكاميرا المحلية (0, 1, 2...).
        /// يُستخدم فقط لما StreamUrl = null.
        /// </summary>
        public int? LocalDeviceIndex { get; set; }
        public int? UserDeviceId { get; set; }
    }
}