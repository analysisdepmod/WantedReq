using WantedRec.Server.DTOs.PythonAIDto;

namespace WantedRec.Server.Interfaces
{
    public interface IFaceAiService
    {
        Task<FaceEmbeddingResult> ProcessFaceAsync(
            IFormFile file,
        CancellationToken cancellationToken = default);
        Task<RecognizeResponseDto> RecognizeAsync(IFormFile file, CancellationToken cancellationToken = default);
    }
}
