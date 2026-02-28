using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Data;
using MedicalReports.API.DTOs;
using MedicalReports.API.Models;

namespace MedicalReports.API.Services;

public class PatientService
{
    private readonly AppDbContext _db;

    public PatientService(AppDbContext db) => _db = db;

    public async Task<List<PatientDto>> GetAllAsync() =>
        await _db.Patients
            .OrderBy(p => p.Name)
            .Select(p => MapToDto(p))
            .ToListAsync();

    public async Task<PatientDto?> GetByIdAsync(int id)
    {
        var p = await _db.Patients.FindAsync(id);
        return p == null ? null : MapToDto(p);
    }

    public async Task<PatientDto> CreateAsync(CreatePatientDto dto)
    {
        var patient = new Patient
        {
            Name = dto.Name,
            Cpf = dto.Cpf,
            Phone = dto.Phone,
            BirthDate = dto.BirthDate,
            Address = dto.Address,
        };

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();
        return MapToDto(patient);
    }

    public async Task<PatientDto?> UpdateAsync(int id, CreatePatientDto dto)
    {
        var patient = await _db.Patients.FindAsync(id);
        if (patient == null) return null;

        patient.Name = dto.Name;
        patient.Cpf = dto.Cpf;
        patient.Phone = dto.Phone;
        patient.BirthDate = dto.BirthDate;
        patient.Address = dto.Address;

        await _db.SaveChangesAsync();
        return MapToDto(patient);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var patient = await _db.Patients.FindAsync(id);
        if (patient == null) return false;

        _db.Patients.Remove(patient);
        await _db.SaveChangesAsync();
        return true;
    }

    private static PatientDto MapToDto(Patient p) =>
        new(p.Id, p.Name, p.Cpf, p.Phone, p.BirthDate, p.Address, p.CreatedAt);
}
