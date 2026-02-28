using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Data;
using MedicalReports.API.DTOs;
using MedicalReports.API.Models;

namespace MedicalReports.API.Services;

public class ReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db) => _db = db;

    public async Task<List<ReportDto>> GetAllAsync() =>
        await _db.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .OrderByDescending(r => r.ConsultationDate)
            .Select(r => MapToDto(r))
            .ToListAsync();

    public async Task<List<ReportDto>> GetByPatientAsync(int patientId) =>
        await _db.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.ConsultationDate)
            .Select(r => MapToDto(r))
            .ToListAsync();

    public async Task<ReportDto?> GetByIdAsync(int id)
    {
        var r = await _db.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .FirstOrDefaultAsync(r => r.Id == id);
        return r == null ? null : MapToDto(r);
    }

    public async Task<ReportDto> CreateAsync(CreateReportDto dto, int doctorId)
    {
        var doctor = await _db.Users.FindAsync(doctorId)
            ?? throw new InvalidOperationException("Médico não encontrado.");

        var report = new MedicalReport
        {
            PatientId = dto.PatientId,
            DoctorId = doctorId,
            DoctorName = doctor.FullName,
            DoctorCrm = doctor.Crm ?? "",
            ReportType = dto.ReportType,
            ConsultationDate = dto.ConsultationDate,
            Cid10Codes = dto.Cid10Codes,
            Diagnosis = dto.Diagnosis,
            ClinicalPicture = dto.ClinicalPicture,
            Treatment = dto.Treatment,
            Medications = dto.Medications.Select(m => new Medication
            {
                Name = m.Name,
                Quantity = m.Quantity,
                Duration = m.Duration,
            }).ToList(),
            Conclusion = dto.Conclusion,
        };

        _db.MedicalReports.Add(report);
        await _db.SaveChangesAsync();
        await _db.Entry(report).Reference(r => r.Patient).LoadAsync();

        return MapToDto(report);
    }

    public async Task<ReportDto?> UpdateAsync(int id, CreateReportDto dto)
    {
        var report = await _db.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null) return null;

        report.PatientId = dto.PatientId;
        report.ReportType = dto.ReportType;
        report.ConsultationDate = dto.ConsultationDate;
        report.Cid10Codes = dto.Cid10Codes;
        report.Diagnosis = dto.Diagnosis;
        report.ClinicalPicture = dto.ClinicalPicture;
        report.Treatment = dto.Treatment;
        report.Medications = dto.Medications.Select(m => new Medication
        {
            Name = m.Name,
            Quantity = m.Quantity,
            Duration = m.Duration,
        }).ToList();
        report.Conclusion = dto.Conclusion;

        await _db.SaveChangesAsync();
        return MapToDto(report);
    }

    private static ReportDto MapToDto(MedicalReport r) => new(
        r.Id, r.PatientId, r.Patient.Name,
        r.DoctorId, r.DoctorName, r.DoctorCrm,
        r.ReportType, r.ConsultationDate, r.Cid10Codes,
        r.Diagnosis, r.ClinicalPicture, r.Treatment,
        r.Medications.Select(m => new MedicationDto(m.Name, m.Quantity, m.Duration)).ToList(),
        r.Conclusion, r.CreatedAt
    );
}
