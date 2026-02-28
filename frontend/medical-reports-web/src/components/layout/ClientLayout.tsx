'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Sonner } from '@/components/ui/sonner';
import { getToken } from '@/lib/auth';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token && !isLoginPage) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [pathname, isLoginPage, router]);

  // Mostra a página de login sem verificação de estado
  if (isLoginPage) {
    return (
      <>
        {children}
        <Sonner />
      </>
    );
  }

  // Aguarda verificação de autenticação
  if (!ready) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 ml-64 min-h-screen">
        {children}
      </main>
      <Sonner />
    </div>
  );
}
