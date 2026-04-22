using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace WantedRec.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CamerasController : ControllerBase
    {
        private readonly ICameraService _cameraService;
        private readonly ILogger<CamerasController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public CamerasController(
            ICameraService cameraService,
            ILogger<CamerasController> logger,
            IHttpClientFactory httpClientFactory)
        {
            _cameraService = cameraService;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<CameraDto>>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<List<CameraDto>>>> GetAllAsync(
            [FromQuery] bool? isActive = null,
            [FromHeader(Name = "X-User-Device-Id")] int? userDeviceId = null,
            CancellationToken ct = default)
        {
            var userId =
                User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            var cameras = await _cameraService.GetAllAsync(isActive, userId, userDeviceId, ct);
            return Ok(ApiResponse<List<CameraDto>>.Success(cameras, $"تم جلب {cameras.Count} كاميرا"));
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<CameraDetailDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<CameraDetailDto>>> GetByIdAsync(
            int id, CancellationToken ct = default)
        {
            var camera = await _cameraService.GetByIdAsync(id, ct);
            if (camera is null)
                return NotFound(ApiResponse<CameraDetailDto>.Fail("الكاميرا غير موجودة"));

            var stats = await _cameraService.GetStatsAsync(id, ct);
            camera.RecognitionsToday = stats.RecognitionsToday;
            camera.TotalRecognitions = stats.TotalRecognitions;
            camera.LastRecognitionAt = stats.LastRecognitionAt;

            return Ok(ApiResponse<CameraDetailDto>.Success(camera,
                $"تعرفات اليوم: {stats.RecognitionsToday}"));
        }

        [HttpGet("{id:int}/stats")]
        [ProducesResponseType(typeof(ApiResponse<CameraStatsDto>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<CameraStatsDto>>> GetStatsAsync(
            int id, CancellationToken ct = default)
        {
            var camera = await _cameraService.GetByIdAsync(id, ct);
            if (camera is null)
                return NotFound(ApiResponse<CameraStatsDto>.Fail("الكاميرا غير موجودة"));

            var stats = await _cameraService.GetStatsAsync(id, ct);
            return Ok(ApiResponse<CameraStatsDto>.Success(stats, "تم جلب الإحصائيات"));
        }

        [HttpGet("{id:int}/snapshot")]
        public async Task<IActionResult> GetSnapshotAsync(
            int id, CancellationToken ct = default)
        {
            var camera = await _cameraService.GetByIdAsync(id, ct);
            if (camera is null)
                return NotFound("الكاميرا غير موجودة");

            if (string.IsNullOrWhiteSpace(camera.StreamUrl))
                return BadRequest("هذه كاميرا محلية — لا تحتاج proxy");

            try
            {
                byte[] imageBytes;

                if (camera.StreamUrl.StartsWith("rtsp://", StringComparison.OrdinalIgnoreCase))
                {
                    imageBytes = await CaptureRtspFrameAsync(camera.StreamUrl, id, ct);
                }
                else
                {
                    imageBytes = await CaptureMjpegFrameAsync(camera.StreamUrl, ct);
                }

                return File(imageBytes, "image/jpeg");
            }
            catch (TimeoutException)
            {
                _logger.LogWarning("Snapshot timeout for camera {Id}", id);
                return StatusCode(504, "انتهت مهلة الاتصال بالكاميرا");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Snapshot error for camera {Id}", id);
                return StatusCode(500, "فشل جلب الصورة من الكاميرا");
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<CameraDetailDto>), (int)HttpStatusCode.Created)]
        public async Task<ActionResult<ApiResponse<CameraDetailDto>>> CreateAsync(
            [FromBody] CameraUpsertDto dto, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<CameraDetailDto>.Fail(
                    string.Join(" | ", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage))));
            try
            {
                var camera = await _cameraService.CreateAsync(dto, ct);
                return Ok(ApiResponse<CameraDetailDto>.Success(camera, "تمت إضافة الكاميرا بنجاح"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<CameraDetailDto>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating camera");
                return StatusCode(
                    (int)HttpStatusCode.InternalServerError,
                    ApiResponse<CameraDetailDto>.Fail("فشل إنشاء الكاميرا: " + ex.Message));
            }
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<CameraDetailDto>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<CameraDetailDto>>> UpdateAsync(
            int id, [FromBody] CameraUpsertDto dto, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<CameraDetailDto>.Fail(
                    string.Join(" | ", ModelState.Values
                        .SelectMany(v => v.Errors).Select(e => e.ErrorMessage))));
            try
            {
                var camera = await _cameraService.UpdateAsync(id, dto, ct);
                if (camera is null)
                    return NotFound(ApiResponse<CameraDetailDto>.Fail("الكاميرا غير موجودة"));

                return Ok(ApiResponse<CameraDetailDto>.Success(camera, "تم تحديث الكاميرا بنجاح"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<CameraDetailDto>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating camera {Id}", id);
                return StatusCode(500, ApiResponse<CameraDetailDto>.Fail(ex.Message));
            }
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteAsync(
            int id, CancellationToken ct = default)
        {
            var deleted = await _cameraService.DeleteAsync(id, ct);
            if (!deleted)
                return NotFound(ApiResponse<bool>.Fail("الكاميرا غير موجودة"));

            return Ok(ApiResponse<bool>.Success(true, "تمت معالجة طلب الحذف"));
        }

        [HttpPut("{id:int}/activate")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<bool>>> ActivateAsync(
            int id, CancellationToken ct = default)
        {
            var result = await _cameraService.SetActiveAsync(id, true, ct);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("الكاميرا غير موجودة"));

            return Ok(ApiResponse<bool>.Success(true, "تم تفعيل الكاميرا"));
        }

        [HttpPut("{id:int}/deactivate")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<bool>>> DeactivateAsync(
            int id, CancellationToken ct = default)
        {
            var result = await _cameraService.SetActiveAsync(id, false, ct);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("الكاميرا غير موجودة"));

            return Ok(ApiResponse<bool>.Success(false, "تم تعطيل الكاميرا"));
        }

        private async Task<byte[]> CaptureRtspFrameAsync(
            string streamUrl, int cameraId, CancellationToken ct)
        {
            var tempFile = Path.Combine(
                Path.GetTempPath(),
                $"snap_{cameraId}_{Guid.NewGuid():N}.jpg");

            var args =
                $"-rtsp_transport tcp " +
                $"-i \"{streamUrl}\" " +
                $"-vframes 1 -q:v 3 " +
                $"-y \"{tempFile}\"";

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var process = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "ffmpeg",
                    Arguments = args,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                }
            };

            try
            {
                process.Start();
                await process.WaitForExitAsync(cts.Token);
            }
            catch (OperationCanceledException)
            {
                try { process.Kill(); } catch { }
                throw new TimeoutException();
            }

            if (!System.IO.File.Exists(tempFile) || new FileInfo(tempFile).Length == 0)
                throw new InvalidOperationException($"ffmpeg فشل في جلب frame من {streamUrl}");

            var bytes = await System.IO.File.ReadAllBytesAsync(tempFile, ct);
            System.IO.File.Delete(tempFile);
            return bytes;
        }

        private async Task<byte[]> CaptureMjpegFrameAsync(string streamUrl, CancellationToken ct)
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(8);

            using var response = await client.GetAsync(
                streamUrl,
                HttpCompletionOption.ResponseHeadersRead,
                ct);

            response.EnsureSuccessStatusCode();

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "";

            if (contentType.Contains("jpeg") || contentType.Contains("image"))
                return await response.Content.ReadAsByteArrayAsync(ct);

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            return await ReadFirstMjpegFrameAsync(stream, ct);
        }

        private static async Task<byte[]> ReadFirstMjpegFrameAsync(
            Stream stream, CancellationToken ct)
        {
            var buffer = new byte[65536];
            var collected = new MemoryStream();
            bool inFrame = false;

            while (true)
            {
                var read = await stream.ReadAsync(buffer, ct);
                if (read == 0) break;

                for (int i = 0; i < read - 1; i++)
                {
                    if (!inFrame && buffer[i] == 0xFF && buffer[i + 1] == 0xD8)
                    {
                        inFrame = true;
                        collected.SetLength(0);
                    }

                    if (inFrame)
                    {
                        collected.WriteByte(buffer[i]);

                        if (buffer[i] == 0xFF && buffer[i + 1] == 0xD9)
                        {
                            collected.WriteByte(buffer[i + 1]);
                            return collected.ToArray();
                        }
                    }
                }

                if (collected.Length > 5_000_000)
                    throw new InvalidOperationException("MJPEG frame too large");
            }

            throw new InvalidOperationException("لم يتم العثور على JPEG frame في الـ stream");
        }
    }
}
