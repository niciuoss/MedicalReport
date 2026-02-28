using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Data;
using MedicalReports.API.DTOs;
using MedicalReports.API.Models;

namespace MedicalReports.API.Services;

public class UserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db) => _db = db;

    public async Task<List<UserDto>> GetAllAsync() =>
        await _db.Users
            .OrderBy(u => u.FullName)
            .Select(u => MapToDto(u))
            .ToListAsync();

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var u = await _db.Users.FindAsync(id);
        return u == null ? null : MapToDto(u);
    }

    public async Task<(UserDto? user, string? error)> CreateAsync(CreateUserDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
            return (null, "Nome de usuário já está em uso.");

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            FullName = dto.FullName,
            Crm = dto.Crm,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return (MapToDto(user), null);
    }

    public async Task<UserDto?> UpdateAsync(int id, UpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return null;

        user.Role = dto.Role;
        user.FullName = dto.FullName;
        user.Crm = dto.Crm;
        user.IsActive = dto.IsActive;

        if (!string.IsNullOrEmpty(dto.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        await _db.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return false;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return true;
    }

    private static UserDto MapToDto(User u) =>
        new(u.Id, u.Username, u.Role, u.FullName, u.Crm, u.IsActive, u.CreatedAt);
}
