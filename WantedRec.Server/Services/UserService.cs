
 



namespace WantedRec.Services
{
    public class UserService : IUser
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly SignInManager<ApplicationUser> signInManager;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration config;
        private readonly JWT _jwt;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration config,
             IOptions<JWT> jwt,
             IHttpContextAccessor httpContextAccessor

            )
        {
            _context = context;
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.config = config;
            _jwt = jwt.Value;
            _httpContextAccessor = httpContextAccessor;
        }


        public async Task<string> GetCurrentUserId()
        {
            var authHeader = _httpContextAccessor?.HttpContext?.Request.Headers["Authorization"].ToString();

            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return "";

            var token = authHeader.Substring("Bearer ".Length).Trim();

            if (string.IsNullOrEmpty(token))
                return "";

            var principal = GetPrincipalFromExpiredToken(token);
            if (principal == null)
                return "";

            var username = principal.Identity?.Name;
            if (string.IsNullOrEmpty(username))
                return "";

            var user = await userManager.FindByEmailAsync(username);
            return user?.Id ?? "";
        }





        public async Task<bool> CreateUserAsync(RegisterUserDto dto)
        {

            List<string> rolesNeed = dto.RoleWithUserDto.Where(i => i.isSelected).Select(i => i.roleName).ToList();


            ApplicationUser applicationUser = new()
            {
                PersonName = dto.PersonName,
                PersonNo = dto.PersonNo,
                RankId = dto.RankId,
                Email = dto.Email,
                PersonPosition = dto.PersonPosition,
                Cisco = dto.Cisco,
                HrTest = dto.HrTest,
                ur_no = dto.Ur_no,
                OriginalUintUser = dto.OriginalUintUser,
                Created_date = DateTime.Now,
                Created_by = GetCurrentUserId().GetAwaiter().GetResult(),
                Updated_date = DateTime.Now,
                Updated_by = string.Empty,
                Password = Encrypt("Password1"),
                RefreshToken = string.Empty,
                CreateLevel = dto.CreateLevel,
                

            };

            try
            {
                  await userManager.SetEmailAsync(applicationUser, dto.Email);
                await userManager.SetUserNameAsync(applicationUser, dto.Email);

                var res = await userManager.CreateAsync(applicationUser, "Apex_1234");
                if (res.Succeeded)
                {
                    var user = await userManager.FindByEmailAsync(dto.Email);


                    if (user != null)
                    {
                       


                       



                        user.PasswordHash = "AQAAAAEAACcQAAAAEEoZHfYt7fsFBomfdo3wNF5sSijVixufjlJuwyu8Cv8td4LL4YWvn0x59RnCd0ia4g==";
                        user.Password = Encrypt("Password1");
                        user.PassChange = false;
                        await userManager.UpdateAsync(user);

                        var result = await userManager.AddToRolesAsync(user, rolesNeed);
                        return result.Succeeded;

                    }
                    return false;
                }
                return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


        public async Task<LoginResponse> LoginAsync([FromBody] LoginDto dto)
        {
            LoginResponse loginResponse = new();
            try
            {
                var result = await signInManager.PasswordSignInAsync(
                      dto.Email!, dto.Password!, dto.RememberMe, true);

                if (result.Succeeded)
                {
                    var user = await userManager.FindByEmailAsync(dto.Email);
                    if (user == null)
                        return new() { Message = "Error In Login" };
                 

                    IList<string> Roles = await userManager.GetRolesAsync(user!);
                    var jwtSecurityToken = await GenerateJwtToken(user!);

                    user.RefreshToken = GenerateRefreshToken();
                    user.RefreshTokenExpiryTime = DateTime.Now.AddHours(1); // Refresh token valid for 1 hours
                    
                    user.LastLogin = DateTime.Now;
                    user.LockoutEnd = null;
                    user.LockoutEnabled = false;
                    user.LoginTimes++;

                    await userManager.UpdateAsync(user);

                    loginResponse.passwordChange = user.PassChange;
                    loginResponse.BasicUserInfo = new();
                    loginResponse.UserRoles = [.. Roles];
                    loginResponse.Token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
                    loginResponse.Expiration = jwtSecurityToken.ValidTo;
                    loginResponse.Refresh_token = user.RefreshToken;
                    loginResponse.Refresh_token_expiry = user.RefreshTokenExpiryTime;
                    loginResponse.LoginStatus = true;
                    loginResponse.Message = "Login Success";
                    loginResponse.BasicUserInfo = new()
                    {
                        UserName = user.PersonName,
                        RankName = _context.Ranks.Where(i => i.Id == user.RankId).Select(i => i.Name).FirstOrDefault() ?? "",
                        UnitName = _context.Units.Where(i => i.Ur_no == user.ur_no).Select(i => i.Name).FirstOrDefault() ?? "",
                        Userid = user.Id,

                    };
                    return loginResponse;
                }
                 
                     else
                    {
                        var userExist = await userManager.FindByEmailAsync(dto.Email);
                        if (userExist is not null)
                        {
                            var isLockedOut = await userManager.IsLockedOutAsync(userExist);
                            if (isLockedOut)
                                return new() { Message = "تم تعطيل الحساب اتصل بالدعم" };

                            if (userExist.AccessFailedCount >= 5)
                            {
                                userExist.ClosedAccountFlag = 1;
                                userExist.LockoutEnabled = true;
                                await userManager.UpdateAsync(userExist);
                            }
                            return new() { Message = "تأكد من اسم المستخدم وكلمة المرور", AccessFailedCount = userExist.AccessFailedCount };
                        }
                        return new() { Message = "تأكد من اسم المستخدم وكلمة المرور" };
                    }
                 
            }
            catch (Exception ex)
            {
                return new() { Message = ex.Message };
            }
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        private async Task<JwtSecurityToken> GenerateJwtToken(ApplicationUser user)
        {

            IList<string> Roles = await userManager.GetRolesAsync(user!);
           // UserSession userSession = new(user.Id, user.UserName, user.Email, [.. Roles]);
          
      



            List<Claim> userClaims = new List<Claim>
                    {
                        new Claim(ClaimTypes.NameIdentifier, user.Id),
                        new Claim(ClaimTypes.Name, user.UserName ?? ""),
                        new Claim(ClaimTypes.Email, user.Email ?? ""),
                        new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? ""),
                        new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                        new Claim("rol", "api_access")
                    };

            if (Roles is not null)
                foreach (var item in Roles)
                {
                    userClaims.Add(new Claim(ClaimTypes.Role, item));

                }


            var symmetricSecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
            var signingCredentials = new SigningCredentials(symmetricSecurityKey, SecurityAlgorithms.HmacSha256);

            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _jwt.Issuer,
                audience: _jwt.Audience,
                claims: userClaims,
                expires: DateTime.UtcNow.AddMinutes(_jwt.DurationInMinutes),
                signingCredentials: signingCredentials
             
                );
           
            return jwtSecurityToken;
        }
        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key)),
                ValidateLifetime = false // No need to validate lifetime since it's handled in JWT middleware
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            return principal;
        }


        public async Task<string> RefreshTokenAsync([FromBody]  RefreshTokenRequest model)
        {
        

            var principal = GetPrincipalFromExpiredToken(model.Token);
            var username = principal.Identity?.Name; // retrieve the username from the expired token

            var user = await userManager.FindByNameAsync(username!);

            if (user == null || user.RefreshToken != model.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.Now)
            {
                throw new SecurityTokenException("Invalid refresh token");
            }
            var jwtToken = await GenerateJwtToken(user);

            return new JwtSecurityTokenHandler().WriteToken(jwtToken);
        }

        public async Task<bool> UpdateUserAsync(string id,RegisterUserDto dto)
        {
             
          
            var user = await userManager.FindByIdAsync(id);

            if (user == null || id != user.Id)
            {
                return false;
            }
            user.PersonName = dto.PersonName;
            user.PersonNo = dto.PersonNo;
            user.RankId = dto.RankId;
            user.PersonPosition = dto.PersonPosition;
            user.Cisco = dto.Cisco;
            user.HrTest = dto.HrTest;
            user.ur_no = dto.Ur_no;
            user.OriginalUintUser = dto.OriginalUintUser;
            user.Updated_date = DateTime.Now;
            user.Updated_by = GetCurrentUserId().GetAwaiter().GetResult();
            user.CreateLevel = dto.CreateLevel;

            _context.ApplicationUser.Update(user);
            var res = await _context.SaveChangesAsync() > 0;
            if (res)
            {
                

 


                IList<string> Roles = await userManager.GetRolesAsync(user);
                var res1 = await userManager.RemoveFromRolesAsync(user, Roles);
                if (res1.Succeeded)
                {
                    await userManager.AddToRolesAsync(user!, dto.RoleWithUserDto.Where(i => i.isSelected).Select(i => i.roleName));
                }

                return true;
            }

            return false;
        }
        
        public async Task<bool> LockInOutAsync(string UserId)
        {
            var user = await userManager.FindByIdAsync(UserId);
            //var colsed = await userManager.FindByIdAsync(GetCurrentUserId().GetAwaiter().GetResult());

            if (user is null)
            {
                return false;
            }
            user.LockoutEnabled = !user.LockoutEnabled;
            if (user.LockoutEnabled) {

                user.ClosedBy = GetCurrentUserId().GetAwaiter().GetResult();
                user.LockoutEnd = DateTime.Now;
                user.ClosedAccountFlag = 2;
                _context.ApplicationUser.Update(user);
                return await _context.SaveChangesAsync() > 0;
            }
            else
            {
                    user.ClosedBy = "";
                     user.LockoutEnd = null;
                user.ClosedAccountFlag = 0;
                user.Updated_by = GetCurrentUserId().GetAwaiter().GetResult();
                user.Updated_date = DateTime.Now;
              
                _context.ApplicationUser.Update(user);
                return await _context.SaveChangesAsync() > 0;
            }
           
            

             
        }
        public async Task<bool> SetPasswordAsync(string Id)
        {
            var user = await userManager.FindByIdAsync(Id);

            if (user is null)
            {
                return false;
            }

            user.PasswordHash = "AQAAAAEAACcQAAAAEEoZHfYt7fsFBomfdo3wNF5sSijVixufjlJuwyu8Cv8td4LL4YWvn0x59RnCd0ia4g==";
            user.Password = Encrypt("Password1");
            user.PassChange = false;
            user.AccessFailedCount = 0;
            user.LockoutEnd = null;
            user.LockoutEnabled = false;
            user.ClosedAccountFlag = 0;
            await userManager.UpdateAsync(user);
            _context.ApplicationUser.Update(user);
            return await _context.SaveChangesAsync() > 0;



        }


        public async Task<string> SetPasswordNewAsync(resetPass resPass )
        {
            if (!StrongPassword(resPass.NewPassword))
            {
                return "يجب ادخال كلمة مرور قوية ";
            }
            var principal = GetPrincipalFromExpiredToken(resPass.token);
            var username = principal.Claims.First().Value; // retrieve the username from the expired token

            var user = await userManager.FindByIdAsync(username);
 

            if (user is null)
            {
                   return "المستخدم غير موجود"; ;
            }

           await userManager.RemovePasswordAsync(user);
            var res = await userManager.AddPasswordAsync(user, resPass.NewPassword);
            if (res.Succeeded)
            {
                user.Password = Encrypt(resPass.NewPassword);
                user.PassChange = true;
                user.PassChangeDate = DateTime.Now;
                await userManager.UpdateAsync(user);
                _context.ApplicationUser.Update(user);
                var ress = await _context.SaveChangesAsync() > 0;
                if (ress)
                    return string.Empty;
            }
            return "حدث خطأ اثناء تغير كلمة المرور";


        }
        private bool StrongPassword(string newPassword)
        {
        
            if (
                 newPassword.Length < 6 ||
                !newPassword.Any(char.IsUpper) ||
                !newPassword.Any(ch => !char.IsLetterOrDigit(ch)) ||
                newPassword.ToLower().Contains("pass") ||
                newPassword.ToLower().Contains("word")

                )
                return false;


            return true;
        }
        public string Encrypt(string clearText)
        {
            string encryptionKey = "MAKV2SPBNI99212";
            byte[] clearBytes = Encoding.Unicode.GetBytes(clearText);
            using (Aes encryptor = Aes.Create())
            {
                Rfc2898DeriveBytes pdb = new(encryptionKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 });
                encryptor.Key = pdb.GetBytes(32);
                encryptor.IV = pdb.GetBytes(16);
                using MemoryStream ms = new();
                using (CryptoStream cs = new(ms, encryptor.CreateEncryptor(), CryptoStreamMode.Write))
                {
                    cs.Write(clearBytes, 0, clearBytes.Length);
                    cs.Close();
                }
                clearText = Convert.ToBase64String(ms.ToArray());
            }

            return clearText;
        }

        public string Decrypt(string cipherText)
        {
            string encryptionKey = "MAKV2SPBNI99212";
            byte[] cipherBytes = Convert.FromBase64String(cipherText);
            using (Aes encryptor = Aes.Create())
            {
                Rfc2898DeriveBytes pdb = new(encryptionKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 });
                encryptor.Key = pdb.GetBytes(32);
                encryptor.IV = pdb.GetBytes(16);
                using MemoryStream ms = new();
                using (CryptoStream cs = new(ms, encryptor.CreateDecryptor(), CryptoStreamMode.Write))
                {
                    cs.Write(cipherBytes, 0, cipherBytes.Length);
                    cs.Close();
                }
                cipherText = Encoding.Unicode.GetString(ms.ToArray());
            }

            return cipherText;
        }

    }
}
