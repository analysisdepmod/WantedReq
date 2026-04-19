 

namespace WantedRec.Server.Models
    
{
 
    public class SpniPdf
    {

        public int Id { get; set; }
        public string PdfFileName { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string NameEn { get; set; } = null!;
        public int sort { get; set; }  
        public string? Description { get; set; }  
        public string? DescriptionEn { get; set; }  
        public string Color { get; set; } = null!;
      

    }
    public class SpniPdfDto
    {

        public int Id { get; set; }
        public string? PdfFileName { get; set; }
        public string Name { get; set; } = null!;
        public string NameEn { get; set; } = null!;
        public int Sort { get; set; }
        public string? Description { get; set; }
        public string? DescriptionEn { get; set; }
        public string Color { get; set; } = null!;
        
        public IFormFile? file { get; set; } 

    }
}
