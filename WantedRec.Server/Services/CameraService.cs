// ════════════════════════════════════════════════════════
//  WantedRec.Server/Services/CameraService.cs
//
//  سجّل في Program.cs:
//      builder.Services.AddScoped<ICameraService, CameraService>();
// ════════════════════════════════════════════════════════

namespace WantedRec.Server.Services
{
    public class CameraService : ICameraService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CameraService> _logger;

        public CameraService(ApplicationDbContext context, ILogger<CameraService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ── GetAllAsync ───────────────────────────────────────
        public async Task<List<CameraDto>> GetAllAsync(
       bool? isActive = null,
       string? userId = null,
       int? userDeviceId = null,
       CancellationToken ct = default)
        {
            var query = _context.Cameras.AsNoTracking().AsQueryable();

            if (isActive.HasValue)
                query = query.Where(c => c.IsActive == isActive.Value);

            // الكامرات الشبكية تظهر للجميع
            // الكامرات المحلية فقط للجهاز الحالي التابع للمستخدم الحالي
            query = query.Where(c =>
                !string.IsNullOrWhiteSpace(c.StreamUrl) ||
                (
                    c.StreamUrl == null &&
                    c.UserDeviceId != null &&
                    userDeviceId != null &&
                    c.UserDeviceId == userDeviceId &&
                    c.UserDevice!.UserId == userId
                )
            );

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
                    StreamUrl = c.StreamUrl,
                    LocalDeviceIndex = c.LocalDeviceIndex,
                    UserDeviceId = c.UserDeviceId,
                })
                .ToListAsync(ct);
        }

        // ── GetByIdAsync ──────────────────────────────────────
        public async Task<CameraDetailDto?> GetByIdAsync(
            int id,
            CancellationToken ct = default)
        {
            var c = await _context.Cameras.AsNoTracking()
                .FirstOrDefaultAsync(x => x.CameraId == id, ct);

            return c is null ? null : ToDetail(c);
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
                "Camera created → Id:{Id} | Name:{Name} | Type:{Type}",
                camera.CameraId, camera.Name,
                camera.StreamUrl is null ? "local" :
                camera.StreamUrl.StartsWith("rtsp") ? "rtsp" : "mjpeg");

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
            _logger.LogInformation("Camera updated → Id:{Id}", id);
            return ToDetail(camera);
        }

        // ── DeleteAsync ───────────────────────────────────────
        public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            var camera = await _context.Cameras.FindAsync([id], ct);
            if (camera is null) return false;

            var hasRecognitions = await _context.Recognitions.AnyAsync(r => r.CameraId == id, ct);
            if (hasRecognitions)
            {
                camera.IsActive = false;
                _logger.LogWarning("Camera {Id} deactivated (has recognitions)", id);
            }
            else
            {
                _context.Cameras.Remove(camera);
            }

            await _context.SaveChangesAsync(ct);
            return true;
        }

        // ── SetActiveAsync ────────────────────────────────────
        public async Task<bool> SetActiveAsync(int id, bool isActive, CancellationToken ct = default)
        {
            var camera = await _context.Cameras.FindAsync([id], ct);
            if (camera is null) return false;

            camera.IsActive = isActive;
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Camera {Id} → IsActive={v}", id, isActive);
            return true;
        }

        // ── GetStatsAsync ─────────────────────────────────────
        public async Task<CameraStatsDto> GetStatsAsync(int id, CancellationToken ct = default)
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
        //  Helpers
        // ══════════════════════════════════════════════════════

        private static void Apply(Camera target, CameraUpsertDto src)
        {
            target.Name = src.Name;
            target.Code = src.Code;
            target.Description = src.Description;
            target.IpAddress = src.IpAddress;
            target.StreamUrl = string.IsNullOrWhiteSpace(src.StreamUrl) ? null : src.StreamUrl;
            target.LocalDeviceIndex = target.StreamUrl is null ? src.LocalDeviceIndex : null;
            target.UserDeviceId = target.StreamUrl is null ? src.UserDeviceId : null;
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

        private static CameraDetailDto ToDetail(Camera c) => new()
        {
            CameraId = c.CameraId,
            Name = c.Name,
            Code = c.Code,
            IpAddress = c.IpAddress,
            Area = c.Area,
            IsIndoor = c.IsIndoor,
            IsActive = c.IsActive,
            StreamUrl = c.StreamUrl,
            LocalDeviceIndex = c.LocalDeviceIndex,
            Description = c.Description,
            Latitude = c.Latitude,
            Longitude = c.Longitude,
            Floor = c.Floor,
            InstallationDate = c.InstallationDate,
            LastMaintenanceDate = c.LastMaintenanceDate,
            Notes = c.Notes,
        };
    }
}