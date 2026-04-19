namespace WantedRec.Server.DTOs
{
    public class PersonUpsertDto
    {
        public int? PersonId { get; set; }  // null في حالة الإضافة
        

        // بيانات الشخص
        public string FullName { get; set; } = null!;
        public string? DisplayName { get; set; }
        public Gender Gender { get; set; }
        public DateTime? BirthDate { get; set; }
        public string NationalId { get; set; } = string.Empty;
        public string? ExternalCode { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }

        public string? Notes { get; set; }
        public bool IsActive { get; set; }

        // صور الوجه (إضافة/تعديل/حذف مع نفس الطلب)
        public List<PersonFaceImageUpsertDto> FaceImages { get; set; } = new();
    }
}
