# 🏥 Sistema de Laudos Médicos — Guia Completo de Implementação

> Stack: C# .NET 8 | Next.js 14 | TypeScript | PostgreSQL | TailwindCSS | Shadcn/ui | QuestPDF | Docker

---

## 📁 Estrutura Geral do Projeto

```
sistema-laudos/
├── backend/
│   └── MedicalReports.API/
├── frontend/
│   └── medical-reports-web/
├── docker-compose.yml
├── start.bat          ← inicia o projeto
├── update.bat         ← atualiza o projeto
└── README.md
```

---

## 🐘 1. DOCKER — Configuração Completa

### `docker-compose.yml` (raiz do projeto)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: laudos_db
    restart: always
    environment:
      POSTGRES_DB: laudos_medicos
      POSTGRES_USER: laudos_user
      POSTGRES_PASSWORD: laudos_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U laudos_user -d laudos_medicos"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend/MedicalReports.API
      dockerfile: Dockerfile
    container_name: laudos_api
    restart: always
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:5000
      ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=laudos_medicos;Username=laudos_user;Password=laudos_pass"
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/MedicalReports.API/wwwroot/images:/app/wwwroot/images

  frontend:
    build:
      context: ./frontend/medical-reports-web
      dockerfile: Dockerfile
    container_name: laudos_web
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## ▶️ 2. SCRIPTS DE START E UPDATE

### `start.bat` — Para Iniciar o Sistema

```bat
@echo off
echo =========================================
echo   Iniciando Sistema de Laudos Medicos
echo =========================================
cd /d "%~dp0"
docker-compose up -d
echo.
echo Sistema iniciado com sucesso!
echo Frontend: http://localhost:3000
echo API:      http://localhost:5000
echo.
pause
```

### `update.bat` — Para Atualizar o Sistema

```bat
@echo off
echo =========================================
echo   Atualizando Sistema de Laudos Medicos
echo =========================================
cd /d "%~dp0"
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo.
echo Sistema atualizado e iniciado!
pause
```

### Auto-iniciar com o Windows

Para iniciar com o Windows, crie um atalho do `start.bat` e coloque em:
`C:\Users\[SeuUsuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

---

## ⚙️ 3. BACKEND — C# .NET 8 (Visual Studio)

### 3.1 — Criar o Projeto no Visual Studio

1. Abra o Visual Studio
2. `Create new project` → `ASP.NET Core Web API`
3. Nome: `MedicalReports.API`
4. Framework: `.NET 8.0`
5. Desmarque `Use controllers` NÃO — marque sim (usaremos controllers)
6. Desmarque `Enable OpenAPI support` (opcional, pode deixar)

### 3.2 — Instalar os Pacotes NuGet

No **Package Manager Console**:

```powershell
Install-Package Microsoft.EntityFrameworkCore
Install-Package Microsoft.EntityFrameworkCore.Design
Install-Package Npgsql.EntityFrameworkCore.PostgreSQL
Install-Package QuestPDF
```

Ou no `.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
    <PackageReference Include="QuestPDF" Version="2024.3.0" />
  </ItemGroup>
</Project>
```

### 3.3 — Estrutura de Pastas do Backend

```
MedicalReports.API/
├── Controllers/
│   ├── PatientsController.cs
│   └── ReportsController.cs
├── Data/
│   └── AppDbContext.cs
├── Models/
│   ├── Patient.cs
│   └── MedicalReport.cs
├── DTOs/
│   ├── PatientDtos.cs
│   └── ReportDtos.cs
├── Services/
│   ├── PatientService.cs
│   ├── ReportService.cs
│   └── PdfService.cs
├── wwwroot/
│   └── images/
│       ├── Logo01.png   ← logo do médico (você coloca aqui)
│       └── Logo02.png   ← logo da medicina (você coloca aqui)
├── Program.cs
├── appsettings.json
└── Dockerfile
```

---

### 3.4 — Models

**`Models/Patient.cs`**

```csharp
using System.ComponentModel.DataAnnotations;

namespace MedicalReports.API.Models;

public class Patient
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Cpf { get; set; } = string.Empty;

    [Required]
    public DateTime BirthDate { get; set; }

    public string Address { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MedicalReport> Reports { get; set; } = new List<MedicalReport>();
}
```

**`Models/MedicalReport.cs`**

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalReports.API.Models;

public class MedicalReport
{
    public int Id { get; set; }

    [Required]
    public int PatientId { get; set; }

    public Patient Patient { get; set; } = null!;

    /// <summary>Inicial, Retorno, Perícia</summary>
    [Required]
    public string ReportType { get; set; } = string.Empty;

    [Required]
    public DateTime ConsultationDate { get; set; }

    /// <summary>Lista de códigos CID-10 (armazenados como JSON no banco)</summary>
    public List<string> Cid10Codes { get; set; } = new();

    public string PathologyDuration { get; set; } = string.Empty;

    public string Diagnosis { get; set; } = string.Empty;

    public string ClinicalPicture { get; set; } = string.Empty;

    public string Treatment { get; set; } = string.Empty;

    /// <summary>Cada prescrição em linha separada</summary>
    public string Prescription { get; set; } = string.Empty;

    public string Incapacities { get; set; } = string.Empty;

    public string Prognosis { get; set; } = string.Empty;

    // Dados do médico (para o rodapé do PDF)
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorCrm { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

---

### 3.5 — DTOs

**`DTOs/PatientDtos.cs`**

```csharp
namespace MedicalReports.API.DTOs;

