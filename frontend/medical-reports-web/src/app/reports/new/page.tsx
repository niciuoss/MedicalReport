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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Plus, X, Pill } from 'lucide-react';
import { createReport, updateReport, getReport, getPatients, Patient } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

const schema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente'),
  reportType: z.string().min(1, 'Selecione o tipo de laudo'),
  consultationDate: z.string().min(1, 'Data da consulta obrigatória'),
  diagnosis: z.string().min(5, 'Diagnóstico obrigatório'),
  clinicalPicture: z.string().min(5, 'Quadro clínico obrigatório'),
  treatment: z.string().optional(),
  medications: z.array(z.object({
    name: z.string(),
    quantity: z.string(),
    duration: z.string(),
  })),
  cid10Codes: z.array(z.object({ code: z.string().min(1, 'CID obrigatório') }))
    .min(1, 'Informe ao menos um CID-10'),
  conclusion: z.string().min(5, 'Conclusão obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function NewReportPage() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedPatientId = params.get('patientId');
  const editId = params.get('edit');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      consultationDate: new Date().toISOString().split('T')[0],
      medications: [{ name: '', quantity: '', duration: '' }],
      cid10Codes: [{ code: '' }],
    },
  });

  const {
    fields: cidFields,
    append: appendCid,
    remove: removeCid,
    replace: replaceCids,
  } = useFieldArray({ control, name: 'cid10Codes' });

  const {
    fields: medFields,
    append: appendMed,
    remove: removeMed,
    replace: replaceMeds,
  } = useFieldArray({ control, name: 'medications' });

  useEffect(() => {
    getPatients().then(setPatients);
  }, []);

  useEffect(() => {
    if (preselectedPatientId && !editId) {
      setValue('patientId', preselectedPatientId);
    }
  }, [preselectedPatientId, editId, setValue]);

  useEffect(() => {
    if (!editId) return;
    getReport(Number(editId)).then(r => {
      reset({
        patientId: String(r.patientId),
        reportType: r.reportType,
        consultationDate: r.consultationDate.split('T')[0],
        diagnosis: r.diagnosis,
        clinicalPicture: r.clinicalPicture,
        treatment: r.treatment,
        medications: r.medications.length > 0
          ? r.medications
          : [{ name: '', quantity: '', duration: '' }],
        cid10Codes: r.cid10Codes.map(code => ({ code })),
        conclusion: r.conclusion,
      });
      setLoadingEdit(false);
    }).catch(() => {
      toast.error('Erro ao carregar laudo.');
      setLoadingEdit(false);
    });
  }, [editId, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        patientId: Number(data.patientId),
        reportType: data.reportType,
        consultationDate: data.consultationDate,
        cid10Codes: data.cid10Codes.map(c => c.code).filter(Boolean),
        diagnosis: data.diagnosis,
        clinicalPicture: data.clinicalPicture,
        treatment: data.treatment || '',
        medications: data.medications.filter(m => m.name.trim()).map(m => ({
          name: m.name,
          quantity: m.quantity,
          duration: m.duration,
        })),
        conclusion: data.conclusion,
      };

      if (editId) {
        await updateReport(Number(editId), payload);
        toast.success('Laudo atualizado com sucesso!');
        router.push('/reports');
      } else {
        const report = await createReport(payload);
        toast.success('Laudo criado com sucesso!');
        router.push(`/reports?newId=${report.id}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Verifique os dados e tente novamente.');
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Carregando laudo...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editId ? 'Editar Laudo' : 'Novo Laudo Médico'}
          </h1>
          <p className="text-sm text-gray-500">Preencha todas as informações do laudo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ── Identificação ───────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* ── Diagnóstico ─────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Diagnóstico *</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              {...register('diagnosis')}
              placeholder="Portador de cegueira total bilateral congênita..."
              rows={3}
            />
            {errors.diagnosis && (
              <p className="text-xs text-red-500 mt-1">{errors.diagnosis.message}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Quadro Clínico ──────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Quadro Clínico Atual *</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              {...register('clinicalPicture')}
              placeholder="Totalmente dependente dos pais, não se alimenta sozinho..."
              rows={4}
            />
            {errors.clinicalPicture && (
              <p className="text-xs text-red-500 mt-1">{errors.clinicalPicture.message}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Tratamento e Medicamentos ───────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="treatment">Descrição do Tratamento</Label>
              <Textarea
                id="treatment"
                {...register('treatment')}
                placeholder="Iniciou tratamento aos 20 meses. Atualmente em acompanhamento contínuo..."
                rows={3}
              />
            </div>

            {/* Medicamentos dinâmicos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-blue-500" />
                  Medicamentos
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendMed({ name: '', quantity: '', duration: '' })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_auto_32px] gap-2 px-1">
                  <span className="text-xs text-gray-400 font-medium">Nome do medicamento</span>
                  <span className="text-xs text-gray-400 font-medium w-36 text-center">Quantidade / Dosagem</span>
                  <span className="text-xs text-gray-400 font-medium w-32 text-center">Tempo de uso</span>
                  <span />
                </div>

                {medFields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-[1fr_auto_auto_32px] gap-2 items-center">
                    <Input
                      {...register(`medications.${i}.name`)}
                      placeholder="Ex: Neozine gotas 4,0%"
                    />
                    <Input
                      {...register(`medications.${i}.quantity`)}
                      placeholder="Ex: 60 gotas 12/12h"
                      className="w-36"
                    />
                    <Input
                      {...register(`medications.${i}.duration`)}
                      placeholder="Ex: 30 dias"
                      className="w-32"
                    />
                    {medFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMed(i)}
                        className="h-8 w-8"
                      >
                        <X className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    )}
                    {medFields.length === 1 && <div className="w-8" />}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CID-10 ──────────────────────────────────────────── */}
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

        {/* ── Conclusão ───────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Conclusão *</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              {...register('conclusion')}
              placeholder="Diante do quadro, o paciente necessita de benefício permanente, pois não reúne condições para realizar qualquer atividade laboral..."
              rows={4}
            />
            {errors.conclusion && (
              <p className="text-xs text-red-500 mt-1">{errors.conclusion.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-3 pb-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting
              ? (editId ? 'Salvando...' : 'Gerando Laudo...')
              : (editId ? 'Salvar Alterações' : 'Gerar Laudo')}
          </Button>
          <Link href="/reports">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
