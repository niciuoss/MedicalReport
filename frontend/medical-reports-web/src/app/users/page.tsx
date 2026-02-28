'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit, UserCheck, UserX, X, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getUsers, createUser, updateUser, deleteUser, AppUser } from '@/lib/api';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const createSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role: z.string().min(1, 'Selecione o perfil'),
  fullName: z.string().min(3, 'Nome obrigatório'),
  crm: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!isAdmin()) {
      router.replace('/');
      return;
    }
    loadUsers();
  }, [router]);

  const loadUsers = () => getUsers().then(setUsers);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });

  const openCreate = () => {
    setEditingUser(null);
    reset({ username: '', password: '', role: '', fullName: '', crm: '' });
    setShowForm(true);
  };

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    reset({
      username: user.username,
      password: '',
      role: user.role,
      fullName: user.fullName,
      crm: user.crm ?? '',
    });
    setShowForm(true);
  };

  const onSubmit = async (data: CreateFormData) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          password: data.password || undefined,
          role: data.role,
          fullName: data.fullName,
          crm: data.crm || undefined,
          isActive: editingUser.isActive,
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await createUser({
          username: data.username,
          password: data.password,
          role: data.role,
          fullName: data.fullName,
          crm: data.crm || undefined,
        });
        toast.success('Usuário criado com sucesso!');
      }
      setShowForm(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar usuário.');
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      await updateUser(user.id, {
        role: user.role,
        fullName: user.fullName,
        crm: user.crm ?? undefined,
        isActive: !user.isActive,
      });
      toast.success(user.isActive ? 'Usuário desativado.' : 'Usuário ativado.');
      loadUsers();
    } catch {
      toast.error('Erro ao alterar status do usuário.');
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.username === currentUser?.username) {
      toast.error('Você não pode excluir sua própria conta.');
      return;
    }
    if (!confirm(`Deseja excluir o usuário "${user.fullName}"?`)) return;
    try {
      await deleteUser(user.id);
      toast.success('Usuário excluído.');
      loadUsers();
    } catch {
      toast.error('Erro ao excluir usuário.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            Usuários
          </h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* Formulário de criação/edição */}
      {showForm && (
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    {...register('fullName')}
                    placeholder="Dr. João da Silva"
                    disabled={isSubmitting}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-500">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nome de Usuário *</Label>
                  <Input
                    {...register('username')}
                    placeholder="joao.silva"
                    disabled={isSubmitting || !!editingUser}
                  />
                  {errors.username && (
                    <p className="text-xs text-red-500">{errors.username.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Senha {editingUser ? '(deixe em branco para manter)' : '*'}</Label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Perfil *</Label>
                  <Select
                    defaultValue={editingUser?.role || ''}
                    onValueChange={v => setValue('role', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Doctor">Médico</SelectItem>
                      <SelectItem value="Admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-xs text-red-500">{errors.role.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>CRM (médicos)</Label>
                  <Input
                    {...register('crm')}
                    placeholder="CRM/CE 00000"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabela de usuários */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Perfil</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">CRM</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Criado em</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 text-sm">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-sm text-gray-900">{user.fullName}</td>
                    <td className="p-4 text-sm text-gray-600 font-mono">{user.username}</td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        user.role === 'Admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'Admin' ? 'Admin' : 'Médico'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-mono">{user.crm || '—'}</td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEdit(user)}
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={user.isActive ? 'Desativar' : 'Ativar'}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive
                            ? <UserX className="h-4 w-4 text-orange-400" />
                            : <UserCheck className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          onClick={() => handleDelete(user)}
                          disabled={user.username === currentUser?.username}
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
