'use client';

import { Info, Plus, SearchX, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ReportCard } from '@/components/report-card';
import { MyReportsSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { formatNumber } from '@/lib/format';
import {
  fetchReportsByUser,
  type ReportListItem,
} from '@/lib/reports';
import { cn, getErrorMessage } from '@/lib/utils';

type PageStatus = 'loading' | 'ready' | 'error';

export function MyReports() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!user) {
      setStatus('ready');
      setItems([]);
      setTotal(0);
      return;
    }

    setStatus('loading');

    fetchReportsByUser(user.id)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setUpvotedIds(new Set(result.upvotedIds));
        setTotal(result.total);
        setStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(
          getErrorMessage(error, 'Não foi possível carregar seus relatos.'),
        );
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const handleUpvoteChange = (
    reportId: string,
    upvoted: boolean,
    count: number,
  ) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === reportId ? { ...item, upvotes_count: count } : item,
      ),
    );
    setUpvotedIds((previous) => {
      const next = new Set(previous);
      if (upvoted) next.add(reportId);
      else next.delete(reportId);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            Meus relatos
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Acompanhe os problemas que você registrou e o apoio que cada um
            recebeu da comunidade.
          </p>
        </div>

        <Button asChild variant="accent" className="self-start sm:self-auto">
          <Link href="/relatar/">
            <Plus aria-hidden="true" />
            Novo relato
          </Link>
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-relaxed text-sky-950">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Sua sessão é anônima e fica salva neste navegador. Se você limpar os
          dados do site ou trocar de dispositivo, não será possível recuperar o
          acesso a estes relatos.
        </p>
      </div>

      {status === 'loading' ? <MyReportsSkeleton /> : null}

      {status === 'error' ? (
        <EmptyState
          icon={ShieldAlert}
          title="Não foi possível carregar seus relatos"
          description={errorMessage ?? 'Tente novamente em instantes.'}
          actionLabel="Recarregar página"
          onAction={() => window.location.reload()}
        />
      ) : null}

      {status === 'ready' && !user ? (
        <EmptyState
          icon={ShieldAlert}
          title="Sessão indisponível"
          description={
            authError ??
            'Não foi possível iniciar sua sessão anônima. Verifique se o login anônimo está habilitado no Supabase.'
          }
          actionLabel="Voltar ao mural"
          actionHref="/"
        />
      ) : null}

      {status === 'ready' && user && items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Você ainda não tem relatos"
          description="Encontrou um problema no seu bairro? Registre agora e acompanhe o status público da solicitação."
          actionLabel="Relatar um problema"
          actionHref="/relatar/"
        />
      ) : null}

      {status === 'ready' && user && items.length > 0 ? (
        <>
          <p
            className={cn(
              'text-sm font-semibold text-muted-foreground',
              'border-b pb-3',
            )}
            aria-live="polite"
          >
            {formatNumber(total)}{' '}
            {total === 1 ? 'relato publicado' : 'relatos publicados'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                upvoted={upvotedIds.has(report.id)}
                onUpvoteChange={handleUpvoteChange}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
