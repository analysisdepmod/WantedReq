// ════════════════════════════════════════════════════════
//  WantedRec.Server/Services/CameraService.cs
//
//  ⚠️  سجّل في Program.cs:
//      builder.Services.AddScoped<ICameraService, CameraService>();
// ════════════════════════════════════════════════════════

namespace WantedRec.Server.Services
{
    public class CameraService : ICameraService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CameraService> _logger;

        public CameraService(
            ApplicationDbContext context,
            ILogger<CameraService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ── GetAllAsync ───────────────────────────────────────
        public async Task<List<CameraDto>> GetAllAsync(
            bool? isActive = null,
            CancellationToken ct = default)
        {
            var query = _context.Cameras.AsNoTracking().AsQueryable();

            if (isActive.HasValue)
                query = query.Where(c => c.IsActive == isActive.Value);

            return await query
                .OrderBy(c => c.Area)
                .ThenBy(c => c.Name)
                .Select(c => new CameraDto
                {
                    CameraId = c.CameraId,
                    Name = c.Name,
                    Code = c.Code,
                    IpAddress = c.IpAddress,
                    Area = c.Area,
                    IsIndoor = c.IsIndoor,
                    IsActive = c.IsActive,
                })
                .ToListAsync(ct);
        }

        // ── GetByIdAsync ──────────────────────────────────────
        public async Task<CameraDetailDto?> GetByIdAsync(
            int id,
            CancellationToken ct = default)
        {
            var cam = await _context.Cameras
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CameraId == id, ct);

            return cam is null ? null : ToDetail(cam);
        }

        // ── CreateAsync ───────────────────────────────────────
        public async Task<CameraDetailDto> CreateAsync(
            CameraUpsertDto dto,
            CancellationToken ct = default)
        {
            var camera = new Camera();
            Apply(camera, dto);

            _context.Cameras.Add(camera);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Camera created → Id:{Id} | Name:{Name} | IP:{IP}",
                camera.CameraId, camera.Name, camera.IpAddress);

            return ToDetail(camera);
        }

        // ── UpdateAsync ───────────────────────────────────────
        public async Task<CameraDetailDto?> UpdateAsync(
            int id,
            CameraUpsertDto dto,
            CancellationToken ct = default)
        {
            var camera = await _context.Cameras.FindAsync([id], ct);
            if (camera is null) return null;

            Apply(camera, dto);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Camera updated → Id:{Id} | Name:{Name}",
                camera.CameraId, camera.Name);

            return ToDetail(camera);
        }

        // ── DeleteAsync ───────────────────────────────────────
        public async Task<bool> DeleteAsync(
            int id,
            CancellationToken ct = default)
        {
            var camera = await _context.Cameras.FindAsync([id], ct);
            if (camera is null) return false;

            // تحقق لو في recognitions مرتبطة
            var hasRecognitions = await _context.Recognitions
                .AnyAsync(r => r.CameraId == id, ct);

            if (hasRecognitions)
            {
                // soft delete: نعطلها بدل الحذف لو في بيانات مرتبطة
                camera.IsActive = false;
                _logger.LogWarning(
                    "Camera {Id} has recognitions — deactivated instead of deleted", id);
            }
            else
            {
                _context.Cameras.Remove(camera);
            }

            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Camera {Id} processed (delete/deactivate)", id);
            return true;
        }

        // ── SetActiveAsync ────────────────────────────────────
        public async Task<bool> SetActiveAsync(
            int id,
            bool isActive,
            CancellationToken ct = default)
        {
            var camera = await _context.Cameras.FindAsync([id], ct);
            if (camera is null) return false;

            camera.IsActive = isActive;
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Camera {Id} → IsActive={IsActive}", id, isActive);

            return true;
        }

        // ── GetStatsAsync ─────────────────────────────────────
        public async Task<CameraStatsDto> GetStatsAsync(
            int id,
            CancellationToken ct = default)
        {
            var today = DateTime.Today;

            var stats = await _context.Recognitions
                .AsNoTracking()
                .Where(r => r.CameraId == id)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Today = g.Count(r => r.RecognitionDateTime.Date == today),
                    LastAt = g.Max(r => (DateTime?)r.RecognitionDateTime),
                })
                .FirstOrDefaultAsync(ct);

            return new CameraStatsDto
            {
                TotalRecognitions = stats?.Total ?? 0,
                RecognitionsToday = stats?.Today ?? 0,
                LastRecognitionAt = stats?.LastAt,
            };
        }

        // ══════════════════════════════════════════════════════
        //  Private helpers
        // ══════════════════════════════════════════════════════

        /// <summary>تطبيق قيم الـ DTO على الـ Entity</summary>
        private static void Apply(Camera target, CameraUpsertDto src)
        {
            target.Name = src.Name;
            target.Code = src.Code;
            target.Description = src.Description;
            target.IpAddress = src.IpAddress;
            target.StreamUrl = src.StreamUrl;
            target.Latitude = src.Latitude;
            target.Longitude = src.Longitude;
            target.Floor = src.Floor;
            target.Area = src.Area;
            target.IsIndoor = src.IsIndoor;
            target.IsActive = src.IsActive;
            target.InstallationDate = src.InstallationDate;
            target.LastMaintenanceDate = src.LastMaintenanceDate;
            target.Notes = src.Notes;
        }

        /// <summary>تحويل Entity إلى DetailDto</summary>
        private static CameraDetailDto ToDetail(Camera c) => new()
        {
            CameraId = c.CameraId,
            Name = c.Name,
            Code = c.Code,
            IpAddress = c.IpAddress,
            Area = c.Area,
            IsIndoor = c.IsIndoor,
            IsActive = c.IsActive,
            Description = c.Description,
            StreamUrl = c.StreamUrl,
            Latitude = c.Latitude,
            Longitude = c.Longitude,
            Floor = c.Floor,
            InstallationDate = c.InstallationDate,
            LastMaintenanceDate = c.LastMaintenanceDate,
            Notes = c.Notes,
        };
    }
}