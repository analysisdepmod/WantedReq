
 

namespace WantedRec.Models
{
    public class Signature
    {
        public int Id { get; set; }
         [Display(Name = "الرتبة")] public string? Rank { get; set; }
        [Display(Name = "الاسم الكامل")] public string? Name { get; set; }
        [Display(Name = "المنصب")] public string? Position { get; set; }

       [Display(Name = "الرتبة")] public string? Rank1 { get; set; }
       [Display(Name = "الاسم الكامل")] public string? Name1 { get; set; }
       [Display(Name = "المنصب")] public string? Position1 { get; set; }

       [Display(Name = "الرتبة")] public string? Rank2 { get; set; }
       [Display(Name = "الاسم الكامل")] public string? Name2 { get; set; }
        [Display(Name = "المنصب")] public string? Position2 { get; set; }

       [Display(Name = "الرتبة")] public string? Rank3 { get; set; }
       [Display(Name = "الاسم الكامل")] public string? Name3 { get; set; }
       [Display(Name = "المنصب")] public string? Position3 { get; set; }

        [Display(Name = "رقم الوحدة")] public int ur_no { get; set; }



        [Display(Name = "العلامة المائية ")]
        public string? Image { get; set; }


        [NotMapped]
        public IFormFile? FileImage { get; set; }
     


    //[Display(Name = "مجموعة التواقيع الخاصة بـ")]
    //    public string ApplicationRolesId { get; set; }= null!;
       
    //    public ApplicationRole? ApplicationRoles { get; set; }

       

    }
}
