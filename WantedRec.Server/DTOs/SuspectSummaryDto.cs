namespace WantedRec.Server.DTOs
{
    public class SuspectSummaryDto
    {
        public int SuspectId { get; set; }
        public string Code { get; set; } = null!;
        public RiskLevel RiskLevel { get; set; }
        public Status Status { get; set; }
        public bool IsActive { get; set; }
    }
}
