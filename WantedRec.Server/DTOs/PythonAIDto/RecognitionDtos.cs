namespace WantedRec.Server.DTOs.PythonAIDto
{
    // ── Python يرجع هذا ──────────────────────────────────────
    public class FaceResultDto
    {
        public List<float> Bbox { get; set; } = [];
        public string Name { get; set; } = "Unknown";
        public float Score { get; set; }
        public List<float>? Embedding { get; set; }
    }

    public class RecognizeResponseDto
    {
        public List<FaceResultDto> Faces { get; set; } = [];
    }

    // ── ASP يرجع هذا للـ React ───────────────────────────────
    public class RecognitionFaceDto
    {
        public float[] Bbox { get; set; } = [];
        public string Name { get; set; } = "Unknown";
        public float Score { get; set; }
        public bool IsKnown { get; set; }
        public PersonListItemDto? Person { get; set; }
        public string? PrimaryImageBase64 { get; set; }
    }

    public class RecognitionResultDto
    {
        public List<RecognitionFaceDto> Faces { get; set; } = [];
        public int TotalFaces { get; set; }
        public int KnownFaces { get; set; }
    }
}