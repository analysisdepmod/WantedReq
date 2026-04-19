namespace WantedRec.Server.DTOs
{
    public class AccountStatistics
    {
        public int ActivitAcount { get; set; }
        public int ClosedAccounts {  get; set; }
        public int NotLogged { get; set; }
        public int notChangePassword{ get; set; }
        public int AllUsers { get; set; }
        public int LoginTimes {  get; set; }
    }
}
