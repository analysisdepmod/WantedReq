namespace WantedRec.Server.Models
{
    public class ChatGroupUser
    {
        public int ChatGroupId { get; set; }
        public ChatGroup ChatGroup { get; set; }

        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        public bool IsAdmin { get; set; } = false;
    }
}
