namespace MedicalReports.API.DTOs;

public record CreatePatientDto(
    string Name,
    string Cpf,
    string Phone,
    DateTime BirthDate,
    string Address
);

public record PatientDto(
    int Id,
    string Name,
    string Cpf,
    string Phone,
    DateTime BirthDate,
    string Address,
    DateTime CreatedAt
);
