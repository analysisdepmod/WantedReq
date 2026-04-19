 

namespace WantedRec.Server.DTOs
{
    public class LoginResponse
    {
        public BasicUserInfo BasicUserInfo { get; set; } = new();
        public string Token { get; set; }=string.Empty;
        public bool passwordChange { get; set; } 
        public DateTime Expiration {  get; set; }

        public string Refresh_token { get; set; }
        public DateTime Refresh_token_expiry { get; set; }

        public string Message { get; set; }=string.Empty;
        public bool LoginStatus { get; set; }=false;
        public int AccessFailedCount { get; set; }
        public List<string> UserRoles { get; set; } = [];
        
    }

    public class BasicUserInfo
    {

        public string UserName { get; set; } = string.Empty;
        public string UnitName { get; set; } = string.Empty;
        public string RankName { get; set; } = string.Empty;
        public string Userid { get; set; } = string.Empty;
    }
}
