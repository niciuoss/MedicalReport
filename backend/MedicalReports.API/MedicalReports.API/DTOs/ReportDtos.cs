namespace MedicalReports.API.DTOs;

public record MedicationDto(
    string Name,
    string Quantity,
    string Duration
);

public record CreateReportDto(
    int PatientId,
    string ReportType,
    DateTime ConsultationDate,
    List<string> Cid10Codes,
    string Diagnosis,
    string ClinicalPicture,
    string Treatment,
    List<MedicationDto> Medications,
    string Conclusion
);

public record ReportDto(
    int Id,
    int PatientId,
    string PatientName,
    int DoctorId,
    string DoctorName,
    string DoctorCrm,
    string ReportType,
    DateTime ConsultationDate,
    List<string> Cid10Codes,
    string Diagnosis,
    string ClinicalPicture,
    string Treatment,
    List<MedicationDto> Medications,
    string Conclusion,
    DateTime CreatedAt
);