public record CreatePatientDto(
    string Name,
    string Cpf,
    DateTime BirthDate,
    string Address
);

public record PatientDto(
    int Id,
    string Name,
    string Cpf,
    DateTime BirthDate,
    string Address,
    DateTime CreatedAt
);
```

**`DTOs/ReportDtos.cs`**

```csharp
namespace MedicalReports.API.DTOs;

public record CreateReportDto(
    int PatientId,
    string ReportType,
    DateTime ConsultationDate,
    List<string> Cid10Codes,
    string PathologyDuration,
    string Diagnosis,
    string ClinicalPicture,
    string Treatment,
    string Prescription,
    string Incapacities,
    string Prognosis,
    string DoctorName,
    string DoctorCrm
);

public record ReportDto(
    int Id,
    int PatientId,
    string PatientName,
    string ReportType,
    DateTime ConsultationDate,
    List<string> Cid10Codes,
    string PathologyDuration,
    string Diagnosis,
    string ClinicalPicture,
    string Treatment,
    string Prescription,
    string Incapacities,
    string Prognosis,
    string DoctorName,
    string DoctorCrm,
    DateTime CreatedAt
);
```

---

### 3.6 — AppDbContext

**`Data/AppDbContext.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Models;
using System.Text.Json;

namespace MedicalReports.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<MedicalReport> MedicalReports => Set<MedicalReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Armazena List<string> como JSON no PostgreSQL
        modelBuilder.Entity<MedicalReport>()
            .Property(r => r.Cid10Codes)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
            );

        modelBuilder.Entity<Patient>()
            .HasIndex(p => p.Cpf)
            .IsUnique();
    }
}
```

---

### 3.7 — Services

**`Services/PatientService.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Data;
using MedicalReports.API.DTOs;
using MedicalReports.API.Models;

namespace MedicalReports.API.Services;

public class PatientService
{
    private readonly AppDbContext _db;

    public PatientService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PatientDto>> GetAllAsync()
    {
        return await _db.Patients
            .OrderBy(p => p.Name)
            .Select(p => new PatientDto(p.Id, p.Name, p.Cpf, p.BirthDate, p.Address, p.CreatedAt))
            .ToListAsync();
    }

    public async Task<PatientDto?> GetByIdAsync(int id)
    {
        var p = await _db.Patients.FindAsync(id);
        if (p == null) return null;
        return new PatientDto(p.Id, p.Name, p.Cpf, p.BirthDate, p.Address, p.CreatedAt);
    }

    public async Task<PatientDto> CreateAsync(CreatePatientDto dto)
    {
        var patient = new Patient
        {
            Name = dto.Name,
            Cpf = dto.Cpf,
            BirthDate = dto.BirthDate,
            Address = dto.Address
        };

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();

        return new PatientDto(patient.Id, patient.Name, patient.Cpf,
            patient.BirthDate, patient.Address, patient.CreatedAt);
    }

    public async Task<PatientDto?> UpdateAsync(int id, CreatePatientDto dto)
    {
        var patient = await _db.Patients.FindAsync(id);
        if (patient == null) return null;

        patient.Name = dto.Name;
        patient.Cpf = dto.Cpf;
        patient.BirthDate = dto.BirthDate;
        patient.Address = dto.Address;

        await _db.SaveChangesAsync();
        return new PatientDto(patient.Id, patient.Name, patient.Cpf,
            patient.BirthDate, patient.Address, patient.CreatedAt);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var patient = await _db.Patients.FindAsync(id);
        if (patient == null) return false;

        _db.Patients.Remove(patient);
        await _db.SaveChangesAsync();
        return true;
    }
}
```

**`Services/ReportService.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Data;
using MedicalReports.API.DTOs;
using MedicalReports.API.Models;

namespace MedicalReports.API.Services;

