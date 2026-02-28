using Microsoft.AspNetCore.Mvc;
using MedicalReports.API.DTOs;
using MedicalReports.API.Services;

namespace MedicalReports.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService) => _authService = authService;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Usuário ou senha inválidos." });

        return Ok(result);
    }
}
