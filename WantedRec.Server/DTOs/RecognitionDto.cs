namespace WantedRec.Server.DTOs
{
    public class RecognitionDto
    {
        public long RecognitionId { get; set; }

        public int? PersonId { get; set; }
        public string? PersonFullName { get; set; }

        public long? FaceImageId { get; set; }
        public string? SnapshotPath { get; set; }

        public int? CameraId { get; set; }
        public string? CameraName { get; set; }

        public double? RecognitionScore { get; set; }
        public bool? IsMatch { get; set; }
        public double? ThresholdUsed { get; set; }
        public RecognitionStatus RecognitionStatus { get; set; }

        public DateTime RecognitionDateTime { get; set; }

        // Bounding Box
        public int? BBoxX1 { get; set; }
        public int? BBoxY1 { get; set; }
        public int? BBoxX2 { get; set; }
        public int? BBoxY2 { get; set; }
        public int? FrameNumber { get; set; }

        // موقع الحدث
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? LocationDescription { get; set; }

        public DateTime CreatedAt { get; set; }
        public string? ReviewNotes { get; set; }

        public int? UserDeviceId { get; set; }
    }
}
