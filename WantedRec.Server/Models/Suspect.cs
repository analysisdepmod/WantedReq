namespace WantedRec.Server.Models
{
  
    public class Suspect : UserInfo 
    {
        public int SuspectId { get; set; }

        public int PersonId { get; set; }
        public Person Person { get; set; } = null!;

        public string Code { get; set; } = null!;            // مثل SUS-0001
        public string FullName { get; set; } = string.Empty;       // لو يختلف عن اسم الشخص
        public RiskLevel RiskLevel { get; set; }    // Low / Medium / High
        public Status Status { get; set; }            // Active / Cleared / Archived / Wanted
        public string? CaseReference { get; set; }
        public DateTime? WantedSince { get; set; }
        public string? Notes { get; set; }
        public bool IsDeleted { get; set; }

        public bool IsActive { get; set; }
      
        // Navigation

    }



 

}
