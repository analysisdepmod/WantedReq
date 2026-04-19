 

namespace WantedRec.Server.DTOs
{
    [Keyless]
    public class HRPerson
    {
      
        public int ur_no { get; set; }
        public string?UnitName { get; set; }
      
        public long PersonNo { get; set; }
        public string PersonName { get; set; } = null!;
        public string? PersonPosition { get; set; }
        public int RankId { get; set; }
        public string? RankName { get; set; }
    }
}
