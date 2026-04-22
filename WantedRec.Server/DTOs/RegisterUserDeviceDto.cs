using System.ComponentModel.DataAnnotations;

namespace WantedRec.Server.DTOs
{
    public class RegisterUserDeviceDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = null!;
    }
}