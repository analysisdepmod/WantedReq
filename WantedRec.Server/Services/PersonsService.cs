namespace WantedRec.Server.Services
{
    using AutoMapper.QueryableExtensions;
    using DocumentFormat.OpenXml.Spreadsheet;

    public class PersonsService : IPersonService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IFaceAiService _faceAiService;
        private readonly ILogger<PersonsService> _logger;

        public PersonsService(
            ApplicationDbContext context,
            IMapper mapper,
            IFaceAiService faceAiService,
            ILogger<PersonsService> logger)
        {
            _context = context;
            _mapper = mapper;
            _faceAiService = faceAiService;
            _logger = logger;
        }

        // ─────────────────────────────────────────────
        //  Helper: base64 → IFormFile
        // ─────────────────────────────────────────────
        private static IFormFile Base64ToFormFile(
            string base64,
            string fileName,
            string contentType)
        {
            var bytes = Convert.FromBase64String(base64);
            var stream = new MemoryStream(bytes);
            return new FormFile(stream, 0, bytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType,
            };
        }

        // ─────────────────────────────────────────────
        //  Helper: يستدعي AI ويعبئ PersonFaceImage
        // ─────────────────────────────────────────────
        private async Task EnrichWithAiAsync(
            PersonFaceImage faceImage,
            string imageBase64,          // ✅ دائماً base64 وليس اسم ملف
            CancellationToken cancellationToken)
        {
            try
            {
                var formFile = Base64ToFormFile(imageBase64, "face.jpg", "image/jpeg");
                var aiResult = await _faceAiService.ProcessFaceAsync(formFile, cancellationToken);

                faceImage.EmbeddingVector = aiResult.EmbeddingVector?.ToArray();
                faceImage.EmbeddingDimension = (short)(aiResult.EmbeddingDimension ?? 0);
                faceImage.EmbeddingModel = aiResult.EmbeddingModel;
                faceImage.EmbeddingVersion = aiResult.EmbeddingVersion;
                faceImage.EmbeddingQualityScore = (float)(aiResult.EmbeddingQualityScore ?? 0);
                faceImage.EmbeddingCreatedAt = aiResult.EmbeddingCreatedAt;
                faceImage.GeneratedByAi = true;
                faceImage.ImageFileName = aiResult.ImageFileName;
                faceImage.ImageFilePath = aiResult.ImageFilePath;

                if (!string.IsNullOrWhiteSpace(aiResult.ProcessedImageBase64))
                    faceImage.FaceProcessedImage = Convert.FromBase64String(aiResult.ProcessedImageBase64);
                else
                    faceImage.FaceProcessedImage = [];
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Face AI processing failed for faceImage.");
            }
        }

        // ─────────────────────────────────────────────
        //  Helper: ينشئ PersonFaceImage جديد مع AI
        // ─────────────────────────────────────────────
        private async Task<PersonFaceImage> BuildNewFaceImageAsync(
            PersonFaceImageUpsertDto imgDto,
            int personId,
            CancellationToken cancellationToken)
        {
            var faceImage = _mapper.Map<PersonFaceImage>(imgDto);
            faceImage.FaceImageId = 0;
            faceImage.PersonId = personId;
            faceImage.IsActive = true;
            faceImage.CreatedAt = DateTime.UtcNow;

            // ✅ ImageFile هو base64 القادم من React
            if (!string.IsNullOrWhiteSpace(imgDto.ImageFile))
                await EnrichWithAiAsync(faceImage, imgDto.ImageFile, cancellationToken);

            return faceImage;
        }

        // ─────────────────────────────────────────────
        //  Helper: يحمّل Person مع Includes
        // ─────────────────────────────────────────────
        private async Task<PersonDetailDto> LoadPersonDetailAsync(
            int personId,
            CancellationToken cancellationToken)
        {
            var entity = await _context.Persons
                .AsNoTracking()
                .Include(p => p.FaceImages)
                .Include(p => p.Suspect)
                .Include(p => p.Recognitions)
                .FirstAsync(p => p.PersonId == personId, cancellationToken);

            return _mapper.Map<PersonDetailDto>(entity);
        }

        // ─────────────────────────────────────────────
        //  CREATE
        // ─────────────────────────────────────────────
        public async Task<PersonDetailDto> CreateAsync(
            PersonUpsertDto dto,
            CancellationToken cancellationToken = default)
        {
            dto.PersonId = null;

            var person = _mapper.Map<Person>(dto);
            person.CreatedAt = DateTime.UtcNow;
            person.IsActive = true;
            person.FaceImages = [];

            if (dto.FaceImages != null && dto.FaceImages.Any())
            {
                foreach (var imgDto in dto.FaceImages)
                {
                    if (imgDto == null) continue;

                    var faceImage = _mapper.Map<PersonFaceImage>(imgDto);
                    faceImage.IsActive = true;
                    faceImage.CreatedAt = DateTime.UtcNow;

                    // ✅ ImageFile = base64 من React
                    if (!string.IsNullOrWhiteSpace(imgDto.ImageFile))
                        await EnrichWithAiAsync(faceImage, imgDto.ImageFile, cancellationToken);
                    if( faceImage.FaceProcessedImage is not null)
                            person.FaceImages.Add(faceImage);
                }
            }

            _context.Persons.Add(person);
            await _context.SaveChangesAsync(cancellationToken);

            return await LoadPersonDetailAsync(person.PersonId, cancellationToken);
        }

        // ─────────────────────────────────────────────
        //  UPDATE
        // ─────────────────────────────────────────────
        public async Task<PersonDetailDto?> UpdateAsync(
            PersonUpsertDto dto,
            CancellationToken cancellationToken = default)
        {
            if (!dto.PersonId.HasValue) return null;

            var person = await _context.Persons
                .Include(p => p.FaceImages)
                .Include(p => p.Suspect)
                .Include(p => p.Recognitions)
                .FirstOrDefaultAsync(p => p.PersonId == dto.PersonId.Value, cancellationToken);

            if (person is null) return null;

            _mapper.Map(dto, person);
            person.UpdatedAt = DateTime.UtcNow;

            if (dto.FaceImages != null)
            {
                var existingImages = person.FaceImages.ToList();

                HashSet<long> NeededIds = dto.FaceImages.Select(i => i.FaceImageId).ToHashSet();

               var NotNeededIds= (from e in existingImages
                 where !NeededIds.Contains(e.FaceImageId)
                 select e.FaceImageId).ToList();

                var NotNeededRows = (from e in existingImages
                                    where  NotNeededIds.Contains(e.FaceImageId)
                select e ).ToList();

                if(NotNeededRows.Count > 0)
                {
                    _context.PersonFaceImages.RemoveRange(NotNeededRows);
                    await _context.SaveChangesAsync();
                }
             



                foreach (var imgDto in dto.FaceImages)
                {
                    if (imgDto == null) continue;

                    if (imgDto.FaceImageId is > 0)
                    {
                        var existing = existingImages.FirstOrDefault(fi => fi.FaceImageId == imgDto.FaceImageId);

                        if (existing is null)
                        {
                            // Id غير موجود → نعامله كصورة جديدة
                            var newImg = await BuildNewFaceImageAsync(
                                imgDto, person.PersonId, cancellationToken);
                            person.FaceImages.Add(newImg);
                        }
                        else
                        {
                            _mapper.Map(imgDto, existing);
                            existing.UpdatedAt = DateTime.UtcNow;

                            // ✅ ImageFile = base64 الجديد من React (وليس ImageFileName)
                            if (!string.IsNullOrWhiteSpace(imgDto.ImageFile))
                                await EnrichWithAiAsync(existing, imgDto.ImageFile, cancellationToken);
                        }
                    }
                    else
                    {
                        var newImg = await BuildNewFaceImageAsync(
                            imgDto, person.PersonId, cancellationToken);
                        person.FaceImages.Add(newImg);
                    }
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            return await LoadPersonDetailAsync(person.PersonId, cancellationToken);
        }

        // ─────────────────────────────────────────────
        //
        //
        //  BY ID
        // ─────────────────────────────────────────────
        public async Task<PersonDetailDto?> GetByIdAsync(
            int personId,
            CancellationToken cancellationToken = default)
        {
            var entity = await _context.Persons
                .AsNoTracking()
                .Include(p => p.FaceImages)
                .Include(p => p.Suspect)
                .Include(p => p.Recognitions)
                .FirstOrDefaultAsync(p => p.PersonId == personId, cancellationToken);

            var x = _mapper.Map<PersonDetailDto>(entity);

            return entity is null ? null : _mapper.Map<PersonDetailDto>(entity);
        }

        // ─────────────────────────────────────────────
        //  GET FACE IMAGES
        // ─────────────────────────────────────────────
        public async Task<IEnumerable<PersonFaceImageDto>?> GetFaceImagesAsync(
            int personId,
            CancellationToken cancellationToken = default)
        {
            var exists = await _context.Persons
                .AsNoTracking()
                .AnyAsync(p => p.PersonId == personId, cancellationToken);

            if (!exists) return null;

            return await _context.PersonFaceImages
                .AsNoTracking()
                .Include(fi => fi.Camera)
                .Where(fi => fi.PersonId == personId && fi.IsActive)
                .ProjectTo<PersonFaceImageDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);
        }

        // ─────────────────────────────────────────────
        //  GET LIST
        // ─────────────────────────────────────────────
        public async Task<IEnumerable<PersonListItemDto>> GetListAsync(
            string? search,
            bool? isActive,
            bool? isDeleted,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Persons
                .AsNoTracking()
                .Include(p => p.FaceImages)
                .Include(p => p.Suspect)
                .Include(p => p.Recognitions)
                .AsQueryable();



            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                query = query.Where(p =>
                    p.FullName.Contains(search) ||
                    (p.NationalId != null && p.NationalId.Contains(search)) ||
                    (p.ExternalCode != null && p.ExternalCode.Contains(search)));
            }

            if (isActive.HasValue)
                query = query.Where(p => p.IsActive == isActive.Value);      
            
            if (isDeleted.HasValue)
                query = query.Where(p => p.IsDeleted == isDeleted.Value);

            var data= await query
                .OrderByDescending(p => p.CreatedAt)
                .ThenBy(p => p.FullName)
                .ProjectTo<PersonListItemDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);

            return data;
        }

        // ─────────────────────────────────────────────
        //  SET ACTIVE
        // ─────────────────────────────────────────────
        public async Task<bool> SetActiveAsync(
            int personId,
            bool isActive,
            CancellationToken cancellationToken = default)
        {
            var person = await _context.Persons
                .FirstOrDefaultAsync(p => p.PersonId == personId, cancellationToken);

            if (person is null) return false;

            person.IsActive = isActive;
            person.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        // ─────────────────────────────────────────────
        //  SOFT DELETE
        // ─────────────────────────────────────────────
        public async Task<bool> SoftDeleteAsync(
            int personId,
            CancellationToken cancellationToken = default)
        {
            var person = await _context.Persons
                .FirstOrDefaultAsync(p => p.PersonId == personId, cancellationToken);

            if (person is null) return false;

            person.IsDeleted = true;
            person.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}