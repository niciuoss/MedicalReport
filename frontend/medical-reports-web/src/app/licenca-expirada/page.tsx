'use client';

import { ShieldOff } from 'lucide-react';

export default function LicencaExpiradaPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-5 rounded-full">
            <ShieldOff className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Licença Expirada
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          O período de uso deste sistema foi encerrado.
          Entre em contato com o desenvolvedor para renovar sua licença e
          voltar a utilizar o sistema normalmente.
        </p>
      </div>
    </div>
  );
}
