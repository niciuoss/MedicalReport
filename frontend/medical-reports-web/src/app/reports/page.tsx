'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Download, Search, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReports, downloadReportPdf, MedicalReport } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const reportTypeColor: Record<string, string> = {
  'Inicial': 'bg-blue-100 text-blue-700',
  'Retorno': 'bg-green-100 text-green-700',
  'Perícia': 'bg-purple-100 text-purple-700',
};

const PAGE_SIZE = 10;

export default function ReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewReport, setViewReport] = useState<MedicalReport | null>(null);
  const params = useSearchParams();
  const newId = params.get('newId');

  useEffect(() => {
    getReports().then(r => {
      setReports(r);
      if (newId) {
        setTimeout(() => {
          const report = r.find(x => String(x.id) === newId);
          handleDownload(Number(newId), report?.patientName);
        }, 400);
      }
    });
  }, []);

  const filtered = reports.filter(r =>
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.reportType.toLowerCase().includes(search.toLowerCase()) ||
    r.cid10Codes.some(c => c.toLowerCase().includes(search.toLowerCase())) ||
    r.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const handleDownload = async (id: number, patientName?: string) => {
    setDownloading(id);
    try {
      await downloadReportPdf(id, patientName);
      toast.success('PDF gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar o PDF.');
    } finally {
      setDownloading(null);
    }
  };

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

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por paciente, tipo, CID-10 ou médico..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                    Nenhum laudo encontrado
                  </td>
                </tr>
              ) : (
                paginated.map(r => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 ${String(r.id) === newId ? 'bg-blue-50' : ''}`}
                  >
                    <td className="p-4">
                      <p className="font-medium text-sm text-gray-900">{r.patientName}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${reportTypeColor[r.reportType] || 'bg-gray-100 text-gray-600'}`}>
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
                    <td className="p-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">{r.doctorName}</p>
                        {r.doctorCrm && <p className="text-xs text-gray-400">{r.doctorCrm}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Visualizar"
                          onClick={() => setViewReport(r)}
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Link href={`/reports/new?edit=${r.id}`}>
                          <Button variant="ghost" size="icon" title="Editar">
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(r.id, r.patientName)}
                          disabled={downloading === r.id}
                          className="gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {downloading === r.id ? 'Gerando...' : 'PDF'}
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <Button
                key={n}
                variant={n === page ? 'default' : 'outline'}
                size="icon"
                onClick={() => setPage(n)}
                className={n === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {n}
              </Button>
            ))}
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de visualização */}
      <Dialog open={!!viewReport} onOpenChange={open => !open && setViewReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laudo — {viewReport?.patientName}</DialogTitle>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                <div><span className="font-semibold text-gray-600">Paciente:</span> {viewReport.patientName}</div>
                <div><span className="font-semibold text-gray-600">Tipo:</span> {viewReport.reportType}</div>
                <div>
                  <span className="font-semibold text-gray-600">Consulta:</span>{' '}
                  {format(new Date(viewReport.consultationDate), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Médico:</span> {viewReport.doctorName}
                  {viewReport.doctorCrm && ` (CRM: ${viewReport.doctorCrm})`}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-600">CID-10:</span>{' '}
                  <span className="font-mono">{viewReport.cid10Codes.join(', ')}</span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-1 border-b pb-1">Diagnóstico</p>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{viewReport.diagnosis}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-1 border-b pb-1">Quadro Clínico Atual</p>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{viewReport.clinicalPicture}</p>
              </div>

              {(viewReport.treatment || viewReport.medications.length > 0) && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1 border-b pb-1">Tratamento</p>
                  {viewReport.treatment && (
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mb-2">{viewReport.treatment}</p>
                  )}
                  {viewReport.medications.length > 0 && (
                    <ul className="space-y-1 ml-2">
                      {viewReport.medications.map((m, i) => (
                        <li key={i} className="text-gray-600">
                          <span className="font-medium">• {m.name}</span>
                          {m.quantity && <span className="text-gray-500"> — {m.quantity}</span>}
                          {m.duration && <span className="text-gray-400"> por {m.duration}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <p className="font-semibold text-gray-700 mb-1 border-b pb-1">Conclusão</p>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{viewReport.conclusion}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
