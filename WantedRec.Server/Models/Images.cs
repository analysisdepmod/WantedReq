 

namespace WantedRec.Server.Models
    
{
 
    public class Images
    {
        public int Id { get; set; }
        public string? ImageFileName { get; set; } 
        public string Name { get; set; } = null!;
        public string NameEn { get; set; } = null!;
        public DateTime CreatedDate { get; set; } 
        public int Sort { get; set; }
        public string? Description { get; set; }
        public string? DescriptionEn { get; set; }
    
        public string Color { get; set; } = null!;
        public string ApplicationUserId { get; set; }=null!;
        public ApplicationUser? User { get; set; }
      
    }
    public class ImagesDto
    {


        public string Name { get; set; } = null!;
        public string NameEn { get; set; } = null!;

        public string? Description { get; set; }
        public string? DescriptionEn { get; set; }
        public string? Color { get; set; }   

        public IFormFile? file { get; set; }
        public int Sort { get; set; }
        public int Id { get; set; }
        public string? ImageFileName { get; set; }

        public string?  UserId { get;set;}
        public string? UserName   {get;set;}
        public string? UnitName   {get;set;}
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
