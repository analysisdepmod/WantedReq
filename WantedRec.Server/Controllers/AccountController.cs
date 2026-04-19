
using System.Threading.Tasks;

namespace WantedRec.Server.Controllers
{
    //[Authorize(Roles = "Admin,Manager")]
    [Route("api/[controller]")]
    [ApiController]

    public class AccountController(IUser user, SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, ApplicationDbContext context) : ControllerBase
    {
        private readonly IUser _User = user;
        private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
        private readonly UserManager<ApplicationUser> _userManager = userManager;
        private readonly ApplicationDbContext _context = context;



        [HttpGet("GetAutoComplete")]
        public async Task<ActionResult> GetAutoComplete()
        {



            var x = await (from m in _context.Units
                           where m.Ur_no > 0
                           && !m.Name.Contains("حضيرة") && !m.Name.Contains("سرية")
                           && !m.TName.Contains("حضيرة") && !m.TName.Contains("سرية")
                           && !m.Name.Contains("فصيل") && !m.Name.Contains("فصيل")
                           && !m.TName.Contains("فصيل") && !m.TName.Contains("فصيل")
                           select new
                           {
                               Value = m.Ur_no,
                               Label = m.Name ?? "",

                           }).OrderBy(i => i.Value).ToListAsync();

            return Ok(x);

        }
        [HttpGet("GetAutoCompleteorgunits")]
        public async Task<ActionResult> GetAutoCompleteorgunits()
        {



            var x = await (from m in _context.OrgUnits

                           select new
                           {
                               Value = m.Ur_no,
                               Label = m.Name ?? "",

                           }).OrderBy(i => i.Value).ToListAsync();

            return Ok(x);

        }

        [AllowAnonymous]
        [HttpPut("{id}")]
        public async Task<ActionResult> PutUser(string id, RegisterUserDto dto)
        {

            return await _User.UpdateUserAsync(id, dto) ?
           Ok(ApiResponse<string>.Success("", $"Account for '{dto.Email}@mod.com' updated successfully"))
         : Ok(ApiResponse<string>.Fail($"Account for '{dto.Email}@mod.com' Dont updated"));
        }


        [AllowAnonymous]


        [HttpPost("LockInOut/{id}")]
        public async Task<ActionResult> LockInOut(string? id)
        {
            if (!string.IsNullOrEmpty(id))
                return
                    await _User.LockInOutAsync(id) ?
                    Ok(ApiResponse<string>.Success("", $"Account Status updated successfully"))
                  : Ok(ApiResponse<string>.Fail($"Account Status Dont updated successfully"));

            return NotFound(ApiResponse<string>.Fail($"Acount with ID {id} not found"));

        }


        [AllowAnonymous]
        [HttpPost("ResetPassword/{id}")]
        public async Task<ActionResult> ResetPassword(string? id)
        {
            if (!string.IsNullOrEmpty(id))
                return
                    await _User.SetPasswordAsync(id) ?
                    Ok(ApiResponse<string>.Success("", $"Account Password reset successfully"))
                  : Ok(ApiResponse<string>.Fail($"Account Password dont reset successfully"));

            return NotFound(ApiResponse<string>.Fail($"Acount with ID {id} not found"));
        }
        [AllowAnonymous]
        [HttpPost("PasswordNew")]
        public async Task<string> PasswordNew(resetPass resPass)
        {

            return await _User.SetPasswordNewAsync(resPass);

        }
        // DELETE: api/accunt/5
        [AllowAnonymous]

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUsers(string id)
        {
            var user = await _context.ApplicationUser.FindAsync(id);

            if (user == null)
                return NotFound(ApiResponse<string>.Fail($"Account with ID {id} not found"));

            _context.ApplicationUser.Remove(user);

            var result = await _context.SaveChangesAsync();

            if (result > 0)
                return Ok(ApiResponse<string>.Success("", "Account deleted successfully"));

            return BadRequest(ApiResponse<string>.Fail("Account was not deleted"));
        }


        [HttpGet("Getperson/{PersonNo}")]
        public ActionResult Getperson(string PersonNo)
        {
            try
            {
                var data = _context.HrPersonDatas
                     .FromSqlInterpolated($"EXEC Getperson {PersonNo}")
                     .AsEnumerable()
                     .FirstOrDefault();
                return Ok(data);
            }
            catch (Exception ex)
            {
                return Ok();
            }
        }

