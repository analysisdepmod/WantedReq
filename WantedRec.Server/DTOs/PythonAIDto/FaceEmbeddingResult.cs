 

 

    namespace WantedRec.Server.DTOs.PythonAIDto
    {
        public class FaceEmbeddingResult
        {
            public List<float>? EmbeddingVector { get; set; }
            public int? EmbeddingDimension { get; set; }
            public string? EmbeddingModel { get; set; }
            public string? EmbeddingVersion { get; set; }
            public DateTime? EmbeddingCreatedAt { get; set; }
            public double? EmbeddingQualityScore { get; set; }
            public string? ProcessedImageBase64 { get; set; }
            public string? ImageFileName { get; set; }
            public string? ImageFilePath { get; set; }
            public int DetectedFacesCount { get; set; }
        }
    }

 
