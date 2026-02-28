using System.ComponentModel.DataAnnotations;

namespace MedicalReports.API.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Admin | Doctor</summary>
    [Required]
    public string Role { get; set; } = "Doctor";

    [Required]
    public string FullName { get; set; } = string.Empty;

    public string? Crm { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MedicalReport> Reports { get; set; } = new List<MedicalReport>();
}
