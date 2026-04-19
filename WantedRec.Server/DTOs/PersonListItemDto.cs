namespace WantedRec.Server.DTOs
{
    public class PersonListItemDto
    {
        public int PersonId { get; set; }
        public string FullName { get; set; } = null!;
        public string? DisplayName { get; set; }
        public Gender Gender { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }

        public int FaceImagesCount { get; set; }
        public bool HasSuspectRecord { get; set; }
    }

}
