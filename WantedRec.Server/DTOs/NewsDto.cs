 
namespace WantedRec.Server.DTOs
{
    public class NewsDto
    {



    }
    public class CrudNews
    {
        public int Id { get; set; }
        public string? ApplicationUserId { get; set; }
        public string? Details { get; set; }
        public string? DetailsEn { get; set; }
        public bool Can { get; set; } = false;
        public bool CanAll { get; set; } = true;
    }
}
