

namespace WantedRec.Server.Models
{
 

    public class Person:UserInfo 
    {
       
        public int PersonId { get; set; }

        public string FullName { get; set; } = null!;
        public string DisplayName { get; set; } = string.Empty;
        public Gender Gender { get; set; }       
        public DateTime? BirthDate { get; set; }
        public string NationalId { get; set; } = string.Empty;
        public string? ExternalCode { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }

        public string? Notes { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsActive { get; set; }


        // Navigation
        public ICollection<PersonFaceImage> FaceImages { get; set; } = [];
        public Suspect? Suspect { get; set; }
        public ICollection<Recognition> Recognitions { get; set; } = [];

     

    }
 


}