public class ReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ReportDto>> GetAllAsync()
    {
        return await _db.MedicalReports
            .Include(r => r.Patient)
            .OrderByDescending(r => r.ConsultationDate)
            .Select(r => MapToDto(r))
            .ToListAsync();
    }

    public async Task<List<ReportDto>> GetByPatientAsync(int patientId)
    {
        return await _db.MedicalReports
            .Include(r => r.Patient)
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.ConsultationDate)
            .Select(r => MapToDto(r))
            .ToListAsync();
    }

    public async Task<ReportDto?> GetByIdAsync(int id)
    {
        var r = await _db.MedicalReports
            .Include(r => r.Patient)
            .FirstOrDefaultAsync(r => r.Id == id);
        return r == null ? null : MapToDto(r);
    }

    public async Task<ReportDto> CreateAsync(CreateReportDto dto)
    {
        var report = new MedicalReport
        {
            PatientId = dto.PatientId,
            ReportType = dto.ReportType,
            ConsultationDate = dto.ConsultationDate,
            Cid10Codes = dto.Cid10Codes,
            PathologyDuration = dto.PathologyDuration,
            Diagnosis = dto.Diagnosis,
            ClinicalPicture = dto.ClinicalPicture,
            Treatment = dto.Treatment,
            Prescription = dto.Prescription,
            Incapacities = dto.Incapacities,
            Prognosis = dto.Prognosis,
            DoctorName = dto.DoctorName,
            DoctorCrm = dto.DoctorCrm
        };

        _db.MedicalReports.Add(report);
        await _db.SaveChangesAsync();
        await _db.Entry(report).Reference(r => r.Patient).LoadAsync();

        return MapToDto(report);
    }

    private static ReportDto MapToDto(MedicalReport r) => new(
        r.Id, r.PatientId, r.Patient.Name, r.ReportType,
        r.ConsultationDate, r.Cid10Codes, r.PathologyDuration,
        r.Diagnosis, r.ClinicalPicture, r.Treatment, r.Prescription,
        r.Incapacities, r.Prognosis, r.DoctorName, r.DoctorCrm, r.CreatedAt
    );
}
```

---

### 3.8 — PDF Service com QuestPDF

**`Services/PdfService.cs`**

```csharp
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using MedicalReports.API.DTOs;

namespace MedicalReports.API.Services;

public class PdfService
{
    private readonly IWebHostEnvironment _env;

    public PdfService(IWebHostEnvironment env)
    {
        _env = env;
        // Licença Community (gratuita para uso não comercial)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateReport(ReportDto report, PatientDto patient)
    {
        var logo1Path = Path.Combine(_env.WebRootPath, "images", "Logo01.png");
        var logo2Path = Path.Combine(_env.WebRootPath, "images", "Logo02.png");

        // Formata a prescrição em lista de itens
        var prescriptionItems = report.Prescription
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Trim())
            .Where(l => !string.IsNullOrEmpty(l))
            .ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(1.5f, Unit.Centimetre);
                page.MarginBottom(2, Unit.Centimetre);
                page.MarginHorizontal(2, Unit.Centimetre);

                // ─── CABEÇALHO ────────────────────────────────────────────
                page.Header().Element(header =>
                {
                    header.Row(row =>
                    {
                        // Logo esquerda (médico)
                        row.ConstantItem(80).Height(60).Element(img =>
                        {
                            if (File.Exists(logo1Path))
                                img.Image(logo1Path).FitArea();
                            else
                                img.Text("[Logo Médico]").FontSize(8).FontColor(Colors.Grey.Medium);
                        });

                        row.RelativeItem().AlignCenter().AlignMiddle().Column(col =>
                        {
                            col.Item().Text("LAUDO MÉDICO")
                                .Bold()
                                .FontSize(16)
                                .FontColor(Colors.Black);
                            col.Item().Text($"Tipo: {report.ReportType}")
                                .FontSize(10)
                                .FontColor(Colors.Grey.Darken2);
                        });

                        // Logo direita (medicina)
                        row.ConstantItem(80).Height(60).Element(img =>
                        {
                            if (File.Exists(logo2Path))
                                img.Image(logo2Path).FitArea();
                            else
                                img.Text("[Logo Medicina]").FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                    });

                    header.PaddingBottom(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                });

                // ─── CONTEÚDO ─────────────────────────────────────────────
                page.Content().PaddingTop(10).Column(col =>
                {
                    // Bloco 1 — Dados do Paciente
                    col.Item().Background(Colors.Grey.Lighten4)
                        .Padding(10).Column(dados =>
                    {
                        dados.Item().Text("DADOS DO PACIENTE")
                            .Bold().FontSize(11).FontColor(Colors.Grey.Darken3);

                        dados.Item().PaddingTop(6).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(txt =>
                                {
                                    txt.Span("Nome: ").Bold().FontSize(10);
                                    txt.Span(patient.Name).FontSize(10);
                                });
                                c.Item().Text(txt =>
                                {
                                    txt.Span("CPF: ").Bold().FontSize(10);
                                    txt.Span(patient.Cpf).FontSize(10);
                                });
                            });
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(txt =>
                                {
                                    txt.Span("Data de Nascimento: ").Bold().FontSize(10);
                                    txt.Span(patient.BirthDate.ToString("dd/MM/yyyy")).FontSize(10);
                                });
                                c.Item().Text(txt =>
                                {
                                    txt.Span("Endereço: ").Bold().FontSize(10);
                                    txt.Span(patient.Address).FontSize(10);
                                });
                            });
                        });
                    });

