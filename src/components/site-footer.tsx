import { HeartHandshake, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/logo';

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-navy-900 text-white">
      <div className="container flex flex-col gap-8 py-10 pb-28 md:pb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm leading-relaxed text-white/70">
              Uma plataforma comunitária para registrar problemas urbanos,
              priorizar demandas e acompanhar soluções com transparência.
            </p>
          </div>

          <nav aria-label="Links do rodapé" className="text-sm">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              Navegação
            </h2>
            <ul className="space-y-2">
              <li>
                <Link className="text-white/80 hover:text-white" href="/">
                  Mural da cidade
                </Link>
              </li>
              <li>
                <Link className="text-white/80 hover:text-white" href="/relatar/">
                  Relatar um problema
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/80 hover:text-white"
                  href="/meus-relatos/"
                >
                  Meus relatos
                </Link>
              </li>
            </ul>
          </nav>

          <div className="max-w-sm space-y-3 text-sm text-white/70">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              Importante
            </h2>
            <p className="flex gap-2">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-orange-400"
                aria-hidden="true"
              />
              <span>
                Relatos são públicos. Não inclua dados pessoais, documentos ou
                informações sensíveis.
              </span>
            </p>
            <p className="flex gap-2">
              <HeartHandshake
                className="mt-0.5 size-4 shrink-0 text-orange-400"
                aria-hidden="true"
              />
              <span>
                Em emergências, ligue 190 (Polícia), 192 (SAMU) ou 193
                (Bombeiros).
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} ZelaCidade. Feito com cidadania e
            código aberto.
          </p>
          <p>Dados protegidos por Row Level Security no Supabase.</p>
        </div>
      </div>
    </footer>
  );
}
