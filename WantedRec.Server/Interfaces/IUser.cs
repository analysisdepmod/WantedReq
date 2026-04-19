 


namespace WantedRec.Interfaces
{
    public interface IUser
    {

        Task<bool> CreateUserAsync(RegisterUserDto dto);
        Task<bool> UpdateUserAsync(string Id,RegisterUserDto dto);
        Task<bool> LockInOutAsync( string UserId);
        Task<bool> SetPasswordAsync( string Id);
        Task<string> SetPasswordNewAsync( resetPass respass);
        Task<LoginResponse> LoginAsync(LoginDto dto);
        Task<string> RefreshTokenAsync(RefreshTokenRequest refreshTokenRequest);
        Task<string> GetCurrentUserId();
    }
}
