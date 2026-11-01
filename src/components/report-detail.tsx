'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Info,
  MapPin,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ShareButton } from '@/components/share-button';
import { DetailSkeleton } from '@/components/skeletons';
import { StatusBadge } from '@/components/status-badge';
import { UpvoteButton } from '@/components/upvote-button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import {
  CATEGORY_MAP,
  STATUS_MAP,
  STATUS_ORDER,
} from '@/lib/constants';
import { formatDateTime, formatNumber } from '@/lib/format';
import { fetchReportById, type ReportListItem } from '@/lib/reports';
import type { ReportStatus } from '@/lib/supabase/types';
import { cn, getErrorMessage } from '@/lib/utils';

interface DetailData {
  report: ReportListItem;
  upvoted: boolean;
}

type DetailStatus = 'loading' | 'ready' | 'notfound' | 'error';

function StatusTimeline({ status }: { status: ReportStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <ol className="mt-5">
      {STATUS_ORDER.map((value, index) => {
        const config = STATUS_MAP[value];
        const reached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STATUS_ORDER.length - 1;

        return (
          <li
            key={value}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn('relative flex gap-3', !isLast && 'pb-7')}
          >
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-0.5',
                  index < currentIndex ? 'bg-emerald-500' : 'bg-border',
                )}
              />
            ) : null}

            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                reached
                  ? 'border-emerald-600 bg-emerald-100 text-emerald-900'
                  : 'border-border bg-secondary text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {reached ? <Check className="size-4" /> : index + 1}
            </span>

            <div className="pt-0.5">
              <p
                className={cn(
                  'flex flex-wrap items-center gap-2 text-sm font-bold',
                  reached ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {config.label}
                {isCurrent ? (
                  <Badge variant="default" className="px-2 py-0 text-[10px] uppercase tracking-wide">
                    Atual
                  </Badge>
                ) : null}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {config.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ReportDetail() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<DetailStatus>('loading');
  const [data, setData] = useState<DetailData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!reportId) {
      setStatus('notfound');
      setData(null);
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    fetchReportById(reportId, user?.id)
      .then((result) => {
        if (!active) return;
        if (!result) {
          setStatus('notfound');
          setData(null);
          return;
        }
        setData(result);
        setStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(
          getErrorMessage(error, 'Não foi possível carregar este relato.'),
        );
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [authLoading, reportId, user?.id]);

  if (status === 'loading') {
    return <DetailSkeleton />;
  }

  if (status === 'notfound') {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao mural
        </Link>
        <div className="mt-5">
          <EmptyState
            icon={SearchX}
            title="Relato não encontrado"
            description={
              reportId
                ? 'Este relato pode ter sido removido pelo autor ou o link está incompleto.'
                : 'Abra um relato a partir do mural para ver os detalhes e o status público.'
            }
            actionLabel="Ir para o mural"
            actionHref="/"
          />
        </div>
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao mural
        </Link>
        <div className="mt-5">
          <EmptyState
            icon={AlertTriangle}
            title="Não foi possível carregar o relato"
            description={errorMessage ?? 'Tente novamente em instantes.'}
            actionLabel="Tentar novamente"
            onAction={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const { report, upvoted } = data;
  const category = CATEGORY_MAP[report.category];
  const CategoryIcon = category.icon;
  const isOwner = user?.id === report.user_id;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao mural
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="relative aspect-[16/9] max-h-[420px] w-full overflow-hidden bg-secondary">
          {report.imageUrl ? (
            <img
              src={report.imageUrl}
              alt={`Foto do problema: ${report.title}`}
              className="h-full w-full object-cover"
              decoding="async"
            />
          ) : (
            <span
              className={cn(
                'flex h-full w-full items-center justify-center bg-gradient-to-br',
                category.gradient,
              )}
            >
              <CategoryIcon
                className="size-16 text-primary/40"
                aria-hidden="true"
              />
            </span>
          )}
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
              <CategoryIcon className="size-3.5" aria-hidden="true" />
              {category.label}
            </span>
            {isOwner ? (
              <Badge variant="outline" className="text-muted-foreground">
                Seu relato
              </Badge>
            ) : null}
          </div>

          <div>
            <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-primary sm:text-3xl">
              {report.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {report.neighborhood || 'Bairro não informado'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                <time dateTime={report.created_at}>
                  {formatDateTime(report.created_at)}
                </time>
              </span>
            </div>
          </div>

          <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
            {report.description}
          </p>

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
            <UpvoteButton
              reportId={report.id}
              ownerId={report.user_id}
              initialCount={report.upvotes_count}
              initialUpvoted={upvoted}
              variant="full"
            />
            <ShareButton reportId={report.id} title={report.title} />
            <p className="text-xs leading-relaxed text-muted-foreground sm:ml-auto sm:max-w-[180px] sm:text-right">
              {formatNumber(report.upvotes_count)}{' '}
              {report.upvotes_count === 1 ? 'pessoa apoia' : 'pessoas apoiam'} esta
              demanda.
            </p>
          </div>
        </div>
      </article>

      <section
        aria-labelledby="status-titulo"
        className="mt-5 rounded-2xl border bg-card p-5 shadow-card sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="status-titulo"
              className="text-lg font-bold tracking-tight text-foreground"
            >
              Status público
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe o andamento deste relato. As atualizações são feitas pela
              equipe responsável.
            </p>
          </div>
        </div>

        <StatusTimeline status={report.status} />
      </section>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Este é um canal comunitário de zeladoria urbana. Em situações de
          emergência, ligue 190 (Polícia), 192 (SAMU) ou 193 (Bombeiros). Não
          publique dados pessoais ou informações sensíveis.
        </p>
      </div>
    </div>
  );
}