                    col.Item().PaddingTop(12);

                    // Bloco 2 — Diagnóstico
                    SectionTitle(col, "DIAGNÓSTICO");
                    col.Item().PaddingHorizontal(4).Text(report.Diagnosis).FontSize(10).LineHeight(1.4f);

                    if (!string.IsNullOrEmpty(report.PathologyDuration))
                    {
                        col.Item().PaddingTop(4).PaddingHorizontal(4).Text(txt =>
                        {
                            txt.Span("Tempo de Patologia: ").Bold().FontSize(10);
                            txt.Span(report.PathologyDuration).FontSize(10);
                        });
                    }

                    col.Item().PaddingTop(10);

                    // Bloco 3 — Quadro Clínico
                    SectionTitle(col, "QUADRO CLÍNICO ATUAL");
                    col.Item().PaddingHorizontal(4).Text(report.ClinicalPicture).FontSize(10).LineHeight(1.4f);

                    col.Item().PaddingTop(10);

                    // Bloco 4 — Tratamento
                    SectionTitle(col, "TRATAMENTO");

                    if (!string.IsNullOrEmpty(report.Treatment))
                    {
                        col.Item().PaddingHorizontal(4).Text(report.Treatment).FontSize(10).LineHeight(1.4f);
                    }

                    if (prescriptionItems.Any())
                    {
                        col.Item().PaddingTop(6).PaddingHorizontal(4).Column(presc =>
                        {
                            presc.Item().Text("Prescrição:").Bold().FontSize(10);
                            foreach (var item in prescriptionItems)
                            {
                                presc.Item().PaddingLeft(8).PaddingTop(3).Row(row =>
                                {
                                    row.ConstantItem(10).Text("•").FontSize(10);
                                    row.RelativeItem().Text(item).FontSize(10).LineHeight(1.3f);
                                });
                            }
                        });
                    }

                    col.Item().PaddingTop(10);

                    // Bloco 5 — Incapacidades
                    if (!string.IsNullOrEmpty(report.Incapacities))
                    {
                        SectionTitle(col, "INCAPACIDADES");
                        col.Item().PaddingHorizontal(4).Text(report.Incapacities).FontSize(10).LineHeight(1.4f);
                        col.Item().PaddingTop(10);
                    }

                    // Bloco 6 — Conclusão
                    SectionTitle(col, "CONCLUSÃO");
                    col.Item().PaddingHorizontal(4).Text(report.Prognosis).FontSize(10).LineHeight(1.4f);

                    col.Item().PaddingTop(10);

                    // Bloco 7 — CID-10
                    SectionTitle(col, "CID-10");
                    col.Item().PaddingHorizontal(4).Column(cid =>
                    {
                        foreach (var code in report.Cid10Codes)
                        {
                            cid.Item().Text(code).FontSize(10);
                        }
                    });
                });

                // ─── RODAPÉ ───────────────────────────────────────────────
                page.Footer().Column(footer =>
                {
                    footer.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                    footer.Item().PaddingTop(8).Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text($"Parambu-CE, {report.ConsultationDate:dd/MM/yyyy}")
                                .FontSize(9);
                            col.Item().Text($"Documento gerado em: {DateTime.Now:dd/MM/yyyy HH:mm}")
                                .FontSize(8).FontColor(Colors.Grey.Medium);
                        });

                        row.ConstantItem(200).AlignRight().Column(col =>
                        {
                            col.Item().PaddingBottom(2)
                                .LineHorizontal(0.5f).LineColor(Colors.Black);
                            col.Item().AlignCenter().Text(report.DoctorName)
                                .Bold().FontSize(9);
                            col.Item().AlignCenter().Text($"CRM: {report.DoctorCrm}")
                                .FontSize(9).FontColor(Colors.Grey.Darken2);
                        });
                    });
                });
            });
        });

        return document.GeneratePdf();
    }

    private static void SectionTitle(ColumnDescriptor col, string title)
    {
        col.Item()
            .BorderBottom(1)
            .BorderColor(Colors.Blue.Lighten3)
            .PaddingBottom(3)
            .Text(title)
            .Bold()
            .FontSize(11)
            .FontColor(Colors.Blue.Darken3);
        col.Item().PaddingBottom(5);
    }
}
```

---

### 3.9 — Controllers

**`Controllers/PatientsController.cs`**

```csharp
using Microsoft.AspNetCore.Mvc;
using MedicalReports.API.DTOs;
using MedicalReports.API.Services;