        [AllowAnonymous]
        [HttpGet("GetAllUser")]
        public async Task<List<ApplicationUser>> GetAllUser(int flag)
        {
            try
            {
                var currentUserId = await _User.GetCurrentUserId();
                var applicationUser = await _context.ApplicationUser.FindAsync(currentUserId);
                if (applicationUser == null)
                    return [];

                var usersQuery = _context.ApplicationUser.AsQueryable();

                // فلترة حسب الـ flag
                usersQuery = flag switch
                {
                    0 => usersQuery.Where(u => u.ClosedAccountFlag == 0 || u.ClosedAccountFlag == 4 || u.ClosedAccountFlag == 5),
                    1 => usersQuery.Where(u => u.ClosedAccountFlag == 1 || u.ClosedAccountFlag == 2 || u.ClosedAccountFlag == 3),
                    4 => usersQuery.Where(u => u.ClosedAccountFlag == 4),
                    5 => usersQuery.Where(u => u.ClosedAccountFlag == 5),
                    6 => usersQuery.Where(u => u.ClosedAccountFlag == 6),
                    _ => usersQuery
                };

                // تحميل القواميس المساعدة
                var unitsList = await (
                        from u in _context.Units
                        join a in _context.Users on u.Ur_no equals a.ur_no
                        select new { u.Ur_no, u.Name }
                    )
                    .AsNoTracking()
                    .ToListAsync();
                var unitsDict = unitsList
                    .GroupBy(u => u.Ur_no)
                    .ToDictionary(g => g.Key, g => g.First().Name ?? "");

                var ranksDict = await _context.Ranks
                    .AsNoTracking()
                    .ToDictionaryAsync(r => r.Id, r => r.Name ?? "");

                var userNamesDict = await _context.ApplicationUser
                    .AsNoTracking()
                    .Where(u => u.Id != null)
                    .Select(u => new { u.Id, u.PersonName })
                    .ToDictionaryAsync(u => u.Id, u => u.PersonName ?? "");

                
                var usersList = await usersQuery
                    .AsNoTracking()
                    .ToListAsync();

                var result = usersList.Select(a => new ApplicationUser
                {
                    Id = a.Id,
                    RankId = a.RankId,
                    RankName = ranksDict.TryGetValue(a.RankId, out var rnk) ? rnk : "",
                    UnitName = unitsDict.TryGetValue(a.ur_no, out var unit) ? unit : "",
                    OriginalUintUserName = unitsDict.TryGetValue(a.OriginalUintUser, out var orig) ? orig : "",
                    LastOriginalUintUserName = unitsDict.TryGetValue(a.LastOriginalUintUser, out var lastOrig) ? lastOrig : "",
                    LastOriginalUintUser = a.LastOriginalUintUser,
                    OriginalUintUser = a.OriginalUintUser,
                    HrTest = a.HrTest,
                    CreateLevel = a.CreateLevel,
                    PersonName = a.PersonName,
                    ClosedAccountFlag = a.ClosedAccountFlag,
                    ClosedAccountNotc = a.ClosedAccountNotc,
                    ClosedDate = a.ClosedDate,
                    Email = a.Email,
                    ur_no = a.ur_no,
                    LoginTimes = a.LoginTimes,
                    PersonNo = a.PersonNo,
                    LockoutEnabled = a.LockoutEnabled,
                    LockoutEnd = a.LockoutEnd,
                    NormalizedEmail = a.NormalizedEmail,
                    NormalizedUserName = a.NormalizedUserName,
                    UserName = a.UserName,
                    Password = a.Password,
                    PasswordHash = a.PasswordHash,
                    PersonPosition = a.PersonPosition,
                    PhoneNumber = a.PhoneNumber,
                    Cisco = a.Cisco,
                    LastLogin = a.LastLogin,
                    PassChange = a.PassChange,
                    AccessFailedCount = a.AccessFailedCount,
                    RefreshTokenExpiryTime = a.RefreshTokenExpiryTime,
                    RefreshToken = a.RefreshToken,
                    Created_date = a.Created_date,
                    Created_by = userNamesDict.TryGetValue(a.Created_by ?? "", out var cb) ? cb : "",
                    Updated_by = userNamesDict.TryGetValue(a.Updated_by ?? "", out var ub) ? ub : "",
                    ClosedBy = userNamesDict.TryGetValue(a.ClosedBy ?? "", out var clb) ? clb : "",
                    Updated_date = a.Updated_date,
          
                }).ToList();

                // فلترة المستخدمين حسب صلاحية الأدمن
                if (!await _userManager.IsInRoleAsync(applicationUser, "Admin"))
                {
                    var adminIds = (await _userManager.GetUsersInRoleAsync("Admin")).Select(u => u.Id).ToHashSet();
                    result = result.Where(u => !adminIds.Contains(u.Id)).ToList();
                }

                return result;
            }
            catch (Exception)
            {
                throw; // ممكن إضافة logging هنا
            }
        }




