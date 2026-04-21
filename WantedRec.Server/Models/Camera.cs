// ════════════════════════════════════════════════════════
//  WantedRec.Server/Models/Camera.cs
// ════════════════════════════════════════════════════════

namespace WantedRec.Server.Models
{
    public class Camera
    {
        public int CameraId { get; set; }

        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public string? Description { get; set; }

        /// <summary>
        /// عنوان IP للكاميرات البعيدة.
        /// للكاميرات المحلية (webcam/USB) يُخزَّن "local" أو يُترك فارغاً.
        /// </summary>
        public string IpAddress { get; set; } = "local";

        /// <summary>
        /// رابط البث:
        ///   null          → كاميرا محلية (webcam/USB)
        ///   "http://..."  → IP MJPEG  (يُعرض مباشرة في المتصفح)
        ///   "rtsp://..."  → IP RTSP   (يحتاج proxy snapshot من الباكايند)
        /// </summary>
        public string? StreamUrl { get; set; }

        /// <summary>
        /// رقم الجهاز المحلي على الخادم/الجهاز المضيف.
        /// يُستخدم فقط لو StreamUrl = null.
        /// 0 = أول كاميرا محلية، 1 = الثانية، إلخ.
        /// </summary>
        public int? LocalDeviceIndex { get; set; }

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