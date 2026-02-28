'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, FileText, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getPatients, createPatient, updatePatient, deletePatient, getPatient, Patient } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  phone: z.string().optional(),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  address: z.string().min(3, 'Localidade obrigatória'),
});

type FormData = z.infer<typeof schema>;

const PAGE_SIZE = 10;

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = () => getPatients().then(setPatients);
  useEffect(() => { load(); }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf.includes(search) ||
    (p.phone && p.phone.includes(search))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => {
    reset({ name: '', cpf: '', phone: '', birthDate: '', address: '' });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const p = await getPatient(id);
      reset({
        name: p.name,
        cpf: p.cpf,
        phone: p.phone ?? '',
        birthDate: p.birthDate.split('T')[0],
        address: p.address,
      });
      setEditId(id);
      setDialogOpen(true);
    } catch {
      toast.error('Erro ao carregar dados do paciente.');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        cpf: data.cpf,
        phone: data.phone ?? '',
        birthDate: data.birthDate,
        address: data.address,
      };
      if (editId) {
        await updatePatient(editId, payload);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await createPatient(payload);
        toast.success('Paciente cadastrado com sucesso!');
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Deseja excluir o paciente ${name}?`)) return;
    try {
      await deletePatient(id);
      toast.success('Paciente excluído com sucesso.');
      load();
    } catch {
      toast.error('Erro ao excluir paciente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm">{patients.length} paciente(s) cadastrado(s)</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Paciente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, CPF ou telefone..."
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
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nascimento</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Localidade</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                paginated.map(patient => (
                  <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-medium text-gray-900 text-sm">{patient.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600 font-mono">{patient.cpf}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {patient.phone || <span className="text-gray-300">—</span>}
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
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(patient.id)}>
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
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

      {/* Dialog de cadastro/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input id="name" {...register('name')} placeholder="Francisco Damião da Silva" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
                {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register('phone')} placeholder="(88) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Nascimento *</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
                {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Localidade *</Label>
                <Input id="address" {...register('address')} placeholder="Parambu-CE" />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
