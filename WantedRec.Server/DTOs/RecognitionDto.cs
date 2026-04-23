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

        //أضف هذه الخصائص إلى RecognitionDto الموجود لديك في السيرفر:

public string? PersonDisplayName { get; set; }
        public string? NationalId { get; set; }
        public bool? PersonIsActive { get; set; }
        public bool HasSuspectRecord { get; set; }
        public PersonSecurityStatus? SecurityStatus { get; set; }
        public DangerLevel? DangerLevel { get; set; }
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
