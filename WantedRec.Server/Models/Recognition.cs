namespace WantedRec.Server.Models
{
    public class Recognition
    {
        public long RecognitionId { get; set; }

        public int? PersonId { get; set; }
        public Person? Person { get; set; }// NULL إذا Unknown
        public long? FaceImageId { get; set; }
        public PersonFaceImage? FaceImage { get; set; }// صورة الوجه المقتطع
        public int? CameraId { get; set; }
        public Camera? Camera { get; set; }
        public string? ReviewedByUserId { get; set; }
        public ApplicationUser? ReviewedByUser { get; set; }

        public double? RecognitionScore { get; set; }
        public bool? IsMatch { get; set; }
        public double? ThresholdUsed { get; set; }
        public RecognitionStatus RecognitionStatus { get; set; }  // Pending / Confirmed / Rejected...

        public DateTime RecognitionDateTime { get; set; }

        // BBox داخل الفريم
        public int? BBoxX1 { get; set; }
        public int? BBoxY1 { get; set; }
        public int? BBoxX2 { get; set; }
        public int? BBoxY2 { get; set; }
        public int? FrameNumber { get; set; }

        public string? SnapshotPath { get; set; }

        // موقع الحدث
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? LocationDescription { get; set; }

        public DateTime CreatedAt { get; set; }
        public string? ReviewNotes { get; set; }

       
  
       
 
     
    }
}
