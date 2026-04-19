namespace WantedRec.Server.DTOs
{
     public class RegisterUserDto 
     {
        public string Id { get; set; }
        public string Email { get; set; }=null!; 
        public string PersonName { get; set; }=string.Empty;

        public int Ur_no { get; set; } 
        public long PersonNo { get; set; } 
        public string PersonPosition { get; set; } = null!;
        public bool User_state { get; set; } 
        public int RankId { get; set; } 
        public long Cisco { get; set; } 
        public bool HrTest { get; set; }
        public List<RoleDto> RoleWithUserDto { get; set; }=[];
        public List<int> UnitUser { get; set; }=[];
        public int OriginalUintUser { get; set; }
        public int CreateLevel { get; set; }
         

    }
    public class RoleDto
    {

        public string roleId { get; set; } = null!;
        public string roleName { get; set; } = null!;
        public string roleNameAR { get; set; } = null!;
        public bool isSelected { get; set; } = false;


    }
    public class resetPass
    {
   
        public string token { get; set; } = null!;
        
        public string NewPassword { get; set; } = null!;
        public string ConfirmPassword { get; set; } = null!;


    }
}
