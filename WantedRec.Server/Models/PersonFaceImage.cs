namespace WantedRec.Server.Models
{
    public class PersonFaceImage:UserInfo
    {
        public long FaceImageId { get; set; }
        public int PersonId { get; set; }
        public int? CameraId { get; set; }
 
        public string? ReviewedByUserId { get; set; }

        public string? ImageFileName { get; set; }
        public string? ImageFilePath { get; set; }
        public byte[]? FaceProcessedImage { get; set; }

        // ✅ int وليس string
        public int? ImageSource { get; set; }
        public int? FaceShape { get; set; }
        public int? SkinTone { get; set; }
        public int? NoseType { get; set; }
        public int? NoseSize { get; set; }
        public int? EyeShape { get; set; }
        public int? EyeSize { get; set; }
        public int? EyeColor { get; set; }
        public int? EyebrowShape { get; set; }
        public int? EyebrowThickness { get; set; }
        public int? MouthShape { get; set; }
        public int? LipThickness { get; set; }
        public int? BeardPresence { get; set; }
        public int? BeardStyle { get; set; }
        public int? MustachePresence { get; set; }
        public int? MustacheStyle { get; set; }
        public int? HairPresence { get; set; }
        public int? HairStyle { get; set; }
        public int? HairLength { get; set; }
        public int? HairColor { get; set; }
        public int? GlassesType { get; set; }
        public int? HeadCoverType { get; set; }
        public string? SpecialMarks { get; set; }
        public string? DescriptionNotes { get; set; }
        public float? DescriptionConfidenceScore { get; set; }

        // AI Embedding
        public float[]? EmbeddingVector { get; set; }
        public short EmbeddingDimension { get; set; }
        public string? EmbeddingModel { get; set; }
        public string? EmbeddingVersion { get; set; }
        public DateTime? EmbeddingCreatedAt { get; set; }
        public float EmbeddingQualityScore { get; set; }
        public bool GeneratedByAi { get; set; }

        public DateTime? CapturedAt { get; set; }
        public bool IsActive { get; set; }
        public bool IsPrimary { get; set; }
 
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewNotes { get; set; }

        // Navigation
        public Person? Person { get; set; }
        public Camera? Camera { get; set; }
 
        public ApplicationUser? ReviewedByUser { get; set; }
        public ICollection<Recognition> Recognitions { get; set; } = [];
    }
}
