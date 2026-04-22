using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WantedRec.Server.Data;
using WantedRec.Server.DTOs;
using WantedRec.Server.Models;

namespace WantedRec.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DevicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");
        }

        [HttpGet("my")]
        public async Task<ActionResult<ApiResponse<List<UserDeviceDto>>>> GetMyDevices(CancellationToken ct = default)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(ApiResponse<List<UserDeviceDto>>.Fail("المستخدم غير مسجل الدخول"));

            var devices = await _context.UserDevices
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.IsActive)
                .OrderByDescending(x => x.LastSeenAt)
                .Select(x => new UserDeviceDto
                {
                    UserDeviceId = x.UserDeviceId,
                    Name = x.Name,
                    IsActive = x.IsActive,
                    CreatedAt = x.CreatedAt,
                    LastSeenAt = x.LastSeenAt,
                })
                .ToListAsync(ct);

            return Ok(ApiResponse<List<UserDeviceDto>>.Success(devices, "تم جلب الأجهزة"));
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<UserDeviceDto>>> Register(
            [FromBody] RegisterUserDeviceDto dto,
            CancellationToken ct = default)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(ApiResponse<UserDeviceDto>.Fail("المستخدم غير مسجل الدخول"));

            var entity = new UserDevice
            {
                UserId = userId,
                Name = dto.Name.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastSeenAt = DateTime.UtcNow,
            };

            _context.UserDevices.Add(entity);
            await _context.SaveChangesAsync(ct);

            var result = new UserDeviceDto
            {
                UserDeviceId = entity.UserDeviceId,
                Name = entity.Name,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                LastSeenAt = entity.LastSeenAt,
            };

            return Ok(ApiResponse<UserDeviceDto>.Success(result, "تم تسجيل الجهاز"));
        }

        [HttpPost("{id:int}/use")]
        public async Task<ActionResult<ApiResponse<UserDeviceDto>>> UseDevice(int id, CancellationToken ct = default)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(ApiResponse<UserDeviceDto>.Fail("المستخدم غير مسجل الدخول"));

            var device = await _context.UserDevices
                .FirstOrDefaultAsync(x => x.UserDeviceId == id && x.UserId == userId && x.IsActive, ct);

            if (device is null)
                return NotFound(ApiResponse<UserDeviceDto>.Fail("الجهاز غير موجود"));

            device.LastSeenAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            var result = new UserDeviceDto
            {
                UserDeviceId = device.UserDeviceId,
                Name = device.Name,
                IsActive = device.IsActive,
                CreatedAt = device.CreatedAt,
                LastSeenAt = device.LastSeenAt,
            };

            return Ok(ApiResponse<UserDeviceDto>.Success(result, "تم اعتماد الجهاز"));
        }
    }
}