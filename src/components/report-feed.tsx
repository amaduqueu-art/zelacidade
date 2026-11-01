'use client';

import {
  AlertTriangle,
  ArrowBigUp,
  Clock3,
  Loader2,
  Plus,
  RotateCcw,
  SearchX,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import { ReportCard } from '@/components/report-card';
import { FeedSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  CATEGORY_OPTIONS,
  FEED_PAGE_SIZE,
} from '@/lib/constants';
import { formatNumber } from '@/lib/format';
import {
  fetchReportsPage,
  type FeedSort,
  type ReportListItem,
} from '@/lib/reports';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { ReportCategory } from '@/lib/supabase/types';
import { cn, getErrorMessage } from '@/lib/utils';

type LoadStatus = 'loading' | 'ready' | 'error';

const SORT_OPTIONS: Array<{
  value: FeedSort;
  label: string;
  icon: typeof Clock3;
}> = [
  { value: 'recent', label: 'Recentes', icon: Clock3 },
  { value: 'supported', label: 'Mais apoiados', icon: ArrowBigUp },
];

export function ReportFeed() {
  const { user, loading: authLoading } = useAuth();

  const [sort, setSort] = useState<FeedSort>('recent');
  const [category, setCategory] = useState<ReportCategory | 'all'>('all');
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const requestRef = useRef(0);

  const loadFirstPage = useCallback(async () => {
    if (authLoading) return;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await fetchReportsPage({
        sort,
        category,
        page: 0,
        pageSize: FEED_PAGE_SIZE,
        userId: user?.id,
      });

      if (requestId !== requestRef.current) return;

      setItems(result.items);
      setUpvotedIds(new Set(result.upvotedIds));
      setTotal(result.total);
      setPage(0);
      setStatus('ready');
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setErrorMessage(
        getErrorMessage(error, 'Não foi possível carregar os relatos.'),
      );
      setStatus('error');
    }
  }, [authLoading, category, sort, user?.id]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (loadingMore || status !== 'ready') return;

    const requestId = requestRef.current;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await fetchReportsPage({
        sort,
        category,
        page: nextPage,
        pageSize: FEED_PAGE_SIZE,
        userId: user?.id,
      });

      if (requestId !== requestRef.current) return;

      setItems((previous) => [...previous, ...result.items]);
      setUpvotedIds((previous) => {
        const next = new Set(previous);
        result.upvotedIds.forEach((id) => next.add(id));
        return next;
      });
      setTotal(result.total);
      setPage(nextPage);
    } catch {
      toast.error('Não foi possível carregar mais relatos', {
        description: 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setLoadingMore(false);
    }
  }

  const handleUpvoteChange = useCallback(
    (reportId: string, upvoted: boolean, count: number) => {
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
    },
    [],
  );

  const hasActiveFilters = category !== 'all';
  const hasMore = items.length < total;

  return (
    <section aria-labelledby="mural-titulo" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="mural-titulo"
            className="text-2xl font-extrabold tracking-tight text-primary"
          >
            Mural da cidade
          </h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {status === 'ready'
              ? `${formatNumber(total)} ${
                  total === 1 ? 'relato publicado' : 'relatos publicados'
                }`
              : status === 'error'
                ? 'Não foi possível atualizar o mural'
                : 'Carregando relatos da comunidade...'}
          </p>
        </div>

        <div
          role="group"
          aria-label="Ordenar relatos"
          className="inline-flex self-start rounded-full border bg-secondary p-1 sm:self-auto"
        >
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = sort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setSort(option.value)}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
          className={cn(
            'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            category === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-foreground hover:bg-secondary',
          )}
        >
          Todas
        </button>

        {CATEGORY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = category === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(option.value)}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white text-foreground hover:bg-secondary',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>

      <div aria-busy={status === 'loading'}>
        {status === 'loading' ? <FeedSkeleton /> : null}

        {status === 'error' ? (
          <div className="rounded-2xl border border-destructive/30 bg-white p-6 text-center shadow-card">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-destructive">
              <AlertTriangle className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-base font-bold">
              Não foi possível carregar o mural
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {errorMessage}
              {!isSupabaseConfigured
                ? ' Configure as variáveis do Supabase no arquivo .env.local.'
                : ''}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void loadFirstPage()}
            >
              <RotateCcw aria-hidden="true" />
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {status === 'ready' && items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={
              hasActiveFilters
                ? 'Nenhum relato nesta categoria'
                : 'O mural ainda está vazio'
            }
            description={
              hasActiveFilters
                ? 'Ainda não há problemas registrados nesta categoria. Tente outra categoria ou seja a primeira pessoa a relatar.'
                : 'Seja a primeira pessoa a relatar um problema no seu bairro. Sua contribuição ajuda toda a comunidade.'
            }
            actionLabel={hasActiveFilters ? 'Limpar filtros' : 'Relatar um problema'}
            onAction={
              hasActiveFilters ? () => setCategory('all') : undefined
            }
            actionHref={hasActiveFilters ? undefined : '/relatar/'}
          />
        ) : null}

        {status === 'ready' && items.length > 0 ? (
          <>
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

            <div className="flex flex-col items-center gap-3 pt-4">
              {hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="w-full sm:w-auto"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus aria-hidden="true" />
                  )}
                  {loadingMore ? 'Carregando...' : 'Carregar mais relatos'}
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Você chegou ao fim do mural. Viu algum problema?{' '}
                  <Link
                    href="/relatar/"
                    className="font-bold text-accent hover:underline"
                  >
                    Relate agora
                  </Link>
                  .
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
