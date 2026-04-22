namespace WantedRec.Server.DTOs
{
    public class RecognitionReviewDto
    {
        public long RecognitionId { get; set; }
        public bool IsMatch { get; set; } 
        public RecognitionStatus RecognitionStatus { get; set; }
        public double? ThresholdUsed { get; set; }
        public string? ReviewNotes { get; set; }
    }
}
