using System.ComponentModel.DataAnnotations;

namespace MedicalReports.API.Models;

public class Patient
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Cpf { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    [Required]
    public DateTime BirthDate { get; set; }

    public string Address { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MedicalReport> Reports { get; set; } = new List<MedicalReport>();
}
