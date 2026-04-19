using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.InkML;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using WantedRec.Server.Data;
using System.Net.Http;
using System.Net.Http.Headers;

namespace WantedRec.Server.Services
{
    public class MainClass
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _notificationHubContex;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly NotificationHub hub;
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public MainClass(ApplicationDbContext context, IHubContext<NotificationHub> notificationHubContex, UserManager<ApplicationUser> userManager, IHttpClientFactory httpClientFactory, IHttpContextAccessor httpContextAccessor)
        {

            _context = context;
            _notificationHubContex = notificationHubContex;
            _userManager = userManager;
             hub = new(_context, _userManager);
            _httpClient = httpClientFactory.CreateClient("LocalApi");
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<Posted> InsertPost(string UserPostedId, string Action, DateTime datepost, int Opration, int Att_pk, string Controllre)
        {
            List<string> ParentsIds = [];
            var request = new TranslationRequest { Text = Action, Sl = "ar", Tl = "en" };
            
            Posted posted = new()
            {
                ApplicationUserId = UserPostedId,
                Action = Action,
                ActionEn= await TranslateTextAsync(request),
                PostedDate = datepost,
                Att_pk = Att_pk,
                Att_Controller_Name = Controllre,
                WhatAction = Opration
            };
            try
            {
                _context.Posteds.Add(posted);
                await _context.SaveChangesAsync();

                Posted? posted1 = new();
                posted1 = await _context.Posteds.Where(i => i.ApplicationUserId == UserPostedId && i.PostedDate == datepost).FirstOrDefaultAsync();
                if (posted1 != null)
                {
                    // ParentsIds = await GetParentsIds(UserPostedId);
                    ParentsIds = await _context.ApplicationUser.Where(i=>i.Id!= UserPostedId).Select(i => i.Id).ToListAsync();
                    if (ParentsIds.Any())
                    {
                        foreach (string id in ParentsIds)
                        {
                            SeenPosted seenPosted = new()
                            {
                                ApplicationUserId = id,
                                IsSeen = false,
                                PostedId = posted1.Id

                            };
                            _context.SeenPosteds.Add(seenPosted);
                            await _context.SaveChangesAsync();
                        }
                        await SendNotification(posted1);
                    }
                }


                return posted;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private async Task SendNotification(Posted posted)
        {
            List<SeenPosted> seenPosted = [];
            PostedVm postedVm = new();

            if (posted != null)
            {
                seenPosted = await _context.SeenPosteds.Where(i => i.PostedId == posted.Id).ToListAsync();
                foreach (SeenPosted Posted in seenPosted)
                {
                    postedVm = new()
                    {
                        Id = Posted.Id,
                        Action = posted.Action,
                        ActionEn = posted.ActionEn,
                        Whenseen = posted.PostedDate,
                        Colorseen = false,
                        DateNow = DateTime.Now
                    };
                    await _notificationHubContex.Clients.User(Posted.ApplicationUserId).SendAsync("ReciveNotification", postedVm);
                }
            }


        }
        public async Task<List<string>> GetParentsIds(string UserPostedId)
        {
            List<string> ParentsIds = new();
            List<int> ParentsUr_no = new();
            if (UserPostedId != null)
            {
                ApplicationUser? applicationUser = await _context.ApplicationUser.FindAsync(UserPostedId);
                if (applicationUser != null)
                {
                    ParentsUr_no = await GetParentsUr_No(applicationUser.ur_no);
                }
            }
            if (ParentsUr_no.Any())
            {
                foreach (int item in ParentsUr_no)
                {
                    List<ApplicationUser> applicationUserList = await _context.ApplicationUser.Where(i => i.ur_no == item).ToListAsync();
                    if (applicationUserList != null)
                    {
                        foreach (var user in applicationUserList)
                        {
                            ParentsIds.Add(user.Id);
                        }
                    }

                }
            }

            return ParentsIds;

        }
        private async Task<List<int>> GetParentsUr_No(int UserPostedUr_No)
        {

            List<int> ParentsUr_no = new();
            int parentUr_no = 0;

            if (UserPostedUr_No != 0)
            {
                parentUr_no = await _context.Units.Where(i => i.Ur_no == UserPostedUr_No).Select(i => i.TId).FirstOrDefaultAsync();
                while (parentUr_no != 0)
                {
                    ParentsUr_no.Add(parentUr_no);
                    parentUr_no = await _context.Units.Where(i => i.Ur_no == parentUr_no).Select(i => i.TId).FirstOrDefaultAsync();
                }
                ParentsUr_no.Add(0);
            }
            return ParentsUr_no;

        }
        public async Task<AcctionMessage> GetAcctionMessage(string userid, int unitFor, DateTime dateTime)
        {
            var unit = await (from u in _context.SpiUnits
                           
                              select u.Ur_no).FirstOrDefaultAsync();
            AcctionMessage acctionMessage = new();

            ApplicationUser? applicationUser = await _context.ApplicationUser.FindAsync(userid);
            if (applicationUser != null)
            {
                acctionMessage.unitNameFrom = _context.Units.Where(i => i.Ur_no == applicationUser.ur_no).Select(i => i.Name).FirstOrDefault();
                acctionMessage.userNameFrom = applicationUser.PersonName;

                acctionMessage.UnitNameFor = _context.Units.Where(i => i.Ur_no == unit).Select(i => i.Name).FirstOrDefault(); 
                acctionMessage.PostedDate = dateTime;
            }

            return acctionMessage;
        }
        public async Task<string> TranslateTextAsync(TranslationRequest request)
        {
            try
            {
                var authHeader = _httpContextAccessor?.HttpContext?.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    return "";

                var token = authHeader.Substring("Bearer ".Length).Trim();
                _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.PostAsJsonAsync("/api/Translation/translate", request);
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsStringAsync();
                }

                return "Translation failed";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Translation error: {ex.Message}");
                return "Translation failed";
            }
        }

      
      
    }
}
public class TranslationRequest
{
    public string Text { get; set; }
    public string Sl { get; set; } = "ar"; // Source Language
    public string Tl { get; set; } = "en"; // Target Language
}