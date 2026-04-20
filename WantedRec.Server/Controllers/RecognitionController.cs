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

        public RecognitionController(
            IFaceAiService faceAiService,
            ApplicationDbContext context,
            IMapper mapper,
            ILogger<RecognitionController> logger, IWebHostEnvironment env,IMemoryCache cache)
        {
            _faceAiService = faceAiService;
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _env = env;
            _cache = cache;
        }

        private async Task<List<PersonFaceImage>> GetCachedFaceImagesAsync(CancellationToken cancellationToken)
        {
            return await _cache.GetOrCreateAsync(FaceImagesCacheKey, async entry =>
            {
               // entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);  
               // entry.SlidingExpiration = TimeSpan.FromMinutes(5);

                return await _context.PersonFaceImages
               .AsNoTracking()
               .Include(fi => fi.Person)
               .Where(fi =>
                   fi.IsActive &&
                   fi.EmbeddingVector != null &&
                   fi.Person != null &&
                   fi.Person.IsActive)
               .ToListAsync(cancellationToken);


              
            }) ?? [];
        }




        private async Task<List<Recognition>> GetCachedRecognitionsAsync(CancellationToken cancellationToken)
        {
            return await _cache.GetOrCreateAsync(RecognitionsCacheKey, async entry =>
            {
                // entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);  
                // entry.SlidingExpiration = TimeSpan.FromMinutes(5);
                var today = DateTime.Today;

              

                return await _context.Recognitions
                    .Where(r =>
                        r.PersonId != null &&
                        r.IsMatch == true &&
                        r.RecognitionDateTime.Date == today).ToListAsync();



            }) ?? [];
        }



        [HttpPost("identify")]
        [ProducesResponseType(typeof(ApiResponse<RecognitionResultDto>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<RecognitionResultDto>>> IdentifyAsync(IFormFile file, [FromHeader(Name = "X-Camera-Id")] int? cameraId,  CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<RecognitionResultDto>.Fail("الصورة مطلوبة"));

            try
            {
                // 1. أرسل الصورة لـ Python
                var pyResult = await _faceAiService.RecognizeAsync(file, cancellationToken);

                if (!pyResult.Faces.Any())
                    return Ok(ApiResponse<RecognitionResultDto>.Success(
                        new RecognitionResultDto { Faces = [], TotalFaces = 0, KnownFaces = 0 },
                        "لم يتم كشف أي وجه"));

                // 2. جلب كل الـ embeddings من DB

                var dbFaceImages = await GetCachedFaceImagesAsync(cancellationToken);
                // 3. جلب آخر قيد لكل شخص اليوم — مرة واحدة قبل الحلقة
                var lastRecognitionsToday = await GetCachedRecognitionsAsync(cancellationToken);

                var faceDtos = new List<RecognitionFaceDto>();
                var recognitionsToSave = new List<Recognition>();
                string? snapshotPath = null; // تحفظ مرة واحدة فقط لو في تعرف

                foreach (var face in pyResult.Faces)
                {
                    var faceDto = new RecognitionFaceDto
                    {
                        Bbox = face.Bbox.ToArray(),
                        Name = "Unknown",
                        Score = 0,
                        IsKnown = false,
                    };

                    if (face.Embedding != null && face.Embedding.Count > 0 && dbFaceImages.Any())
                    {
                        var match = FindBestMatch(face.Embedding, dbFaceImages);

                        if (match != null)
                        {
                            var personId = match.Value.Person!.PersonId;

                            faceDto.IsKnown = true;
                            faceDto.Score = match.Value.Score;
                            faceDto.Name = match.Value.Person?.FullName ?? "Unknown";
                            faceDto.Person = _mapper.Map<PersonListItemDto>(match.Value.Person);

                            // جلب الصورة الرئيسية
                            var primaryImage = await _context.PersonFaceImages
                                .Where(fi =>
                                    fi.PersonId == personId &&
                                    fi.IsActive &&
                                    fi.IsPrimary &&
                                    fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken);

                            primaryImage ??= await _context.PersonFaceImages
                                .Where(fi =>
                                    fi.PersonId == personId &&
                                    fi.IsActive &&
                                    fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken);

                            if (primaryImage?.FaceProcessedImage != null)
                                faceDto.PrimaryImageBase64 = Convert.ToBase64String(
                                    primaryImage.FaceProcessedImage);

                            // ✅ منطق الفلترة
                            var shouldSave = ShouldSaveRecognition( personId, cameraId, lastRecognitionsToday);

                            if (shouldSave)
                            {
                                string ImageName = $"{faceDto.Name}-{cameraId}-{DateTime.Now.ToString("HH-MM")}";
                                // حفظ الصورة مرة واحدة فقط لأول تعرف ناجح
                                snapshotPath ??= await SaveSnapshotAsync(file, ImageName, cancellationToken);

                                recognitionsToSave.Add(new Recognition
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
                                });

                                // ✅ حدّث الـ dictionary لو في نفس الشخص مرتين بنفس الطلب
                                lastRecognitionsToday.Add( recognitionsToSave.Last());
                            }
                        }
                        else
                        {
                            // وجه غير معروف
                            //recognitionsToSave.Add(new Recognition
                            //{
                            //    PersonId = null,
                            //    CameraId = cameraId,
                            //    RecognitionScore = null,
                            //    IsMatch = false,
                            //    ThresholdUsed = Threshold,
                            //    RecognitionStatus = RecognitionStatus.Pending,
                            //    RecognitionDateTime = DateTime.UtcNow,
                            //    CreatedAt = DateTime.UtcNow,
                            //    BBoxX1 = face.Bbox.Count > 3 ? (int)face.Bbox[0] : null,
                            //    BBoxY1 = face.Bbox.Count > 3 ? (int)face.Bbox[1] : null,
                            //    BBoxX2 = face.Bbox.Count > 3 ? (int)face.Bbox[2] : null,
                            //    BBoxY2 = face.Bbox.Count > 3 ? (int)face.Bbox[3] : null,
                            //});
                        }
                    }

                    faceDtos.Add(faceDto);
                }

                if (recognitionsToSave.Any())
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
        /// <summary>
        /// آخر قيد نفس الكاميرا = تجاهل / آخر قيد كاميرا مختلفة = أضف
        /// </summary>
        private static bool ShouldSaveRecognition(
            int personId,
            int? cameraId,
            List<Recognition> lastRecognitionsToday)
        {
            if (!lastRecognitionsToday.Any(i => i.PersonId == personId)) return true;
            Recognition recognition = lastRecognitionsToday.Last();

            if (recognition.CameraId == cameraId && recognition.PersonId == personId) return false;

            return true;
        }

        /// <summary>
        /// يحفظ الصورة في wwwroot/snapshots/yyyy-MM-dd/
        /// </summary>
        private async Task<string> SaveSnapshotAsync(
            IFormFile file,
            string ImageName,
            CancellationToken ct)
        {
            var dateFolder = DateTime.Today.ToString("yyyy-MM-dd");
            var folder = Path.Combine(_env.WebRootPath, "snapshots", dateFolder);
            Directory.CreateDirectory(folder);

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext)) ext = ".jpg";

            var fileName = $"{ImageName}{ext}";
            var fullPath = Path.Combine(folder, fileName);

            await using var stream = System.IO.File.Create(fullPath);
            await file.CopyToAsync(stream, ct);

            // المسار النسبي للحفظ في DB
            return $"snapshots/{dateFolder}/{fileName}";
        }
        // ── Threshold ─────────────────────────────────────────
        private const double Threshold = 0.5;

        // ── FindBestMatch ────────────────────────────────────
        private (float Score, Person? Person)? FindBestMatch(
            List<float> queryEmbedding,
            List<PersonFaceImage> dbFaceImages)
        {
            var queryNorm = L2Normalize(queryEmbedding.ToArray());
            double bestScore = -1.0;
            PersonFaceImage? bestMatch = null;

            foreach (var fi in dbFaceImages)
            {
                if (fi.EmbeddingVector == null) continue;
                var dbNorm = L2Normalize(fi.EmbeddingVector);
                double score = CosineSimilarity(queryNorm, dbNorm);
                if (score > bestScore) { bestScore = score; bestMatch = fi; }
            }

            _logger.LogInformation(
                "FindBestMatch → BestScore: {Score:F4} | Person: {Name} | Passed: {Passed}",
                bestScore,
                bestMatch?.Person?.FullName ?? "null",
                bestScore >= Threshold);

            if (bestMatch == null || bestScore < Threshold) return null;

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
            for (int i = 0; i < a.Length; i++)
                dot += a[i] * b[i];
            return dot;
        }
    }
}