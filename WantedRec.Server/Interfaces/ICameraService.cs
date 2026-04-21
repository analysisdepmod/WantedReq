// ════════════════════════════════════════════════════════
//  WantedRec.Server/Services/ICameraService.cs
// ════════════════════════════════════════════════════════

namespace WantedRec.Server.Services
{
    public interface ICameraService
    {
        Task<List<CameraDto>> GetAllAsync(bool? isActive = null, CancellationToken ct = default);
        Task<CameraDetailDto?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<CameraDetailDto> CreateAsync(CameraUpsertDto dto, CancellationToken ct = default);
        Task<CameraDetailDto?> UpdateAsync(int id, CameraUpsertDto dto, CancellationToken ct = default);
        Task<bool> DeleteAsync(int id, CancellationToken ct = default);
        Task<bool> SetActiveAsync(int id, bool isActive, CancellationToken ct = default);
        Task<CameraStatsDto> GetStatsAsync(int id, CancellationToken ct = default);
    }

    public class CameraStatsDto
    {
        public int RecognitionsToday { get; set; }
        public int TotalRecognitions { get; set; }
        public DateTime? LastRecognitionAt { get; set; }
    }
}