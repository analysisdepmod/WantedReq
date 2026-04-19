namespace WantedRec.Server.DTOs
{
      
    public class PersonFaceImageDto
    {
        public long FaceImageId { get; set; }
        public int PersonId { get; set; }
        public int? CameraId { get; set; }


        public string? ImageFileName { get; set; }
        public string? ImageFilePath { get; set; }
        public byte[]? FaceProcessedImage { get; set; }
 
        public ImageSource? ImageSource { get; set; }
        public DateTime? CapturedAt { get; set; }

        public bool IsActive { get; set; }
        public bool IsPrimary { get; set; }

        // وصف الوجه
        public FaceShape? FaceShape { get; set; }
        public SkinTone? SkinTone { get; set; }
        public NoseType? NoseType { get; set; }
        public NoseSize? NoseSize { get; set; }
        public EyeShape? EyeShape { get; set; }
        public EyeSize? EyeSize { get; set; }
        public EyeColor? EyeColor { get; set; }
        public EyebrowShape? EyebrowShape { get; set; }
        public EyebrowThickness? EyebrowThickness { get; set; }
        public MouthShape? MouthShape { get; set; }
        public LipThickness? LipThickness { get; set; }
        public BeardPresence? BeardPresence { get; set; }
        public BeardStyle? BeardStyle { get; set; }
        public MustachePresence? MustachePresence { get; set; }
        public MustacheStyle? MustacheStyle { get; set; }
        public HairPresence? HairPresence { get; set; }
        public HairStyle? HairStyle { get; set; }
        public HairLength? HairLength { get; set; }
        public HairColor? HairColor { get; set; }
        public GlassesType? GlassesType { get; set; }
        public HeadCoverType? HeadCoverType { get; set; }
        public string? SpecialMarks { get; set; }
        public string? DescriptionNotes { get; set; }

        // Embedding – عرض فقط معلومات عامة
        public short? EmbeddingDimension { get; set; }
        public string EmbeddingModel { get; set; } = string.Empty;
        public string EmbeddingVersion { get; set; } = string.Empty;
        public DateTime? EmbeddingCreatedAt { get; set; }
        public double? EmbeddingQualityScore { get; set; }

        // معلومات مراجعة
        public bool? GeneratedByAi { get; set; }
        public double? DescriptionConfidenceScore { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string ReviewNotes { get; set; } = string.Empty;

        // Camera مختصر
        public CameraSummaryDto? Camera { get; set; }
    }
}
