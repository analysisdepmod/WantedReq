 

namespace WantedRec.Server.DTOs
{

    public class SpiUnitAutoComplete
    {
        public int Key { get; set; }
        public string Value { get; set; } = string.Empty;
        public string ValueEn { get; set; } = string.Empty;

    }
    public class SpiUnitDTOGet : SpiUnitDTO
    {
      
        public string Name { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
       
    }
    public class SpiUnitDTO
    {   
        
        public int Id { get; set; }
        public int Ur_no { get; set; }
        public int  Sort { get; set; }
        public bool Active { get; set; }
        public string NameEn { get; set; }= string.Empty;
        public string Color { get; set; }= string.Empty;
        public string BgColor { get; set; } = string.Empty;
        public bool CanAdd { get; set; }
      
    }
}
