
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

        public PersonSecurityStatus SecurityStatus { get; set; }
        public DangerLevel DangerLevel { get; set; }
        public bool HasActiveAlert { get; set; }
        public bool IsArmedAndDangerous { get; set; }
        public string? SecurityReason { get; set; }
        public string? CaseNumber { get; set; }
        public string? IssuedBy { get; set; }
        public string? ArrestWarrantNumber { get; set; }
        public DateTime? AlertIssuedAt { get; set; }
        public DateTime? AlertExpiresAt { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public string? LastSeenLocation { get; set; }
        public string? DistinguishingMarks { get; set; }
        public string? Aliases { get; set; }
        public string? VehicleInfo { get; set; }
        public string? SecurityNotes { get; set; }
        public string? AlertInstructions { get; set; }

        public SuspectSummaryDto? Suspect { get; set; }
        public List<PersonFaceImageDto> FaceImages { get; set; } = new();
        public int TotalRecognitions { get; set; }
        public DateTime? LastRecognitionAt { get; set; }
    }
}
