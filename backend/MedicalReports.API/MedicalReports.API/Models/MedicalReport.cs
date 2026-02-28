using System.ComponentModel.DataAnnotations;

namespace MedicalReports.API.Models;

public class MedicalReport
{
    public int Id { get; set; }

    [Required]
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    [Required]
    public int DoctorId { get; set; }
    public User Doctor { get; set; } = null!;

    /// <summary>Inicial, Retorno, Perícia</summary>
    [Required]
    public string ReportType { get; set; } = string.Empty;

    [Required]
    public DateTime ConsultationDate { get; set; }

    /// <summary>Lista de códigos CID-10 (JSON)</summary>
    public List<string> Cid10Codes { get; set; } = new();

    public string Diagnosis { get; set; } = string.Empty;

    public string ClinicalPicture { get; set; } = string.Empty;

    public string Treatment { get; set; } = string.Empty;

    /// <summary>Lista de medicamentos estruturados (JSON)</summary>
    public List<Medication> Medications { get; set; } = new();

    public string Conclusion { get; set; } = string.Empty;

    // Dados denormalizados do médico para o PDF
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorCrm { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
