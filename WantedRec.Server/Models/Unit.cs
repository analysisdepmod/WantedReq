 

namespace WantedRec.Server.Models
    
{
    
    public class Unit
    {
      
        [Display(Name = "رقم الوحدة")]
        //[Remote(action: "IsUr_noInUse", controller: "Units")]
        public int Ur_no { get; set; }

        [Required]
      
        [Display(Name = "اسم الوحدة")]
        //[Remote(action: "IsNameInUse", controller: "Units")]
        public string Name { get; set; } = null!;

        [Required]
        [Display(Name = "رقم التشكيل")]
        public int TId { get; set; }

        [Required]
        [Display(Name = "اسم التشكيل")]
        public string TName { get; set; } = null!;

        [Required]
        [DataType(DataType.Date)]
        [DisplayFormat(ApplyFormatInEditMode = true, DataFormatString = "{0:dd/MM/yyyy}")]

        public DateTime LAST_UPDATE_DATE { get; set; }

        [Required]
        [Display(Name = "حالة الوحدة")]
        public bool ActiveState { get; set; }

        [Display(Name = "مستوى الوحدة")]
        public int UnitLevel { get; set; }

    }

    [Keyless]
    public class OrgUnit
    {


        public int Ur_no { get; set; }

        public string Name { get; set; } = string.Empty;

        public int TId { get; set; }

        public string TName { get; set; } = string.Empty;
        public bool ActiveState { get; set; }

        public int UnitLevel { get; set; }
        public DateTime LAST_UPDATE_DATE { get; set; }


    }
}
