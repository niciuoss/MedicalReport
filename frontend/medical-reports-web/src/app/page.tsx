'use client';

import { useEffect, useState } from 'react';
import { Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPatients, getReports } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
              <FileText className="h-4 w-4" />
              Últimos Laudos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentReports.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.patientName}</p>
                    <p className="text-xs text-gray-500">
                      {r.reportType} · {format(new Date(r.consultationDate), 'dd/MM/yyyy', { locale: ptBR })}
                      {r.doctorName && ` · ${r.doctorName}`}
                    </p>
                  </div>
                  <Link href="/reports">
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
