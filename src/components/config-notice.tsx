'use client';

import { AlertTriangle } from 'lucide-react';

import { isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Aviso de desenvolvimento: aparece apenas quando as variáveis públicas
 * do Supabase não foram definidas no build.
 */
export function ConfigNotice() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50">
      <div className="container flex items-start gap-3 py-3 text-sm text-amber-950">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <p>
          <strong className="font-semibold">Supabase não configurado.</strong>{' '}
          Crie o arquivo <code className="font-mono">.env.local</code> com{' '}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, depois
          reinicie o servidor. Veja o README.
        </p>
      </div>
    </div>
  );
}
