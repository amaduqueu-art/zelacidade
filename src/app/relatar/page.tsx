import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';

import { ReportForm, ReportFormTips } from '@/components/report-form';

export const metadata: Metadata = {
  title: 'Relatar problema',
  description:
    'Registre um problema urbano no seu bairro: iluminação, asfalto, acessibilidade ou saneamento. É rápido, simples e ajuda toda a comunidade.',
};

export default function NewReportPage() {
  return (
    <div className="space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao mural
      </Link>

      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          <ClipboardList className="size-3.5" aria-hidden="true" />
          Novo relato
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          O que precisa de atenção no seu bairro?
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Descreva o problema e, se puder, anexe uma foto. Seu relato fica
          visível para toda a comunidade, que pode apoiar a demanda.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
          <ReportForm />
        </div>
        <ReportFormTips />
      </div>
    </div>
  );
}
