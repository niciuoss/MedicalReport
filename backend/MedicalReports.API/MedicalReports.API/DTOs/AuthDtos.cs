namespace MedicalReports.API.DTOs;

public record LoginDto(string Username, string Password);

public record LoginResponseDto(
    string Token,
    string Username,
    string Role,
    string FullName,
    string? Crm
);
