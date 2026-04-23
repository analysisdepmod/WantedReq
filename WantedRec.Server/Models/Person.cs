namespace WantedRec.Server.Models
{
    public class Person : UserInfo
    {
        public int PersonId { get; set; }

        // بيانات الشخص الأساسية
        public string FullName { get; set; } = null!;
        public string DisplayName { get; set; } = string.Empty;
        public Gender Gender { get; set; }
        public DateTime? BirthDate { get; set; }
        public string NationalId { get; set; } = string.Empty;
        public string? ExternalCode { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? Notes { get; set; }

        public bool IsDeleted { get; set; }
        public bool IsActive { get; set; }

        // ── بيانات أمنية / مطلوبين / مشتبه بهم ──
        public PersonSecurityStatus SecurityStatus { get; set; } = PersonSecurityStatus.طبيعي;
        public DangerLevel DangerLevel { get; set; } = DangerLevel.لا_يوجد;

        public bool HasActiveAlert { get; set; } = false;
        public bool IsArmedAndDangerous { get; set; } = false;

        public string? SecurityReason { get; set; }          // سبب الإدراج أو التعميم
        public string? CaseNumber { get; set; }              // رقم القضية / الملف
        public string? IssuedBy { get; set; }                // الجهة المصدرة
        public string? ArrestWarrantNumber { get; set; }     // رقم أمر القبض إن وجد

        public DateTime? AlertIssuedAt { get; set; }         // تاريخ إصدار التعميم
        public DateTime? AlertExpiresAt { get; set; }        // انتهاء التعميم
        public DateTime? LastSeenAt { get; set; }            // آخر ظهور
        public string? LastSeenLocation { get; set; }        // مكان آخر ظهور

        public string? DistinguishingMarks { get; set; }     // علامات مميزة
        public string? Aliases { get; set; }                 // أسماء مستعارة
        public string? VehicleInfo { get; set; }             // معلومات عجلة/مركبة
        public string? SecurityNotes { get; set; }           // ملاحظات أمنية
        public string? AlertInstructions { get; set; }       // تعليمات عند المشاهدة

        // Navigation
        public ICollection<PersonFaceImage> FaceImages { get; set; } = [];
        public Suspect? Suspect { get; set; }
        public ICollection<Recognition> Recognitions { get; set; } = [];
    }
}