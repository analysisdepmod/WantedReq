namespace WantedRec.Server.DTOs
{
    public class CreateGroupDto
    {
        public string Name { get; set; }
    }
    public class AddUserDto
    {
        public string UserId { get; set; }
    }

    public class SendMessageDto
    {
        public string ReceiverId { get; set; }
        public string Content { get; set; }
        public bool Ar { get; set; }
    }
}
