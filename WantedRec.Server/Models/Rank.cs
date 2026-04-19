 

namespace WantedRec.Server.Models
    
{
 
    public class Rank
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string NameEn { get; set; } = null!;
    
    }
}
