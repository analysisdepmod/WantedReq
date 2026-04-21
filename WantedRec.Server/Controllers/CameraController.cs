// ════════════════════════════════════════════════════════
//  WantedRec.Server/Controllers/CameraController.cs
// ════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace WantedRec.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CameraController : ControllerBase
    {
        private readonly ICameraService _cameraService;
        private readonly ILogger<CameraController> _logger;

        public CameraController(
            ICameraService cameraService,
            ILogger<CameraController> logger)
        {
            _cameraService = cameraService;
            _logger = logger;
        }

        // ── GET /api/cameras?isActive=true ────────────────────
        /// <summary>جلب قائمة الكاميرات — اختياري: فلترة بالحالة</summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<CameraDto>>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<List<CameraDto>>>> GetAllAsync(
            [FromQuery] bool? isActive = null,
            CancellationToken ct = default)
        {
            var cameras = await _cameraService.GetAllAsync(isActive, ct);

            return Ok(ApiResponse<List<CameraDto>>.Success(
                cameras,
                $"تم جلب {cameras.Count} كاميرا"));
        }

        // ── GET /api/cameras/{id} ─────────────────────────────
        /// <summary>جلب تفاصيل كاميرا واحدة مع إحصائياتها</summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<CameraDetailDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<CameraDetailDto>>> GetByIdAsync(
            int id,
            CancellationToken ct = default)
        {
            var camera = await _cameraService.GetByIdAsync(id, ct);

            if (camera is null)
                return NotFound(ApiResponse<CameraDetailDto>.Fail("الكاميرا غير موجودة"));

            // نضيف الإحصائيات للتفاصيل
            var stats = await _cameraService.GetStatsAsync(id, ct);
            _logger.LogInformation(
                "Camera {Id} fetched — Today:{Today} | Total:{Total}",
                id, stats.RecognitionsToday, stats.TotalRecognitions);

            // إذا تحتاج الـ stats في الـ response أضفها لـ CameraDetailDto
            // أو رجّعها كـ object مركّب
            return Ok(ApiResponse<CameraDetailDto>.Success(
                camera,
                $"تعرفات اليوم: {stats.RecognitionsToday}"));
        }

        // ── POST /api/cameras ─────────────────────────────────
        /// <summary>إضافة كاميرا جديدة</summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<CameraDetailDto>), (int)HttpStatusCode.Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<ApiResponse<CameraDetailDto>>> CreateAsync(
            [FromBody] CameraUpsertDto dto,
            CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<CameraDetailDto>.Fail(
                    string.Join(" | ", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage))));

            try
            {
                var camera = await _cameraService.CreateAsync(dto, ct);

                return CreatedAtAction(
                    actionName: nameof(GetByIdAsync),
                    routeValues: new { id = camera.CameraId },
                    value: ApiResponse<CameraDetailDto>.Success(
                                    camera, "تمت إضافة الكاميرا بنجاح"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating camera");
                return StatusCode(
                    (int)HttpStatusCode.InternalServerError,
                    ApiResponse<CameraDetailDto>.Fail("فشل إنشاء الكاميرا: " + ex.Message));
            }
        }

        // ── PUT /api/cameras/{id} ─────────────────────────────
        /// <summary>تحديث بيانات كاميرا موجودة</summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<CameraDetailDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<CameraDetailDto>>> UpdateAsync(
            int id,
            [FromBody] CameraUpsertDto dto,
            CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<CameraDetailDto>.Fail(
                    string.Join(" | ", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage))));

            try
            {
                var camera = await _cameraService.UpdateAsync(id, dto, ct);

                if (camera is null)
                    return NotFound(ApiResponse<CameraDetailDto>.Fail("الكاميرا غير موجودة"));

                return Ok(ApiResponse<CameraDetailDto>.Success(
                    camera, "تم تحديث الكاميرا بنجاح"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating camera {Id}", id);
                return StatusCode(
                    (int)HttpStatusCode.InternalServerError,
                    ApiResponse<CameraDetailDto>.Fail("فشل تحديث الكاميرا: " + ex.Message));
            }
        }

        // ── DELETE /api/cameras/{id} ──────────────────────────
        /// <summary>
        /// حذف كاميرا — لو فيها recognitions مرتبطة يصير تعطيل (soft delete)
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteAsync(
            int id,
            CancellationToken ct = default)
        {
            var deleted = await _cameraService.DeleteAsync(id, ct);

            if (!deleted)
                return NotFound(ApiResponse<bool>.Fail("الكاميرا غير موجودة"));

            return Ok(ApiResponse<bool>.Success(true, "تمت معالجة طلب الحذف"));
        }

        // ── PUT /api/cameras/{id}/activate ────────────────────
        /// <summary>تفعيل كاميرا</summary>
        [HttpPut("{id:int}/activate")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> ActivateAsync(
            int id,
            CancellationToken ct = default)
        {
            var result = await _cameraService.SetActiveAsync(id, true, ct);

            if (!result)
                return NotFound(ApiResponse<bool>.Fail("الكاميرا غير موجودة"));

            return Ok(ApiResponse<bool>.Success(true, "تم تفعيل الكاميرا"));
        }

        // ── PUT /api/cameras/{id}/deactivate ──────────────────
        /// <summary>تعطيل كاميرا</summary>
        [HttpPut("{id:int}/deactivate")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> DeactivateAsync(
            int id,
            CancellationToken ct = default)
        {
            var result = await _cameraService.SetActiveAsync(id, false, ct);

            if (!result)
                return NotFound(ApiResponse<bool>.Fail("الكاميرا غير موجودة"));

            return Ok(ApiResponse<bool>.Success(false, "تم تعطيل الكاميرا"));
        }

        // ── GET /api/cameras/{id}/stats ───────────────────────
        /// <summary>إحصائيات كاميرا: تعرفات اليوم، الإجمالي، آخر وقت</summary>
        [HttpGet("{id:int}/stats")]
        [ProducesResponseType(typeof(ApiResponse<CameraStatsDto>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<CameraStatsDto>>> GetStatsAsync(
            int id,
            CancellationToken ct = default)
        {
            var camera = await _cameraService.GetByIdAsync(id, ct);
            if (camera is null)
                return NotFound(ApiResponse<CameraStatsDto>.Fail("الكاميرا غير موجودة"));

            var stats = await _cameraService.GetStatsAsync(id, ct);
            return Ok(ApiResponse<CameraStatsDto>.Success(stats, "تم جلب الإحصائيات"));
        }
    }
}