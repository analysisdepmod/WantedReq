namespace WantedRec.Server.Interfaces
{
    public interface IPersonService
    {

         

        Task<IEnumerable<PersonListItemDto>> GetListAsync(string? search,bool? isActive,bool? isDeleted, CancellationToken cancellationToken = default);

        Task<PersonDetailDto?> GetByIdAsync(
            int personId,
            CancellationToken cancellationToken = default);

        Task<PersonDetailDto> CreateAsync(
            PersonUpsertDto dto,
            CancellationToken cancellationToken = default);

        Task<PersonDetailDto?> UpdateAsync(
            PersonUpsertDto dto,
            CancellationToken cancellationToken = default);

        Task<bool> SoftDeleteAsync(
            int personId,
            CancellationToken cancellationToken = default);

        Task<bool> SetActiveAsync(
            int personId,
            bool isActive,
            CancellationToken cancellationToken = default);

        Task<IEnumerable<PersonFaceImageDto>?> GetFaceImagesAsync(
            int personId,
            CancellationToken cancellationToken = default);
    }

}
