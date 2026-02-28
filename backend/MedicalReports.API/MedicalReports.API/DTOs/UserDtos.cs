namespace MedicalReports.API.DTOs;

public record CreateUserDto(
    string Username,
    string Password,
    string Role,
    string FullName,
    string? Crm
);

public record UpdateUserDto(
    string? Password,
    string Role,
    string FullName,
    string? Crm,
    bool IsActive
);

public record UserDto(
    int Id,
    string Username,
    string Role,
    string FullName,
    string? Crm,
    bool IsActive,
    DateTime CreatedAt
);
