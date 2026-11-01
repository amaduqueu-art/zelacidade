import {
  ArrowBigUp,
  CheckCircle2,
  MapPin,
  Plus,
  Send,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Send,
    title: 'Relate',
    description: 'Descreva o problema e anexe uma foto. Leva menos de um minuto.',
  },
  {
    icon: ArrowBigUp,
    title: 'Apoie',
    description: 'Dê visibilidade aos problemas que mais afetam o seu bairro.',
  },
  {
    icon: CheckCircle2,
    title: 'Acompanhe',
    description: 'Veja o status público: aberto, em análise ou resolvido.',
  },
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-navy-900 px-5 py-8 text-white shadow-raised sm:px-8 sm:py-10 md:px-10 md:py-12">
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
      />

      <div className="relative">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
          <MapPin className="size-3.5" aria-hidden="true" />
          Cidadania ativa
        </p>

        <h1 className="text-balance mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Sua cidade,{' '}
          <span className="text-orange-400">cuidada por todos.</span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Relate problemas de iluminação, asfalto, acessibilidade e saneamento.
          Apoie os relatos que mais importam para o seu bairro e acompanhe as
          soluções com transparência.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="accent" size="lg" className="w-full sm:w-auto">
            <Link href="/relatar/">
              <Plus aria-hidden="true" />
              Relatar um problema
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto"
          >
            <Link href="#como-funciona">Como funciona</Link>
          </Button>
        </div>

        <dl className="mt-7 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2 text-white/80">
            <ShieldCheck
              className="size-4 shrink-0 text-orange-400"
              aria-hidden="true"
            />
            <dt className="sr-only">Privacidade</dt>
            <dd>Relato sem cadastro</dd>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <ArrowBigUp
              className="size-4 shrink-0 text-orange-400"
              aria-hidden="true"
            />
            <dt className="sr-only">Participação</dt>
            <dd>Apoio da comunidade</dd>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <CheckCircle2
              className="size-4 shrink-0 text-orange-400"
              aria-hidden="true"
            />
            <dt className="sr-only">Transparência</dt>
            <dd>Status público</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="scroll-mt-24"
    >
      <div className="mb-4">
        <h2
          id="como-funciona-titulo"
          className="text-xl font-extrabold tracking-tight text-primary"
        >
          Como funciona
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Três passos simples para melhorar o seu bairro.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-card"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  <span className="text-accent">{index + 1}.</span> {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
