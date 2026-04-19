namespace WantedRec.Server.Interfaces
{
    public abstract class UserInfo
    {
   
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public string? CreatedByUserId { get; set; }
        public ApplicationUser? CreatedByUser { get; set; }

        public ApplicationUser? UpdatedByUser { get; set; }
        public string? UpdatedByUserId { get; set; }


      

    }
  
}

 