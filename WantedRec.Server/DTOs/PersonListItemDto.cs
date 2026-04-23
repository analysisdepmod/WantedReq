
namespace WantedRec.Server.DTOs
{
    public class PersonListItemDto
    {
        public int PersonId { get; set; }
        public string FullName { get; set; } = null!;
        public string? DisplayName { get; set; }
        public Gender Gender { get; set; }
        public string NationalId { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public int FaceImagesCount { get; set; }
        public bool HasSuspectRecord { get; set; }
        public int RecognitionCount { get; set; }

        public PersonSecurityStatus SecurityStatus { get; set; }
        public DangerLevel DangerLevel { get; set; }
        public bool HasActiveAlert { get; set; }
        public bool IsArmedAndDangerous { get; set; }
        public string? SecurityReason { get; set; }
        public string? CaseNumber { get; set; }
        public string? IssuedBy { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public string? LastSeenLocation { get; set; }
        public string? AlertInstructions { get; set; }
        public string? Aliases { get; set; }
        public string? VehicleInfo { get; set; }
    }
}
