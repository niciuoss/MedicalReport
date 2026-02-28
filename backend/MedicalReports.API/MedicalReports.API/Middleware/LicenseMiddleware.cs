using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Data;

namespace MedicalReports.API.Middleware;

public class LicenseMiddleware
{
    private readonly RequestDelegate _next;

    // Cache em memória: evita consultar o banco a cada requisição
    private static bool _isValid = true;
    private static DateTime _lastCheck = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
    private static readonly SemaphoreSlim _semaphore = new(1, 1);

    public LicenseMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        // Só bloqueia rotas da API
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        // Revalida cache a cada 5 minutos
        if (DateTime.UtcNow - _lastCheck > CacheDuration)
        {
            await _semaphore.WaitAsync();
            try
            {
                if (DateTime.UtcNow - _lastCheck > CacheDuration)
                {
                    var license = await db.LicenseConfigs.FirstOrDefaultAsync();
                    if (license != null)
                    {
                        // Se a validade venceu, zera a chave automaticamente
                        if (license.LicenseKey == 1 && DateTime.UtcNow > license.ExpiresAt)
                        {
                            license.LicenseKey = 0;
                            await db.SaveChangesAsync();
                        }
                        _isValid = license.LicenseKey == 1;
                    }
                    _lastCheck = DateTime.UtcNow;
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }

        if (!_isValid)
        {
            context.Response.StatusCode = 402;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsync(
                "{\"error\":\"Licença expirada. Entre em contato com o desenvolvedor.\"}");
            return;
        }

        await _next(context);
    }
}