        [HttpGet("GetAllRole")]
        public async Task<List<RoleDto>> GetAllRole(string? userId)
        {


            string LoggenduserId = await _User.GetCurrentUserId();
            if (LoggenduserId == null) return [];

            ApplicationUser? applicationUser = await _context.ApplicationUser.FindAsync(LoggenduserId);
            if (applicationUser == null) return [];

            bool UserAdmin = await _userManager.IsInRoleAsync(applicationUser, "Admin");

            List<RoleDto> x = [];
            if (string.IsNullOrEmpty(userId))
            {
                x = await (from a in _context.ApplicationRoles
                           select new RoleDto
                           {
                               roleId = a.Id,
                               roleName = a.Name ?? "",
                               roleNameAR = a.RoleNameAR,
                               isSelected = false
                           }).ToListAsync();


            }

            else
            {
                IEnumerable<string> Roles = [];
                var user = await _context.ApplicationUser.FindAsync(userId);
                if (user is not null)
                {
                    Roles = await _userManager.GetRolesAsync(user);
                    x = await (from a in _context.ApplicationRoles
                               select new RoleDto
                               {
                                   roleId = a.Id,
                                   roleName = a.Name ?? "",
                                   roleNameAR = a.RoleNameAR,
                                   isSelected = GetUserInRole(Roles, a.Name)
                               }).ToListAsync();

                }


            }


            if (!UserAdmin)
                foreach (var role in x.Where(i => i.roleName == "Admin" || i.roleName == "Manager").ToList())
                    x.Remove(role);

            return x;

        }

        private static bool GetUserInRole(IEnumerable<string> roles, string? name)
        {
            return roles.Any(i => i == name);
        }



        [HttpPost]
        public async Task<ActionResult> RegisterUser(RegisterUserDto dto)
        {
            if (dto.Email.ToLower().Contains("mod"))
                return Ok(ApiResponse<string>.Fail($"'{dto.Email}' Dont allowed"));
            dto.Email = dto.Email + "@mod.com";
            return
                await _User.CreateUserAsync(dto) ?
              Ok(ApiResponse<string>.Success("", $"Account for '{dto.Email}' added successfully"))
            : Ok(ApiResponse<string>.Fail($"Account for '{dto.Email}' Dont added"));
        }



        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<ActionResult<bool>> Logout()
        {
            await _signInManager.SignOutAsync();
            return true;
        }
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {

            var result = await _User.LoginAsync(dto);


            if (!string.IsNullOrEmpty(result.Message))
            {
                return Ok(result);
            }
            return BadRequest(result.Message);



        }




        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequest model)
        {
            try
            {

                var newToken = await _User.RefreshTokenAsync(model);
                return Ok(new { token = newToken });
            }
            catch (SecurityTokenException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }

        }

        [HttpGet("GetAllCounters")]
        public async Task<ActionResult<bool>> GetAllCounters()
        {
            var data = await _context.ApplicationUser.ToListAsync();
            var now = DateTime.Now;
            var usersCounters = new List<UsersCountersDto>
   {
    new()
    {
        Id = 0,
        IsSummary = false,
        Counter = data.Count(i => i.ClosedAccountFlag == 0 || i.ClosedAccountFlag==4|| i.ClosedAccountFlag==5)

    },
    new()
    {
        Id = 1,
        IsSummary = false,
   Counter = data.Count(i =>
                        new HashSet<int> { 1, 2, 3 }.Contains(i.ClosedAccountFlag) )
    },
    new()
    {
        Id = 4,
        IsSummary = false,
                    Counter = data.Count(i => i.ClosedAccountFlag==4)
    },
    new()
    {
        Id = 5,
        IsSummary = false,
                    Counter = data.Count(i =>i.ClosedAccountFlag==5)
    },
    new()
    {
        Id = 6,
        IsSummary = false,
                    Counter = data.Count(i => i.ClosedAccountFlag ==6 )
    },
    new()
    {
        Id = 100,
        IsSummary = true,
        Counter = data.Count
    },
    new()
    {
        Id = 101,
        IsSummary = true,
        Counter = data.Sum(i => i.LoginTimes)
    }
};
            return Ok(usersCounters);
        }



        [HttpGet("reader")]
        [Authorize(Roles = "Reader")]
        public ActionResult<string> GetReader()
        {
            return Ok("Reader Role");
        }
  
       

        [AllowAnonymous]
        [HttpGet("GetSpiAutoComplete")]
        public async Task<ActionResult> GetSpiAutoComplete()
        {



            var x = await (from m in _context.Units
                           where m.Ur_no > 0
                           select new
                           {
                               Value = m.Ur_no,
                               Label = m.Name ?? "",

                           }).ToListAsync();

            return Ok(x);

        }
       
       




        //[HttpGet("GetStatistics")]
        //public async Task<ActionResult<AccountStatistics>> GetStatistics()
        //{
        //    var users = _context.ApplicationUser.AsQueryable();

        //    var accountStatistics = new AccountStatistics
        //    {
        //        ActivitAcount = await users.CountAsync(u => !u.LockoutEnabled),
        //        ClosedAccounts = await users.CountAsync(u => u.LockoutEnabled),
        //        NotLogged = await users.CountAsync(u => u.RefreshTokenExpiryTime.AddDays(4) < DateTime.Now),
        //        notChangePassword = await users.CountAsync(u => !u.PassChange),
        //        AllUsers= await users.CountAsync(),
        //        LoginTimes=await users.SumAsync(u=>u.LoginTimes),
        //    };

        //    return Ok(accountStatistics);
        //}




    }
}
