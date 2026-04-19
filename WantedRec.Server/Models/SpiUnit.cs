 

namespace WantedRec.Server.Models
{
    public class SpiUnit
    {  [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }
        public int Ur_no { get; set; }
        public int  Sort { get; set; }
        public bool Active { get; set; }
        public string NameEn { get; set; } = null!;
        public string Color { get; set; }= string.Empty;
        public string BgColor { get; set; } = string.Empty;
        public bool CanAdd { get; set; }

      

    }
}
 