namespace MedicalReports.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly PatientService _service;

    public PatientsController(PatientService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var patient = await _service.GetByIdAsync(id);
        return patient == null ? NotFound() : Ok(patient);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePatientDto dto)
    {
        var patient = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, patient);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreatePatientDto dto)
    {
        var patient = await _service.UpdateAsync(id, dto);
        return patient == null ? NotFound() : Ok(patient);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
```

**`Controllers/ReportsController.cs`**

```csharp
using Microsoft.AspNetCore.Mvc;
using MedicalReports.API.DTOs;
using MedicalReports.API.Services;

namespace MedicalReports.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;
    private readonly PatientService _patientService;
    private readonly PdfService _pdfService;

    public ReportsController(
        ReportService reportService,
        PatientService patientService,
        PdfService pdfService)
    {
        _reportService = reportService;
        _patientService = patientService;
        _pdfService = pdfService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _reportService.GetAllAsync());

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId) =>
        Ok(await _reportService.GetByPatientAsync(patientId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var report = await _reportService.GetByIdAsync(id);
        return report == null ? NotFound() : Ok(report);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportDto dto)
    {
        var report = await _reportService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = report.Id }, report);
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        var report = await _reportService.GetByIdAsync(id);
        if (report == null) return NotFound();

        var patient = await _patientService.GetByIdAsync(report.PatientId);
        if (patient == null) return NotFound();

        var pdfBytes = _pdfService.GenerateReport(report, patient);
        var fileName = $"laudo_{patient.Name.Replace(" ", "_")}_{report.ConsultationDate:yyyyMMdd}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }
}
```

---

### 3.10 — Program.cs

```csharp
using Microsoft.EntityFrameworkCore;
using MedicalReports.API.Data;
using MedicalReports.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Serviços
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Banco de Dados
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Serviços da aplicação
builder.Services.AddScoped<PatientService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<PdfService>();

// CORS para o frontend Next.js
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Migrations automáticas ao iniciar
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();
```

---

### 3.11 — appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Port=5432;Database=laudos_medicos;Username=laudos_user;Password=laudos_pass"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

---

### 3.12 — Migrations

No **Package Manager Console** do Visual Studio:

```powershell
Add-Migration InitialCreate
Update-Database
```

Se preferir pelo terminal:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

### 3.13 — Dockerfile do Backend

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MedicalReports.API.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Pasta para as logos (será montada como volume)
RUN mkdir -p /app/wwwroot/images
ENTRYPOINT ["dotnet", "MedicalReports.API.dll"]
```

---

## 🖥️ 4. FRONTEND — Next.js 14 (VS Code)

### 4.1 — Criar o Projeto

No terminal, dentro da pasta `frontend/`:

```bash
npx create-next-app@latest medical-reports-web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --turbopack \
  --src-dir \
  --import-alias "@/*"
```

### 4.2 — Instalar Shadcn/ui

```bash
cd medical-reports-web
npx shadcn@latest init
```

Escolha: `Default` style, `Slate` color, `yes` para CSS variables.

Instalar os componentes necessários:

```bash
npx shadcn@latest add button card input label select textarea form table badge dialog toast
```

### 4.3 — Instalar outras dependências

```bash
npm install react-hook-form @hookform/resolvers zod lucide-react axios date-fns
```

---

### 4.4 — Estrutura do Frontend

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── patients/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   └── reports/
│       ├── page.tsx
│       └── new/page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/  ← (gerado pelo shadcn)
└── lib/
    ├── api.ts
    └── utils.ts
```

---

### 4.5 — API Client

**`src/lib/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

export interface Patient {
  id: number;
  name: string;
  cpf: string;
  birthDate: string;
  address: string;
  createdAt: string;
}

export interface MedicalReport {
  id: number;
  patientId: number;
  patientName: string;
  reportType: string;
  consultationDate: string;
  cid10Codes: string[];
  pathologyDuration: string;
  diagnosis: string;
  clinicalPicture: string;
  treatment: string;
  prescription: string;
  incapacities: string;
  prognosis: string;
  doctorName: string;
  doctorCrm: string;
  createdAt: string;
}

// --- Patients ---
export const getPatients = () =>
  api.get<Patient[]>('/api/patients').then(r => r.data);

export const getPatient = (id: number) =>
  api.get<Patient>(`/api/patients/${id}`).then(r => r.data);

export const createPatient = (data: Omit<Patient, 'id' | 'createdAt'>) =>
  api.post<Patient>('/api/patients', data).then(r => r.data);

export const updatePatient = (id: number, data: Omit<Patient, 'id' | 'createdAt'>) =>
  api.put<Patient>(`/api/patients/${id}`, data).then(r => r.data);

export const deletePatient = (id: number) =>
  api.delete(`/api/patients/${id}`);

// --- Reports ---
export const getReports = () =>
  api.get<MedicalReport[]>('/api/reports').then(r => r.data);

export const getReportsByPatient = (patientId: number) =>
  api.get<MedicalReport[]>(`/api/reports/patient/${patientId}`).then(r => r.data);

