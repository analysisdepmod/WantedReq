using Microsoft.AspNetCore.Mvc;
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

        public RecognitionController(
            IFaceAiService faceAiService,
            ApplicationDbContext context,
            IMapper mapper,
            ILogger<RecognitionController> logger)
        {
            _faceAiService = faceAiService;
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpPost("identify")]
        [ProducesResponseType(typeof(ApiResponse<RecognitionResultDto>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<RecognitionResultDto>>> IdentifyAsync(
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<RecognitionResultDto>.Fail("الصورة مطلوبة"));

            try
            {
                // 1. أرسل الصورة لـ Python للكشف والـ embedding
                var pyResult = await _faceAiService.RecognizeAsync(file, cancellationToken);

                if (!pyResult.Faces.Any())
                    return Ok(ApiResponse<RecognitionResultDto>.Success(
                        new RecognitionResultDto { Faces = [], TotalFaces = 0, KnownFaces = 0 },
                        "لم يتم كشف أي وجه"));

                // 2. جلب كل الـ embeddings من DB
                var dbFaceImages = await _context.PersonFaceImages
                    .AsNoTracking()
                    .Include(fi => fi.Person)
                    .Where(fi =>
                        fi.IsActive &&
                        fi.EmbeddingVector != null &&
                        fi.Person != null &&
                        fi.Person.IsActive)
                    .ToListAsync(cancellationToken);

                // 3. لكل وجه، ابحث عن أقرب تطابق
                var faceDtos = new List<RecognitionFaceDto>();

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
                            faceDto.IsKnown = true;
                            faceDto.Score = match.Value.Score;
                            faceDto.Name = match.Value.Person?.FullName ?? "Unknown";
                            faceDto.Person = _mapper.Map<PersonListItemDto>(match.Value.Person);

                            // جلب الصورة الرئيسية
                            var primaryImage = await _context.PersonFaceImages
                                .Where(fi =>
                                    fi.PersonId == match.Value.Person!.PersonId &&
                                    fi.IsActive &&
                                    fi.IsPrimary &&
                                    fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken);

                            primaryImage ??= await _context.PersonFaceImages
                                .Where(fi =>
                                    fi.PersonId == match.Value.Person!.PersonId &&
                                    fi.IsActive &&
                                    fi.FaceProcessedImage != null)
                                .FirstOrDefaultAsync(cancellationToken);

                            if (primaryImage?.FaceProcessedImage != null)
                                faceDto.PrimaryImageBase64 = Convert.ToBase64String(
                                    primaryImage.FaceProcessedImage);
                        }
                    }

                    faceDtos.Add(faceDto);
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

        // ── Threshold: نفس قيمة الـ live camera (0.5 cosine similarity) ──
        private const double Threshold = 0.5;

        private (float Score, Person? Person)? FindBestMatch(
            List<float> queryEmbedding,
            List<PersonFaceImage> dbFaceImages)
        {
            // ✅ L2 Normalize الـ query (نفس ما يسوي Python)
            var queryNorm = L2Normalize(queryEmbedding.ToArray());
            double bestScore = -1.0;
            PersonFaceImage? bestMatch = null;

            foreach (var fi in dbFaceImages)
            {
                if (fi.EmbeddingVector == null) continue;

                // ✅ L2 Normalize الـ DB embedding
                var dbNorm = L2Normalize(fi.EmbeddingVector);

                // ✅ Cosine Similarity = dot product بعد L2 Normalize
                double score = CosineSimilarity(queryNorm, dbNorm);

                if (score > bestScore)
                {
                    bestScore = score;
                    bestMatch = fi;
                }
            }

            _logger.LogInformation(
                "FindBestMatch → BestScore: {Score:F4} | Threshold: {Thr} | " +
                "Person: {Name} | Passed: {Passed}",
                bestScore,
                Threshold,
                bestMatch?.Person?.FullName ?? "null",
                bestScore >= Threshold);

            if (bestMatch == null || bestScore < Threshold) return null;

            return (Score: MathF.Round((float)bestScore, 3), Person: bestMatch.Person);
        }

        // ── L2 Normalize ─────────────────────────────────────
        private static float[] L2Normalize(float[] v)
        {
            double norm = Math.Sqrt(v.Sum(x => (double)x * x));
            if (norm < 1e-12) return v;
            return v.Select(x => (float)(x / norm)).ToArray();
        }

        // ── Cosine Similarity ─────────────────────────────────
        // بعد L2Normalize، dot product = cosine similarity
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