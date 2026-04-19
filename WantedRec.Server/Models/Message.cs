namespace WantedRec.Server.Models
{
    public class Message
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string SenderId { get; set; }

        [ForeignKey("SenderId")]
        public ApplicationUser Sender { get; set; }

        [Required]
        public string ReceiverId { get; set; }

        [ForeignKey("ReceiverId")]
        public ApplicationUser Receiver { get; set; }

        [Required]
        public string Content { get; set; }
       
        public string ContentEn { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}
