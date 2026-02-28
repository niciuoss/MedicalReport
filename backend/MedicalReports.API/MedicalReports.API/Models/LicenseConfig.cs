namespace MedicalReports.API.Models;

public class LicenseConfig
{
    public int Id { get; set; }

    /// <summary>1 = ativo, 0 = bloqueado</summary>
    public int LicenseKey { get; set; } = 1;

    public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);
}
