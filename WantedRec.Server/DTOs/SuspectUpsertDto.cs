namespace WantedRec.Server.DTOs
{
    public class SuspectUpsertDto
    {
        public int? SuspectId { get; set; }
        public int PersonId { get; set; }

        public string Code { get; set; } = null!;
        public string FullName { get; set; } = string.Empty;
        public RiskLevel RiskLevel { get; set; }
        public Status Status { get; set; }
        public string? CaseReference { get; set; }
        public DateTime? WantedSince { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
    }
}
