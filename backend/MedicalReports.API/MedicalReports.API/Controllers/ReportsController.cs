using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MedicalReports.API.DTOs;
using MedicalReports.API.Services;

namespace MedicalReports.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
    public async Task<IActionResult> GetAll() => Ok(await _reportService.GetAllAsync());

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
        var doctorIdClaim = User.FindFirst("uid")?.Value;
        if (!int.TryParse(doctorIdClaim, out var doctorId))
            return Unauthorized();

        var report = await _reportService.CreateAsync(dto, doctorId);
        return CreatedAtAction(nameof(GetById), new { id = report.Id }, report);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateReportDto dto)
    {
        var report = await _reportService.UpdateAsync(id, dto);
        return report == null ? NotFound() : Ok(report);
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
