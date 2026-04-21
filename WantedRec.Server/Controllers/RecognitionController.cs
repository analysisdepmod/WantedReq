// ════════════════════════════════════════════════════════
//  WantedRec.Server/Controllers/RecognitionController.cs
//  نسخة مكتملة — تشمل:
//    GET  /api/recognitions          (سجل التعرف مع فلاتر)
//    POST /api/recognitions/identify (التعرف من صورة)
//    PUT  /api/recognitions/{id}/review (مراجعة سجل)
// ════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Net;
using WantedRec.Server.DTOs.PythonAIDto;

namespace WantedRec.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecognitionController : ControllerBase
    {
        private readonly IFaceAiService _faceAiService;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<RecognitionController> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly IMemoryCache _cache;

        private const string FaceImagesCacheKey = "PersonFaceImages_cache";
        private const string RecognitionsCacheKey = "RecognitionsCacheKey_cache";
        private const double Threshold = 0.5;

        public RecognitionController(
            IFaceAiService faceAiService,
            ApplicationDbContext context,
            IMapper mapper,
            ILogger<RecognitionController> logger,
            IWebHostEnvironment env,
            IMemoryCache cache)
        {
            _faceAiService = faceAiService;
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _env = env;
            _cache = cache;
        }

        // ══════════════════════════════════════════════════════
        //  GET /api/recognitions
        // ══════════════════════════════════════════════════════
        /// <summary>
        /// جلب سجل التعرف مع فلترة اختيارية
        /// </summary>
        [HttpGet("recognitions")]
        [ProducesResponseType(typeof(ApiResponse<List<RecognitionDto>>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<List<RecognitionDto>>>> GetAsync(
            [FromQuery] int? cameraId = null,
            [FromQuery] int? recognitionStatus = null,
            [FromQuery] string? fromDate = null,
            [FromQuery] string? toDate = null,
            [FromQuery] bool? isMatch = null,
            [FromQuery] int? personId = null,
            [FromQuery] int pageSize = 200,
            CancellationToken ct = default)
        {
            try
            {
                var query = _context.Recognitions
                    .AsNoTracking()
                    .Include(r => r.Person)
                    .Include(r => r.Camera)
                    .AsQueryable();

                // ── فلاتر ────────────────────────────────────
                if (cameraId.HasValue)
                    query = query.Where(r => r.CameraId == cameraId.Value);

                if (personId.HasValue)
                    query = query.Where(r => r.PersonId == personId.Value);

                if (recognitionStatus.HasValue)
                    query = query.Where(r => (int)r.RecognitionStatus == recognitionStatus.Value);

                if (isMatch.HasValue)
                    query = query.Where(r => r.IsMatch == isMatch.Value);

                if (!string.IsNullOrWhiteSpace(fromDate) &&
                    DateTime.TryParse(fromDate, out var dtFrom))
                    query = query.Where(r => r.RecognitionDateTime >= dtFrom);

                if (!string.IsNullOrWhiteSpace(toDate) &&
                    DateTime.TryParse(toDate, out var dtTo))
                    query = query.Where(r => r.RecognitionDateTime < dtTo.AddDays(1));

                // ── جلب وتحويل ───────────────────────────────
                var items = await query
                    .OrderByDescending(r => r.RecognitionDateTime)
                    .Take(Math.Clamp(pageSize, 1, 500))
                    .Select(r => new RecognitionDto
                    {
                        RecognitionId = r.RecognitionId,
                        PersonId = r.PersonId,
                        PersonFullName = r.Person != null ? r.Person.FullName : null,
                        FaceImageId = r.FaceImageId,
                        SnapshotPath = r.SnapshotPath,
                        CameraId = r.CameraId,
                        CameraName = r.Camera != null ? r.Camera.Name : null,
                        RecognitionScore = r.RecognitionScore,
                        IsMatch = r.IsMatch,
                        ThresholdUsed = r.ThresholdUsed,
                        RecognitionStatus = r.RecognitionStatus,
                        RecognitionDateTime = r.RecognitionDateTime,
                        BBoxX1 = r.BBoxX1,
                        BBoxY1 = r.BBoxY1,
                        BBoxX2 = r.BBoxX2,
                        BBoxY2 = r.BBoxY2,
                        FrameNumber = r.FrameNumber,
                        Latitude = r.Latitude,
                        Longitude = r.Longitude,
                        LocationDescription = r.LocationDescription,
                        CreatedAt = r.CreatedAt,
                        ReviewNotes = r.ReviewNotes,
                    })
                    .ToListAsync(ct);

                return Ok(ApiResponse<List<RecognitionDto>>.Success(
                    items,
                    $"تم جلب {items.Count} سجل"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching recognitions");
                return StatusCode(
                    (int)HttpStatusCode.InternalServerError,
                    ApiResponse<List<RecognitionDto>>.Fail(ex.Message));
            }
        }

        // ══════════════════════════════════════════════════════
        //  PUT /api/recognitions/{id}/review
        // ══════════════════════════════════════════════════════
        /// <summary>مراجعة وتحديث حالة سجل تعرف</summary>
        [HttpPut("{id:long}/review")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> ReviewAsync(
            long id,
            [FromBody] RecognitionReviewDto dto,
            CancellationToken ct = default)
        {
            var recognition = await _context.Recognitions.FindAsync([id], ct);

            if (recognition is null)
                return NotFound(ApiResponse<bool>.Fail("السجل غير موجود"));

            recognition.IsMatch = dto.IsMatch;
            recognition.RecognitionStatus = dto.RecognitionStatus;
            recognition.ReviewNotes = dto.ReviewNotes;

            if (dto.ThresholdUsed.HasValue)
                recognition.ThresholdUsed = dto.ThresholdUsed.Value;

            await _context.SaveChangesAsync(ct);

            // مسح الـ cache لأن الحالة تغيرت
            _cache.Remove(RecognitionsCacheKey);

            _logger.LogInformation(
                "Recognition {Id} reviewed → Status:{Status} | IsMatch:{Match}",
                id, dto.RecognitionStatus, dto.IsMatch);

            return Ok(ApiResponse<bool>.Success(true, "تم تحديث حالة التعرف"));
        }

        // ══════════════════════════════════════════════════════
        //  POST /api/recognitions/identify
        // ══════════════════════════════════════════════════════
        /// <summary>التعرف على وجه من صورة — النقطة الرئيسية للكاميرات</summary>
        [HttpPost("identify")]
        [ProducesResponseType(typeof(ApiResponse<RecognitionResultDto>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<RecognitionResultDto>>> IdentifyAsync(
            IFormFile file,
            [FromHeader(Name = "X-Camera-Id")] int? cameraId,
            CancellationToken cancellationToken = default)
        {
            if (file is null || file.Length == 0)
                return BadRequest(ApiResponse<RecognitionResultDto>.Fail("الصورة مطلوبة"));

            try
            {
                // 1. إرسال الصورة لـ Python AI
                var pyResult = await _faceAiService.RecognizeAsync(file, cancellationToken);

                if (!pyResult.Faces.Any())
                    return Ok(ApiResponse<RecognitionResultDto>.Success(
                        new RecognitionResultDto { Faces = [], TotalFaces = 0, KnownFaces = 0 },
                        "لم يتم كشف أي وجه"));

                // 2. جلب embeddings من الـ cache
                var dbFaceImages = await GetCachedFaceImagesAsync(cancellationToken);

                // 3. جلب آخر تعرف لكل شخص اليوم
                var lastRecognitionsToday = await GetCachedRecognitionsAsync(cancellationToken);

                var faceDtos = new List<RecognitionFaceDto>();
                var recognitionsToSave = new List<Recognition>();
                string? snapshotPath = null;

                foreach (var face in pyResult.Faces)
                {
                    var faceDto = new RecognitionFaceDto
                    {
                        Bbox = face.Bbox.ToArray(),
                        Name = "Unknown",
                        Score = 0,
                        IsKnown = false,
                    };

                    if (face.Embedding is { Count: > 0 } && dbFaceImages.Any())
                    {
                        var match = FindBestMatch(face.Embedding, dbFaceImages);

                        if (match is not null)
                        {
                            var personId = match.Value.Person!.PersonId;

                            faceDto.IsKnown = true;
                            faceDto.Score = match.Value.Score;
                            faceDto.Name = match.Value.Person.FullName;
                            faceDto.Person = _mapper.Map<PersonListItemDto>(match.Value.Person);

                            // جلب الصورة الرئيسية
                            var primaryImage = await _context.PersonFaceImages
                                .Where(fi => fi.PersonId == personId && fi.IsActive
                                          && fi.IsPrimary && fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken);

                            primaryImage ??= await _context.PersonFaceImages
                                .Where(fi => fi.PersonId == personId && fi.IsActive
                                          && fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken);

                            if (primaryImage?.FaceProcessedImage is not null)
                                faceDto.PrimaryImageBase64 =
                                    Convert.ToBase64String(primaryImage.FaceProcessedImage);

                            // منطق الفلترة: نفس الكاميرا ونفس الشخص → تجاهل
                            if (ShouldSaveRecognition(personId, cameraId, lastRecognitionsToday))
                            {
                                var imageName =
                                    $"{faceDto.Name}-{cameraId}-{DateTime.Now:HH-mm-ss}";

                                snapshotPath ??= await SaveSnapshotAsync(
                                    file, imageName, cancellationToken);

                                var newRec = new Recognition
                                {
                                    PersonId = personId,
                                    CameraId = cameraId,
                                    RecognitionScore = match.Value.Score,
                                    FaceImageId = primaryImage?.FaceImageId,
                                    SnapshotPath = snapshotPath,
                                    IsMatch = true,
                                    ThresholdUsed = Threshold,
                                    RecognitionStatus = RecognitionStatus.Pending,
                                    RecognitionDateTime = DateTime.Now,
                                    CreatedAt = DateTime.Now,
                                    BBoxX1 = face.Bbox.Count > 3 ? (int)face.Bbox[0] : null,
                                    BBoxY1 = face.Bbox.Count > 3 ? (int)face.Bbox[1] : null,
                                    BBoxX2 = face.Bbox.Count > 3 ? (int)face.Bbox[2] : null,
                                    BBoxY2 = face.Bbox.Count > 3 ? (int)face.Bbox[3] : null,
                                };

                                recognitionsToSave.Add(newRec);
                                lastRecognitionsToday.Add(newRec); // تحديث الـ cache المحلي
                            }
                        }
                    }

                    faceDtos.Add(faceDto);
                }

                // حفظ دفعة واحدة
                if (recognitionsToSave.Count > 0)
                {
                    _context.Recognitions.AddRange(recognitionsToSave);
                    await _context.SaveChangesAsync(cancellationToken);
                    _cache.Remove(RecognitionsCacheKey);
                }

                var resultDto = new RecognitionResultDto
                {
                    Faces = faceDtos,
                    TotalFaces = faceDtos.Count,
                    KnownFaces = faceDtos.Count(f => f.IsKnown),
                };

                return Ok(ApiResponse<RecognitionResultDto>.Success(
                    resultDto,
                    $"تم كشف {resultDto.TotalFaces} وجه، تم التعرف على {resultDto.KnownFaces}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during face identification");
                return StatusCode(
                    (int)HttpStatusCode.InternalServerError,
                    ApiResponse<RecognitionResultDto>.Fail(ex.Message));
            }
        }

        // ══════════════════════════════════════════════════════
        //  Private helpers
        // ══════════════════════════════════════════════════════

        private async Task<List<PersonFaceImage>> GetCachedFaceImagesAsync(
            CancellationToken ct)
        {
            return await _cache.GetOrCreateAsync(FaceImagesCacheKey, async _ =>
                await _context.PersonFaceImages
                    .AsNoTracking()
                    .Include(fi => fi.Person)
                    .Where(fi =>
                        fi.IsActive &&
                        fi.EmbeddingVector != null &&
                        fi.Person != null &&
                        fi.Person.IsActive)
                    .ToListAsync(ct)) ?? [];
        }

        private async Task<List<Recognition>> GetCachedRecognitionsAsync(
            CancellationToken ct)
        {
            return await _cache.GetOrCreateAsync(RecognitionsCacheKey, async _ =>
            {
                var today = DateTime.Today;
                return await _context.Recognitions
                    .Where(r =>
                        r.PersonId != null &&
                        r.IsMatch == true &&
                        r.RecognitionDateTime.Date == today)
                    .ToListAsync(ct);
            }) ?? [];
        }

        /// <summary>
        /// نفس الشخص + نفس الكاميرا → تجاهل (آخر قيد اليوم)
        /// نفس الشخص + كاميرا مختلفة  → أضف
        /// </summary>
        private static bool ShouldSaveRecognition(
            int personId,
            int? cameraId,
            List<Recognition> lastRecognitionsToday)
        {
            // لو ما تعرفنا عليه اليوم إطلاقاً → أضف
            if (!lastRecognitionsToday.Any(r => r.PersonId == personId))
                return true;

            // آخر قيد لهذا الشخص
            var last = lastRecognitionsToday
                .Where(r => r.PersonId == personId)
                .OrderByDescending(r => r.RecognitionDateTime)
                .First();

            // نفس الكاميرا → تجاهل
            return last.CameraId != cameraId;
        }

        private async Task<string> SaveSnapshotAsync(
            IFormFile file,
            string imageName,
            CancellationToken ct)
        {
            var dateFolder = DateTime.Today.ToString("yyyy-MM-dd");
            var folder = Path.Combine(_env.WebRootPath, "snapshots", dateFolder);
            Directory.CreateDirectory(folder);

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext)) ext = ".jpg";

            // تنظيف اسم الملف من أي أحرف غير مسموحة
            var safeName = string.Concat(imageName
                .Split(Path.GetInvalidFileNameChars()));

            var fileName = $"{safeName}{ext}";
            var fullPath = Path.Combine(folder, fileName);

            await using var stream = System.IO.File.Create(fullPath);
            await file.CopyToAsync(stream, ct);

            return $"snapshots/{dateFolder}/{fileName}";
        }

        private (float Score, Person? Person)? FindBestMatch(
            List<float> queryEmbedding,
            List<PersonFaceImage> dbFaceImages)
        {
            var queryNorm = L2Normalize(queryEmbedding.ToArray());
            double bestScore = -1.0;
            PersonFaceImage? bestMatch = null;

            foreach (var fi in dbFaceImages)
            {
                if (fi.EmbeddingVector is null) continue;
                var dbNorm = L2Normalize(fi.EmbeddingVector);
                double score = CosineSimilarity(queryNorm, dbNorm);
                if (score > bestScore) { bestScore = score; bestMatch = fi; }
            }

            _logger.LogInformation(
                "FindBestMatch → Score:{Score:F4} | Person:{Name} | Pass:{Pass}",
                bestScore,
                bestMatch?.Person?.FullName ?? "null",
                bestScore >= Threshold);

            if (bestMatch is null || bestScore < Threshold) return null;

            return (Score: MathF.Round((float)bestScore, 3), Person: bestMatch.Person);
        }

        private static float[] L2Normalize(float[] v)
        {
            double norm = Math.Sqrt(v.Sum(x => (double)x * x));
            if (norm < 1e-12) return v;
            return v.Select(x => (float)(x / norm)).ToArray();
        }

        private static double CosineSimilarity(float[] a, float[] b)
        {
            if (a.Length != b.Length) return -1.0;
            double dot = 0;
            for (int i = 0; i < a.Length; i++) dot += a[i] * b[i];
            return dot;
        }
    }
}