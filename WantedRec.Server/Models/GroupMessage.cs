namespace WantedRec.Server.Models
{
    public class GroupMessage
    {
        [Key]
        public int Id { get; set; }

        public int ChatGroupId { get; set; }
        public ChatGroup ChatGroup { get; set; }

        public string SenderId { get; set; }
        public ApplicationUser Sender { get; set; }

        public string Content { get; set; }
        public string ContentEn { get; set; }

        public DateTime SentAt { get; set; } = DateTime.Now;
        public bool IsDeleted { get; set; } = false;
        public bool IsEdited { get; set; } = false;

        public byte[]? AttachmentData { get; set; }
        public string? AttachmentName { get; set; }
        public string? AttachmentMimeType { get; set; }
    }
}
