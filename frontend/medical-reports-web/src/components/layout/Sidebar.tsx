'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, FileText, Home, Stethoscope, LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, isAdmin, removeToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/reports', label: 'Laudos', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const admin = isAdmin();

  const handleLogout = () => {
    removeToken();
    router.replace('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

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
              isActive(href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}

        {/* Link Usuários — apenas para Admin */}
        {admin && (
          <Link
            href="/users"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive('/users')
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Usuários
          </Link>
        )}
      </nav>

      {/* Rodapé com usuário logado */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        {user && (
          <div className="flex items-center gap-2 px-1">
            <UserCircle className="w-8 h-8 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-400">
                {user.role === 'Admin' ? 'Administrador' : 'Médico'}
                {user.crm ? ` · ${user.crm}` : ''}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
