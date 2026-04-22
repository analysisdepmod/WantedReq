 
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
        private readonly IRecognitionNotifier _notifier;    

        private const string FaceImagesCacheKey = "PersonFaceImages_cache";
        private const string RecognitionsCacheKey = "RecognitionsCacheKey_cache";
        private const double Threshold = 0.5;

        public RecognitionController(
            IFaceAiService faceAiService,
            ApplicationDbContext context,
            IMapper mapper,
            ILogger<RecognitionController> logger,
            IWebHostEnvironment env,
            IMemoryCache cache,
            IRecognitionNotifier notifier)
        {
            _faceAiService = faceAiService;
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _env = env;
            _cache = cache;
            _notifier = notifier;
        }

        // ══════════════════════════════════════════════════════
        //  GET /api/recognition — سجل التعرف مع فلاتر
        // ══════════════════════════════════════════════════════
        [HttpGet]
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

                if (cameraId.HasValue) query = query.Where(r => r.CameraId == cameraId);
                if (personId.HasValue) query = query.Where(r => r.PersonId == personId);
                if (recognitionStatus.HasValue) query = query.Where(r => (int)r.RecognitionStatus == recognitionStatus);
                if (isMatch.HasValue) query = query.Where(r => r.IsMatch == isMatch);

                if (!string.IsNullOrWhiteSpace(fromDate) && DateTime.TryParse(fromDate, out var dtFrom))
                    query = query.Where(r => r.RecognitionDateTime >= dtFrom);
                if (!string.IsNullOrWhiteSpace(toDate) && DateTime.TryParse(toDate, out var dtTo))
                    query = query.Where(r => r.RecognitionDateTime < dtTo.AddDays(1));

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

                return Ok(ApiResponse<List<RecognitionDto>>.Success(items, $"تم جلب {items.Count} سجل"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching recognitions");
                return StatusCode(500, ApiResponse<List<RecognitionDto>>.Fail(ex.Message));
            }
        }

        // ══════════════════════════════════════════════════════
        //  PUT /api/recognition/{id}/review
        // ══════════════════════════════════════════════════════
        [HttpPut("{id:long}/review")]
        [ProducesResponseType(typeof(ApiResponse<bool>), (int)HttpStatusCode.OK)]
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
            if (dto.ThresholdUsed.HasValue) recognition.ThresholdUsed = dto.ThresholdUsed.Value;

            await _context.SaveChangesAsync(ct);
            _cache.Remove(RecognitionsCacheKey);

            return Ok(ApiResponse<bool>.Success(true, "تم تحديث حالة التعرف"));
        }

        // ══════════════════════════════════════════════════════
        //  POST /api/recognition/identify
        // ══════════════════════════════════════════════════════
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
                var pyResult = await _faceAiService.RecognizeAsync(file, cancellationToken);

                if (!pyResult.Faces.Any())
                    return Ok(ApiResponse<RecognitionResultDto>.Success(
                        new RecognitionResultDto { Faces = [], TotalFaces = 0, KnownFaces = 0 },
                        "لم يتم كشف أي وجه"));

                var dbFaceImages = await GetCachedFaceImagesAsync(cancellationToken);
                var lastRecognitionsToday = await GetCachedRecognitionsAsync(cancellationToken);

                var faceDtos = new List<RecognitionFaceDto>();
                var recognitionsToSave = new List<Recognition>();
                string? snapshotPath = null;

                // ── جلب اسم الكاميرا للإشعار ─────────────────
                string? cameraName = null;
                if (cameraId.HasValue)
                    cameraName = await _context.Cameras
                        .AsNoTracking()
                        .Where(c => c.CameraId == cameraId)
                        .Select(c => c.Name)
                        .FirstOrDefaultAsync(cancellationToken);

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

                            var primaryImage = await _context.PersonFaceImages
                                .Where(fi => fi.PersonId == personId && fi.IsActive && fi.IsPrimary && fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken)
                                ?? await _context.PersonFaceImages
                                .Where(fi => fi.PersonId == personId && fi.IsActive && fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken);

                            if (primaryImage?.FaceProcessedImage is not null)
                                faceDto.PrimaryImageBase64 = Convert.ToBase64String(primaryImage.FaceProcessedImage);

                            if (ShouldSaveRecognition(personId, cameraId, lastRecognitionsToday))
                            {
                                var imageName = $"{faceDto.Name}-{cameraId}-{DateTime.Now:HH-mm-ss}";
                                snapshotPath ??= await SaveSnapshotAsync(file, imageName, cancellationToken);

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
                                lastRecognitionsToday.Add(newRec);

                                // ── إرسال SignalR فوراً ──────────────
                                _ = _notifier.NotifyAsync(new RecognitionSignalDto
                                {
                                    PersonId = personId,
                                    PersonFullName = faceDto.Name,
                                    CameraId = cameraId,
                                    CameraName = cameraName,
                                    Score = match.Value.Score,
                                    IsSuspect = match.Value.Person.Suspect is not null,
                                    PrimaryImageBase64 = faceDto.PrimaryImageBase64,
                                    SnapshotPath = snapshotPath,
                                    RecognitionDateTime = DateTime.Now,
                                }, cancellationToken);
                            }
                        }
                    }

                    faceDtos.Add(faceDto);
                }

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
                return StatusCode(500, ApiResponse<RecognitionResultDto>.Fail(ex.Message));
            }
        }

        // ══════════════════════════════════════════════════════
        //  Private helpers
        // ══════════════════════════════════════════════════════

        private async Task<List<PersonFaceImage>> GetCachedFaceImagesAsync(CancellationToken ct) =>
            await _cache.GetOrCreateAsync(FaceImagesCacheKey, async _ =>
                await _context.PersonFaceImages.AsNoTracking()
                    .Include(fi => fi.Person).ThenInclude(p => p!.Suspect)
                    .Where(fi => fi.IsActive && fi.EmbeddingVector != null && fi.Person != null && fi.Person.IsActive)
                    .ToListAsync(ct)) ?? [];

        private async Task<List<Recognition>> GetCachedRecognitionsAsync(CancellationToken ct) =>
            await _cache.GetOrCreateAsync(RecognitionsCacheKey, async _ =>
            {
                var today = DateTime.Today;
                return await _context.Recognitions
                    .Where(r => r.PersonId != null && r.IsMatch == true && r.RecognitionDateTime.Date == today)
                    .ToListAsync(ct);
            }) ?? [];

        private static bool ShouldSaveRecognition(int personId, int? cameraId, List<Recognition> list)
        {
            if (!list.Any(r => r.PersonId == personId)) return true;
            var last = list.Where(r => r.PersonId == personId).OrderByDescending(r => r.RecognitionDateTime).First();
            return last.CameraId != cameraId;
        }

        private async Task<string> SaveSnapshotAsync(IFormFile file, string imageName, CancellationToken ct)
        {
            var dateFolder = DateTime.Today.ToString("yyyy-MM-dd");
            var folder = Path.Combine(_env.WebRootPath, "snapshots", dateFolder);
            Directory.CreateDirectory(folder);
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext)) ext = ".jpg";
            var safeName = string.Concat(imageName.Split(Path.GetInvalidFileNameChars()));
            var fullPath = Path.Combine(folder, $"{safeName}{ext}");
            await using var stream = System.IO.File.Create(fullPath);
            await file.CopyToAsync(stream, ct);
            return $"snapshots/{dateFolder}/{safeName}{ext}";
        }

        private (float Score, Person? Person)? FindBestMatch(List<float> query, List<PersonFaceImage> db)
        {
            var qn = L2Normalize(query.ToArray());
            double best = -1; PersonFaceImage? bestMatch = null;
            foreach (var fi in db)
            {
                if (fi.EmbeddingVector is null) continue;
                var s = CosineSimilarity(qn, L2Normalize(fi.EmbeddingVector));
                if (s > best) { best = s; bestMatch = fi; }
            }
            if (bestMatch is null || best < Threshold) return null;
            return (MathF.Round((float)best, 3), bestMatch.Person);
        }

        private static float[] L2Normalize(float[] v)
        {
            double n = Math.Sqrt(v.Sum(x => (double)x * x));
            return n < 1e-12 ? v : v.Select(x => (float)(x / n)).ToArray();
        }

        private static double CosineSimilarity(float[] a, float[] b)
        {
            if (a.Length != b.Length) return -1;
            double d = 0;
            for (int i = 0; i < a.Length; i++) d += a[i] * b[i];
            return d;
        }
    }
}