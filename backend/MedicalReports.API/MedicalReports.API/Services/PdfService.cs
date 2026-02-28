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
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateReport(ReportDto report, PatientDto patient)
    {
        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var logo1Path = Path.Combine(webRoot, "images", "Logo01.png");
        var logo2Path = Path.Combine(webRoot, "images", "Logo02.png");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(1.5f, Unit.Centimetre);
                page.MarginBottom(2, Unit.Centimetre);
                page.MarginHorizontal(2, Unit.Centimetre);

                // ─── CABEÇALHO ────────────────────────────────────────────
                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Row(row =>
                    {
                        // Logo01 — dobro do tamanho original
                        row.ConstantItem(160).Height(80).Element(img =>
                        {
                            if (File.Exists(logo1Path))
                                img.Image(logo1Path).FitArea();
                            else
                                img.Text("[Logo]").FontSize(8).FontColor(Colors.Grey.Medium);
                        });

                        // Título centralizado — containers simétricos dos dois lados
                        row.RelativeItem().AlignCenter().AlignMiddle().Column(col =>
                        {
                            col.Item().Text("LAUDO MÉDICO")
                                .Bold().FontSize(16).FontColor(Colors.Black);
                            col.Item().Text($"Tipo: {report.ReportType}")
                                .FontSize(10).FontColor(Colors.Grey.Darken2);
                        });

                        // Logo02 — container de 160px (simétrico com Logo01), imagem alinhada à direita
                        row.ConstantItem(160).Height(80).AlignRight().AlignMiddle().Element(outer =>
                        {
                            outer.AlignRight().AlignMiddle().Element(inner =>
                            {
                                inner.Width(80).Height(60).Element(img =>
                                {
                                    if (File.Exists(logo2Path))
                                        img.Image(logo2Path).FitArea();
                                    else
                                        img.Text("[Logo]").FontSize(8).FontColor(Colors.Grey.Medium);
                                });
                            });
                        });
                    });

                    headerCol.Item().PaddingBottom(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                });

                // ─── CONTEÚDO ─────────────────────────────────────────────
                page.Content().PaddingTop(10).Column(col =>
                {
                    // Dados do Paciente
                    col.Item().Background(Colors.Grey.Lighten4).Padding(10).Column(dados =>
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
                                if (!string.IsNullOrEmpty(patient.Phone))
                                {
                                    c.Item().Text(txt =>
                                    {
                                        txt.Span("Telefone: ").Bold().FontSize(10);
                                        txt.Span(patient.Phone).FontSize(10);
                                    });
                                }
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
                                    txt.Span("Localidade: ").Bold().FontSize(10);
                                    txt.Span(patient.Address).FontSize(10);
                                });
                            });
                        });
                    });

                    col.Item().PaddingTop(12);

                    // Diagnóstico
                    SectionTitle(col, "DIAGNÓSTICO");
                    col.Item().PaddingHorizontal(4).Text(report.Diagnosis ?? "").FontSize(10).LineHeight(1.4f);

                    col.Item().PaddingTop(10);

                    // Quadro Clínico
                    SectionTitle(col, "QUADRO CLÍNICO ATUAL");
                    col.Item().PaddingHorizontal(4).Text(report.ClinicalPicture ?? "").FontSize(10).LineHeight(1.4f);

                    col.Item().PaddingTop(10);

                    // Tratamento
                    SectionTitle(col, "TRATAMENTO");

                    if (!string.IsNullOrEmpty(report.Treatment))
                    {
                        col.Item().PaddingHorizontal(4).Text(report.Treatment).FontSize(10).LineHeight(1.4f);
                    }

                    if (report.Medications.Any())
                    {
                        col.Item().PaddingTop(6).PaddingHorizontal(4).Column(presc =>
                        {
                            presc.Item().Text("Medicamentos:").Bold().FontSize(10);
                            foreach (var med in report.Medications)
                            {
                                presc.Item().PaddingLeft(8).PaddingTop(3).Row(row =>
                                {
                                    row.ConstantItem(10).Text("•").FontSize(10);
                                    row.RelativeItem().Text(txt =>
                                    {
                                        txt.Span(med.Name).Bold().FontSize(10);
                                        if (!string.IsNullOrEmpty(med.Quantity))
                                            txt.Span($" — {med.Quantity}").FontSize(10);
                                        if (!string.IsNullOrEmpty(med.Duration))
                                            txt.Span($" por {med.Duration}").FontSize(10).FontColor(Colors.Grey.Darken2);
                                    });
                                });
                            }
                        });
                    }

                    col.Item().PaddingTop(10);

                    // Conclusão
                    SectionTitle(col, "CONCLUSÃO");
                    col.Item().PaddingHorizontal(4).Text(report.Conclusion ?? "").FontSize(10).LineHeight(1.4f);

                    col.Item().PaddingTop(10);

                    // CID-10
                    SectionTitle(col, "CID-10");
                    col.Item().PaddingHorizontal(4).Row(row =>
                    {
                        foreach (var code in report.Cid10Codes)
                        {
                            row.AutoItem().PaddingRight(8).Text(code).FontSize(10).Bold();
                        }
                    });

                    // Espaço para assinatura
                    col.Item().PaddingTop(40);
                });

                // ─── RODAPÉ ───────────────────────────────────────────────
                page.Footer().Column(footer =>
                {
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
                            if (!string.IsNullOrEmpty(report.DoctorCrm))
                            {
                                col.Item().AlignCenter().Text($"CRM: {report.DoctorCrm}")
                                    .FontSize(9).FontColor(Colors.Grey.Darken2);
                            }
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
            .BorderColor(Colors.Grey.Lighten1)
            .PaddingBottom(3)
            .Text(title)
            .Bold()
            .FontSize(11)
            .FontColor(Colors.Black);
        col.Item().PaddingBottom(5);
    }
}
