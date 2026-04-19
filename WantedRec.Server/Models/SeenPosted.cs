namespace WantedRec.Server.Models
{
    public class SeenPosted
    {
        public int Id { get; set; }
        public string ApplicationUserId { get; set; } = null!;
        public ApplicationUser ApplicationUsers { get; set; } = null!;
        public int PostedId { get; set; }
        public Posted? Posteds { get; set; } 
        public bool IsSeen { get; set; }
        public DateTime SeenDate { get; set; }
    }
}
