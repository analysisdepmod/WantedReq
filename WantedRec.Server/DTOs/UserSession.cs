namespace WantedRec.Server.DTOs
{
    public record UserSession(string? Id, string? Name, string? Email, string[]? Roles);
}
