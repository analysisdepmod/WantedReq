namespace WantedRec.Server.Models
{
    public class ChatGroup
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string CreatedByUserId { get; set; }
        public ApplicationUser CreatedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool IsClosed { get; set; } = false;
        public DateTime IsClosedAt { get; set; } = DateTime.Now;

        public ICollection<ChatGroupUser> Members { get; set; }
        public ICollection<GroupMessage> Messages { get; set; }
    }
}
