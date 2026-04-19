namespace WantedRec.Server.DTOs
{
    public class PersonDetailDto
    {
        public int PersonId { get; set; }
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
        public bool IsDeleted { get; set; }

        // Suspect (لو موجود)
        public SuspectSummaryDto? Suspect { get; set; }

        // صور الوجه
        public List<PersonFaceImageDto> FaceImages { get; set; } = new();

        // معلومات مختصرة عن الاعترافات
        public int TotalRecognitions { get; set; }
        public DateTime? LastRecognitionAt { get; set; }
    }
}
