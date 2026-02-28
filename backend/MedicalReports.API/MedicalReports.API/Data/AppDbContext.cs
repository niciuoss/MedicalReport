using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Models;
using System.Text.Json;

namespace MedicalReports.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<MedicalReport> MedicalReports => Set<MedicalReport>();
    public DbSet<LicenseConfig> LicenseConfigs => Set<LicenseConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Armazena List<string> como JSON
        modelBuilder.Entity<MedicalReport>()
            .Property(r => r.Cid10Codes)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
            );

        // Armazena List<Medication> como JSON
        modelBuilder.Entity<MedicalReport>()
            .Property(r => r.Medications)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Medication>>(v, (JsonSerializerOptions?)null) ?? new List<Medication>()
            );

        // FK: MedicalReport -> User (Restrict para não deletar médico com laudos)
        modelBuilder.Entity<MedicalReport>()
            .HasOne(r => r.Doctor)
            .WithMany(u => u.Reports)
            .HasForeignKey(r => r.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Patient>()
            .HasIndex(p => p.Cpf)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();
    }
}
