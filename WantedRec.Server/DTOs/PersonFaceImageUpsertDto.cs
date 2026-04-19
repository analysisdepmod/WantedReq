namespace WantedRec.Server.DTOs
{
    public class PersonFaceImageUpsertDto
    {
        public long  FaceImageId { get; set; }  // null = جديد, otherwise Update
        public int? CameraId { get; set; }

        // بيانات الصورة الأساسية
        public string? ImageFileName { get; set; } 
        public string? ImageFilePath { get; set; } 
        public string? ImageFile { get; set; } 

        public ImageSource? ImageSource { get; set; }
        public DateTime? CapturedAt { get; set; }

        public bool IsActive { get; set; }
        public bool IsPrimary { get; set; }

        // وصف الوجه (نصي)
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

        // لا نسمح للعميل مباشرة بتعديل Embedding غالبًا
    }
}
