

using WantedRec.Models;

namespace WantedRec.Server.Models
    
{

    public class ApplicationUser : IdentityUser
    {
        [Display(Name = "الوحدة")]
        public int ur_no { get; set; }//System Unit //وحدة النظام

        [Display(Name = "كلمة المرور")]
        public string Password { get; set; } = null!;
        [Required]
        [Display(Name = "الرقم الاحصائي لمستخدم النظام")]
        public long PersonNo { get; set; }
        [Required]
        [Display(Name = "اسم مستخدم النظام")]
        public string PersonName { get; set; } = null!;

        [Display(Name = "المنصب")]
        public string? PersonPosition { get; set; }
        [Display(Name = "اخر حالة نشاط للمستخدم")]
        public DateTime LastLogin { get; set; }
        public int LoginTimes { get; set; }
        public bool PassChange { get; set; }
        [Display(Name = "الرتبة")]
        public int RankId { get; set; }
        public Rank? Ranks { get; set; } 

        [Display(Name = "رقم الهاتف")]
        public long Cisco { get; set; }
        public DateTime Created_date { get; set; }
        public string Created_by { get; set; } = string.Empty;
        public DateTime Updated_date { get; set; }
        public string Updated_by { get; set; } = string.Empty;
        public List<Posted> Posteds { get; set; } = [];
         public List<SeenPosted> SeenPosteds { get; set; }= [];
        public bool SeenUpdate { get; set; }
        public DateTime PassChangeDate { get; set; }

        public int ClosedAccountFlag { get; set; }
        public string? ClosedAccountNotc { get; set; } // ملاحظات الاغلاق
        public string ClosedBy { get; set; } = string.Empty;
        public DateTime ClosedDate { get; set; } //تاريخ اغلاق الحساب

        public bool HrTest { get; set; } //مراقبة الموارد

        public int OriginalUintUser { get; set; } //UserUnit وحدة المستخدم
        [NotMapped]
        public string? OriginalUintUserName { get; set; } //اسم وحدة المستخدم
        public int LastOriginalUintUser { get; set; } //Last UserUnit in HR اخر وحدة للمستخدم بعد الاجراء الاداري
        [NotMapped]
        public string? LastOriginalUintUserName { get; set; } //Last UserUnit in اسم

        public int CreateLevel { get; set; } // مستوى العمق

        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpiryTime { get; set; }

        [NotMapped]
        public string UnitName { get; set; } = string.Empty;
        [NotMapped]
        public string RankName { get; set; } = string.Empty;
        [NotMapped]
        public List<int> UnitUser { get; set; } =[];
        public List<News> Newses { get; set; } =[];
        public List<Images> Imageses { get; set; } =[];

        public bool IsEn {  get; set; }=false;
        public DateTime? LastSeen { get; set; }
        public string ConnectionId { get; set; } = string.Empty;

        public ICollection<PersonFaceImage> CreatedFaceImages { get; set; }
        public ICollection<PersonFaceImage> ReviewedFaceImages { get; set; }
        public ICollection<Recognition> ReviewedRecognitions { get; set; }

    }
    }
