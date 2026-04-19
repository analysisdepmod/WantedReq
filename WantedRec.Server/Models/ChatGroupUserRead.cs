namespace WantedRec.Server.Models
{
    public class ChatGroupUserRead
    {
        public int ChatGroupId { get; set; }
        public string UserId { get; set; }
        public DateTime LastReadAt { get; set; }

        public ChatGroup ChatGroup { get; set; }
        public ApplicationUser User { get; set; }
    }
}
