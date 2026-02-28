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
import { toast } from 'sonner';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  phone: z.string().optional(),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  address: z.string().min(3, 'Localidade obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function NewPatientPage() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('edit');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (editId) {
      getPatient(Number(editId)).then(p => {
        setValue('name', p.name);
        setValue('cpf', p.cpf);
        setValue('phone', p.phone ?? '');
        setValue('birthDate', p.birthDate.split('T')[0]);
        setValue('address', p.address);
      });
    }
  }, [editId, setValue]);

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
        await updatePatient(Number(editId), payload);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await createPatient(payload);
        toast.success('Paciente cadastrado com sucesso!');
      }
      router.push('/patients');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Verifique os dados e tente novamente.');
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
              <Input
                id="name"
                {...register('name')}
                placeholder="Francisco Damião da Silva"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
                {errors.birthDate && (
                  <p className="text-xs text-red-500">{errors.birthDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Localidade (Endereço) *</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Tamboril, zona rural de Parambu-CE"
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>
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
