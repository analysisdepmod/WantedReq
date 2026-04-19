using AutoMapper;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // =========================
        // Person
        // =========================

        // Entity -> ListItemDto
        CreateMap<Person, PersonListItemDto>()
            .ForMember(d => d.FaceImagesCount,
                opt => opt.MapFrom(s => s.FaceImages.Count))
            .ForMember(d => d.HasSuspectRecord,
                opt => opt.MapFrom(s => s.Suspect != null));

        // Entity -> DetailDto
        CreateMap<Person, PersonDetailDto>()
            .ForMember(d => d.Suspect,
                opt => opt.MapFrom(s => s.Suspect))
            .ForMember(d => d.TotalRecognitions,
                opt => opt.MapFrom(s => s.Recognitions.Count))
            .ForMember(d => d.LastRecognitionAt,
                opt => opt.MapFrom(s =>
                    s.Recognitions
                        .OrderByDescending(r => r.RecognitionDateTime)
                        .Select(r => (DateTime?)r.RecognitionDateTime)
                        .FirstOrDefault()));

        // Entity -> UpsertDto (للتحرير)
        CreateMap<Person, PersonUpsertDto>()
            .ForMember(d => d.FaceImages,
                opt => opt.Ignore());

        // UpsertDto -> Entity
        CreateMap<PersonUpsertDto, Person>()
            .ForMember(d => d.PersonId, opt => opt.Ignore())
            .ForMember(d => d.Suspect, opt => opt.Ignore())
            .ForMember(d => d.FaceImages, opt => opt.Ignore())
            .ForMember(d => d.Recognitions, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.Ignore());


        // =========================
        // PersonFaceImage
        // =========================

        // Entity -> ViewDto
        CreateMap<PersonFaceImage, PersonFaceImageDto>()
            .ForMember(d => d.Camera,
                opt => opt.MapFrom(s => s.Camera));

        // Entity -> UpsertDto
        CreateMap<PersonFaceImage, PersonFaceImageUpsertDto>()
            // ✅ ImageFile موجود فقط في DTO وليس في Entity، نتجاهله
            .ForMember(d => d.ImageFile,
                opt => opt.Ignore());

        // UpsertDto -> Entity
        CreateMap<PersonFaceImageUpsertDto, PersonFaceImage>()
            // ── يديرها EF أو Service ──
            .ForMember(d => d.FaceImageId, opt => opt.Ignore())
            .ForMember(d => d.PersonId, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.Ignore())
            // ── Navigation Properties ──
            .ForMember(d => d.Person, opt => opt.Ignore())
            .ForMember(d => d.Camera, opt => opt.Ignore())
            .ForMember(d => d.Recognitions, opt => opt.Ignore())
            .ForMember(d => d.ReviewedByUser, opt => opt.Ignore())
            // ── يملأها AI Service ──
            .ForMember(d => d.EmbeddingVector, opt => opt.Ignore())
            .ForMember(d => d.EmbeddingDimension, opt => opt.Ignore())
            .ForMember(d => d.EmbeddingModel, opt => opt.Ignore())
            .ForMember(d => d.EmbeddingVersion, opt => opt.Ignore())
            .ForMember(d => d.EmbeddingCreatedAt, opt => opt.Ignore())
            .ForMember(d => d.EmbeddingQualityScore, opt => opt.Ignore())
            .ForMember(d => d.GeneratedByAi, opt => opt.Ignore())
            .ForMember(d => d.FaceProcessedImage, opt => opt.Ignore())
            .ForMember(d => d.ImageFileName, opt => opt.Ignore())
            .ForMember(d => d.ImageFilePath, opt => opt.Ignore())
            // ── حقول أخرى يديرها Service أو Review ──
            .ForMember(d => d.DescriptionConfidenceScore, opt => opt.Ignore())
            .ForMember(d => d.ReviewedAt, opt => opt.Ignore())
            .ForMember(d => d.ReviewNotes, opt => opt.Ignore())
            .ForMember(d => d.ReviewedByUserId, opt => opt.Ignore());


        // =========================
        // Recognition
        // =========================

        // Entity -> ViewDto
        CreateMap<Recognition, RecognitionDto>()
            .ForMember(d => d.PersonFullName,
                opt => opt.MapFrom(s => s.Person != null ? s.Person.FullName : null))
            .ForMember(d => d.CameraName,
                opt => opt.MapFrom(s => s.Camera != null ? s.Camera.Name : null));

        // ReviewDto -> Entity
        CreateMap<RecognitionReviewDto, Recognition>()
            .ForMember(d => d.RecognitionId, opt => opt.Ignore())
            .ForMember(d => d.PersonId, opt => opt.Ignore())
            .ForMember(d => d.Person, opt => opt.Ignore())
            .ForMember(d => d.FaceImageId, opt => opt.Ignore())
            .ForMember(d => d.FaceImage, opt => opt.Ignore())
            .ForMember(d => d.CameraId, opt => opt.Ignore())
            .ForMember(d => d.Camera, opt => opt.Ignore())
            .ForMember(d => d.RecognitionScore, opt => opt.Ignore())
            .ForMember(d => d.RecognitionDateTime, opt => opt.Ignore())
            .ForMember(d => d.BBoxX1, opt => opt.Ignore())
            .ForMember(d => d.BBoxY1, opt => opt.Ignore())
            .ForMember(d => d.BBoxX2, opt => opt.Ignore())
            .ForMember(d => d.BBoxY2, opt => opt.Ignore())
            .ForMember(d => d.FrameNumber, opt => opt.Ignore())
            .ForMember(d => d.SnapshotPath, opt => opt.Ignore())
            .ForMember(d => d.Latitude, opt => opt.Ignore())
            .ForMember(d => d.Longitude, opt => opt.Ignore())
            .ForMember(d => d.LocationDescription, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.ReviewedByUserId, opt => opt.Ignore())
            .ForMember(d => d.ReviewedByUser, opt => opt.Ignore());


        // =========================
        // Suspect
        // =========================

        // Entity -> SummaryDto
        CreateMap<Suspect, SuspectSummaryDto>();

        // Entity -> DetailDto
        CreateMap<Suspect, SuspectDetailDto>();

        // Entity -> UpsertDto
        CreateMap<Suspect, SuspectUpsertDto>();

        // UpsertDto -> Entity
        CreateMap<SuspectUpsertDto, Suspect>()
            .ForMember(d => d.SuspectId, opt => opt.Ignore())
            .ForMember(d => d.Person, opt => opt.Ignore())
            .ForMember(d => d.IsDeleted, opt => opt.Ignore());


        // =========================
        // Camera
        // =========================

        // Entity -> SummaryDto
        CreateMap<Camera, CameraSummaryDto>();

        // Entity <-> CameraDto
        CreateMap<Camera, CameraDto>().ReverseMap();

        // Entity <-> DetailDto
        CreateMap<Camera, CameraDetailDto>().ReverseMap();
    }
}