export const createReport = (data: Omit<MedicalReport, 'id' | 'createdAt' | 'patientName'>) =>
  api.post<MedicalReport>('/api/reports', data).then(r => r.data);

export const downloadReportPdf = (id: number) => {
  window.open(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/${id}/pdf`,
    '_blank'
  );
};
```

---

### 4.6 — Layout Principal

**`src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema de Laudos Médicos',
  description: 'Geração de laudos médicos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 p-6 ml-64">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
```

---

### 4.7 — Sidebar

**`src/components/layout/Sidebar.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, FileText, Home, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/reports', label: 'Laudos', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Laudos Médicos</p>
            <p className="text-xs text-gray-500">Sistema Local</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">v1.0.0 — Sistema Local</p>
      </div>
    </aside>
  );
}
```

---

### 4.8 — Dashboard

**`src/app/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPatients, getReports } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [patientCount, setPatientCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    getPatients().then(p => setPatientCount(p.length));
    getReports().then(r => {
      setReportCount(r.length);
      setRecentReports(r.slice(0, 5));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do sistema</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patientCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Laudos Gerados
            </CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="flex gap-3">
        <Link href="/patients/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Users className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        </Link>
        <Link href="/reports/new">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Novo Laudo
          </Button>
        </Link>
      </div>

      {/* Últimos laudos */}
      {recentReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Últimos Laudos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentReports.map(r => (
                <div key={r.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.patientName}</p>
                    <p className="text-xs text-gray-500">
                      {r.reportType} · {new Date(r.consultationDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Link href={`/reports?id=${r.id}`}>
                    <Button variant="ghost" size="sm">Ver</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### 4.9 — Página de Pacientes

**`src/app/patients/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { getPatients, deletePatient, Patient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const load = () => getPatients().then(setPatients);

  useEffect(() => { load(); }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf.includes(search)
  );

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Deseja excluir o paciente ${name}?`)) return;
    await deletePatient(id);
    toast({ title: 'Paciente excluído com sucesso.' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm">{patients.length} paciente(s) cadastrado(s)</p>
        </div>
        <Link href="/patients/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">CPF</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nascimento</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Endereço</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                filtered.map(patient => (
                  <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-medium text-gray-900 text-sm">{patient.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600 font-mono">{patient.cpf}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {format(new Date(patient.birthDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                      {patient.address}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/reports/new?patientId=${patient.id}`}>
                          <Button variant="ghost" size="icon" title="Novo laudo">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </Button>
                        </Link>
                        <Link href={`/patients/new?edit=${patient.id}`}>
                          <Button variant="ghost" size="icon" title="Editar">
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(patient.id, patient.name)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 4.10 — Formulário de Paciente

**`src/app/patients/new/page.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { createPatient, updatePatient, getPatient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  address: z.string().min(5, 'Endereço deve ter ao menos 5 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function NewPatientPage() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('edit');
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (editId) {
      getPatient(Number(editId)).then(p => {
        setValue('name', p.name);
        setValue('cpf', p.cpf);
        setValue('birthDate', p.birthDate.split('T')[0]);
        setValue('address', p.address);
      });
    }
  }, [editId]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editId) {
        await updatePatient(Number(editId), data);
        toast({ title: 'Paciente atualizado com sucesso!' });
      } else {
        await createPatient(data);
        toast({ title: 'Paciente cadastrado com sucesso!' });
      }
      router.push('/patients');
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.response?.data || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editId ? 'Editar Paciente' : 'Novo Paciente'}
          </h1>
          <p className="text-sm text-gray-500">Preencha os dados do paciente</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input id="name" {...register('name')} placeholder="Francisco Damião da Silva" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
                {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
                {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço *</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Tamboril, zona rural de Parambu-CE"
              />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Paciente'}
              </Button>
              <Link href="/patients">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 4.11 — Formulário de Laudo (o mais importante!)

**`src/app/reports/new/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { createReport, getPatients, Patient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

const schema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente'),
  reportType: z.string().min(1, 'Selecione o tipo de laudo'),
  consultationDate: z.string().min(1, 'Data da consulta obrigatória'),
  cid10Codes: z.array(z.object({ code: z.string().min(1) })).min(1, 'Informe ao menos um CID-10'),
  pathologyDuration: z.string().optional(),
  diagnosis: z.string().min(5, 'Diagnóstico obrigatório'),
  clinicalPicture: z.string().min(5, 'Quadro clínico obrigatório'),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  incapacities: z.string().optional(),
  prognosis: z.string().min(5, 'Prognóstico obrigatório'),
  doctorName: z.string().min(3, 'Nome do médico obrigatório'),
  doctorCrm: z.string().min(3, 'CRM obrigatório'),
});

type FormData = z.infer<typeof schema>;

export default function NewReportPage() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedPatientId = params.get('patientId');
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);

  const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        consultationDate: new Date().toISOString().split('T')[0],
        cid10Codes: [{ code: '' }],
      },
    });

  const { fields: cidFields, append: appendCid, remove: removeCid } =
    useFieldArray({ control, name: 'cid10Codes' });

  useEffect(() => {
    getPatients().then(setPatients);
    if (preselectedPatientId) {
      setValue('patientId', preselectedPatientId);
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const report = await createReport({
        patientId: Number(data.patientId),
        reportType: data.reportType,
        consultationDate: data.consultationDate,
        cid10Codes: data.cid10Codes.map(c => c.code),
        pathologyDuration: data.pathologyDuration || '',
        diagnosis: data.diagnosis,
        clinicalPicture: data.clinicalPicture,
        treatment: data.treatment || '',
        prescription: data.prescription || '',
        incapacities: data.incapacities || '',
        prognosis: data.prognosis,
        doctorName: data.doctorName,
        doctorCrm: data.doctorCrm,
      });

      toast({ title: 'Laudo criado com sucesso!' });
      
      // Redireciona para a página de laudos para baixar o PDF
      router.push(`/reports?newId=${report.id}`);
    } catch (err: any) {
      toast({
        title: 'Erro ao criar laudo',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Laudo Médico</h1>
          <p className="text-sm text-gray-500">Preencha todas as informações do laudo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Bloco: Identificação */}
        <Card>
          <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select
                  defaultValue={preselectedPatientId || ''}
                  onValueChange={v => setValue('patientId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patientId && (
                  <p className="text-xs text-red-500">{errors.patientId.message}</p>
                )}
              </div>

              {/* Tipo de Laudo */}
              <div className="space-y-2">
                <Label>Tipo de Laudo *</Label>
                <Select onValueChange={v => setValue('reportType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inicial">Inicial</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                    <SelectItem value="Perícia">Perícia</SelectItem>
                  </SelectContent>
                </Select>
                {errors.reportType && (
                  <p className="text-xs text-red-500">{errors.reportType.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultationDate">Data da Consulta *</Label>
                <Input id="consultationDate" type="date" {...register('consultationDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pathologyDuration">Tempo de Patologia</Label>
                <Input
                  id="pathologyDuration"
                  {...register('pathologyDuration')}
                  placeholder="Ex: 20 anos"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco: CID-10 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">CID-10 *</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCid({ code: '' })}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar CID
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {cidFields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`cid10Codes.${i}.code`)}
                  placeholder="Ex: H54, F20, G80"
                  className="font-mono"
                />
                {cidFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCid(i)}
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </Button>
                )}
              </div>
            ))}
            {errors.cid10Codes && (
              <p className="text-xs text-red-500">Informe ao menos um CID-10</p>
            )}
          </CardContent>
        </Card>

        {/* Bloco: Clínico */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dados Clínicos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico *</Label>
              <Textarea
                id="diagnosis"
                {...register('diagnosis')}
                placeholder="Portador de cegueira total bilateral congênita..."
                rows={3}
              />
              {errors.diagnosis && (
                <p className="text-xs text-red-500">{errors.diagnosis.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicalPicture">Quadro Clínico Atual *</Label>
              <Textarea
                id="clinicalPicture"
                {...register('clinicalPicture')}
                placeholder="Totalmente dependente dos pais, não se alimenta sozinho..."
                rows={4}
              />
              {errors.clinicalPicture && (
                <p className="text-xs text-red-500">{errors.clinicalPicture.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="incapacities">Incapacidades</Label>
              <Textarea
                id="incapacities"
                {...register('incapacities')}
                placeholder="Incapaz para qualquer atividade laboral..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco: Tratamento */}
        <Card>
          <CardHeader><CardTitle className="text-base">Tratamento e Prescrição</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="treatment">Tratamento Realizado</Label>
              <Textarea
                id="treatment"
                {...register('treatment')}
                placeholder="Iniciou tratamento aos 20 meses. Atualmente faz tratamento contínuo..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescription">
                Prescrição
                <span className="text-xs text-gray-400 ml-2">(um item por linha)</span>
              </Label>
              <Textarea
                id="prescription"
                {...register('prescription')}
                placeholder={`Neozine gotas 4,0% – 60 gotas 12/12h\nHaldol gotas 02 mg/ml – 60 gotas 12/12h\nRisperidona gotas 01 mg/ml – 20 gotas 12/12h`}
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco: Conclusão */}
        <Card>
          <CardHeader><CardTitle className="text-base">Conclusão do Laudo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="prognosis">Prognóstico / Conclusão *</Label>
              <Textarea
                id="prognosis"
                {...register('prognosis')}
                placeholder="Diante do quadro, o paciente necessita de benefício permanente, pois o mesmo não reúne condições para realizar qualquer atividade laboral..."
                rows={4}
              />
              {errors.prognosis && (
                <p className="text-xs text-red-500">{errors.prognosis.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bloco: Médico */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do Médico</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Nome do Médico *</Label>
                <Input
                  id="doctorName"
                  {...register('doctorName')}
                  placeholder="Dr. João da Silva"
                />
                {errors.doctorName && (
                  <p className="text-xs text-red-500">{errors.doctorName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorCrm">CRM *</Label>
                <Input
                  id="doctorCrm"
                  {...register('doctorCrm')}
                  placeholder="CRM/CE 00000"
                />
                {errors.doctorCrm && (
                  <p className="text-xs text-red-500">{errors.doctorCrm.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Gerando Laudo...' : 'Gerar Laudo'}
          </Button>
          <Link href="/reports">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
```

---

### 4.12 — Página de Laudos

**`src/app/reports/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Eye } from 'lucide-react';
import { getReports, downloadReportPdf, MedicalReport } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

const reportTypeColor: Record<string, string> = {
  'Inicial': 'bg-blue-100 text-blue-700',
  'Retorno': 'bg-green-100 text-green-700',
  'Perícia': 'bg-purple-100 text-purple-700',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const params = useSearchParams();
  const newId = params.get('newId');
  const { toast } = useToast();

  useEffect(() => {
    getReports().then(r => {
      setReports(r);
      // Se acabou de criar um laudo novo, faz download automático
      if (newId) {
        setTimeout(() => {
          downloadReportPdf(Number(newId));
          toast({ title: '✅ Laudo gerado! O PDF foi aberto para download.' });
        }, 500);
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laudos Médicos</h1>
          <p className="text-gray-500 text-sm">{reports.length} laudo(s) gerado(s)</p>
        </div>
        <Link href="/reports/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Laudo
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Consulta</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">CID-10</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Médico</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                    Nenhum laudo encontrado
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 ${
                      String(r.id) === newId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="p-4">
                      <p className="font-medium text-sm text-gray-900">{r.patientName}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        reportTypeColor[r.reportType] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {r.reportType}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {format(new Date(r.consultationDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {r.cid10Codes.map(code => (
                          <span key={code} className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{r.doctorName}</td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReportPdf(r.id)}
                        className="gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 4.13 — Dockerfile do Frontend

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 4.14 — next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

---

## 🖼️ 5. COMO COLOCAR AS LOGOS

Após montar o projeto, coloque os arquivos de logo em:

```
backend/MedicalReports.API/wwwroot/images/Logo01.png  ← Logo do médico (esq.)
backend/MedicalReports.API/wwwroot/images/Logo02.png  ← Logo da medicina (dir.)
```

O Docker Compose já está configurado para montar esta pasta como volume, então basta colocar os arquivos lá e eles estarão disponíveis sem precisar rebuildar.

---

## 🚀 6. COMO RODAR PELA PRIMEIRA VEZ

```bash
# 1. Clone/crie a pasta do projeto
mkdir sistema-laudos && cd sistema-laudos

# 2. Crie a estrutura de pastas

# 3. Copie todos os arquivos conforme guia

# 4. Adicione as logos em:
#    backend/MedicalReports.API/wwwroot/images/

# 5. Gere a migration (precisa do SDK .NET instalado)
cd backend/MedicalReports.API
dotnet ef migrations add InitialCreate

# 6. Volte para a raiz e suba tudo
cd ../..
docker-compose up --build -d

# 7. Acesse em:
#    http://localhost:3000
```

---

## 📋 7. FLUXO DE USO DO SISTEMA

```
1. Dashboard → clique "Novo Paciente"
2. Preenche: Nome, CPF, Data de Nascimento, Endereço → Salvar
3. Na lista de Pacientes → clique no ícone 📄 ao lado do paciente
4. Preenche o formulário do Laudo:
   - Tipo (Inicial / Retorno / Perícia)
   - Data da consulta
   - CID-10 (pode adicionar vários)
   - Diagnóstico, Quadro Clínico, Tratamento
   - Prescrição (um item por linha)
   - Incapacidades, Conclusão/Prognóstico
   - Nome e CRM do médico
5. Clica "Gerar Laudo"
6. O PDF é aberto automaticamente para download/impressão
```

---

## 🔧 8. DICAS FINAIS

- **Logos**: Mantenha-as com fundo branco ou transparente, tamanho ~200x80px para melhor resultado no PDF.
- **Auto-start Windows**: O Docker Desktop tem opção "Start Docker Desktop when you log in" — com isso e o `docker-compose restart: always`, tudo sobe automaticamente.
- **Backup do banco**: Os dados ficam no volume `postgres_data`. Para fazer backup: `docker exec laudos_db pg_dump -U laudos_user laudos_medicos > backup.sql`
- **Prescrição no PDF**: Cada linha do campo prescrição vira um item com bullet no PDF, exatamente como no modelo físico.
