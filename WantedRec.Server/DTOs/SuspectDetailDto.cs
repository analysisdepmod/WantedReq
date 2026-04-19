namespace WantedRec.Server.DTOs
{
    public class SuspectDetailDto : SuspectSummaryDto
    {
        public int PersonId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? CaseReference { get; set; }
        public DateTime? WantedSince { get; set; }
        public string? Notes { get; set; }
    }
}
