import { FEED_PAGE_SIZE } from '@/lib/constants';
import { isSupabaseConfigured, STORAGE_BUCKET, supabase } from '@/lib/supabase/client';
import type {
  Database,
  ReportCategory,
  ReportStatus,
} from '@/lib/supabase/types';

export type Report = Database['public']['Tables']['reports']['Row'];

export type ReportListItem = Report & {
  imageUrl: string | null;
};

export type FeedSort = 'recent' | 'supported';

export interface FetchReportsParams {
  sort: FeedSort;
  category: ReportCategory | 'all';
  page: number;
  pageSize?: number;
  userId?: string | null;
  status?: ReportStatus | 'all';
}

export interface ReportsPageResult {
  items: ReportListItem[];
  total: number;
  upvotedIds: string[];
}

export function getReportImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function toListItem(report: Report): ReportListItem {
  return {
    ...report,
    imageUrl: getReportImageUrl(report.image_path),
  };
}

/**
 * Busca uma página do feed com contagem total e os apoios do usuário atual.
 * Duas consultas simples evitam joins pesados e funcionam bem com RLS.
 */
export async function fetchReportsPage({
  sort,
  category,
  page,
  pageSize = FEED_PAGE_SIZE,
  userId,
  status = 'all',
}: FetchReportsParams): Promise<ReportsPageResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' });

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (sort === 'supported') {
    query = query
      .order('upvotes_count', { ascending: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error('Não foi possível carregar os relatos. Tente novamente.');
  }

  const reports = (data ?? []) as Report[];
  const items = reports.map(toListItem);

  let upvotedIds: string[] = [];
  if (userId && reports.length > 0) {
    const { data: upvotes, error: upvotesError } = await supabase
      .from('upvotes')
      .select('report_id')
      .eq('user_id', userId)
      .in(
        'report_id',
        reports.map((report) => report.id),
      );

    if (!upvotesError && upvotes) {
      upvotedIds = upvotes.map((upvote) => upvote.report_id);
    }
  }

  return {
    items,
    total: count ?? items.length,
    upvotedIds,
  };
}

export async function fetchReportById(
  reportId: string,
  userId?: string | null,
): Promise<{ report: ReportListItem; upvoted: boolean } | null> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    throw new Error('Não foi possível carregar este relato.');
  }

  if (!data) return null;

  let upvoted = false;
  if (userId) {
    const { data: upvote } = await supabase
      .from('upvotes')
      .select('id')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle();

    upvoted = Boolean(upvote);
  }

  return {
    report: toListItem(data as Report),
    upvoted,
  };
}

export async function fetchReportsByUser(
  userId: string,
): Promise<ReportsPageResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  const { data, error, count } = await supabase
    .from('reports')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível carregar seus relatos.');
  }

  const reports = (data ?? []) as Report[];

  let upvotedIds: string[] = [];
  if (reports.length > 0) {
    const { data: upvotes } = await supabase
      .from('upvotes')
      .select('report_id')
      .eq('user_id', userId)
      .in(
        'report_id',
        reports.map((report) => report.id),
      );

    if (upvotes) {
      upvotedIds = upvotes.map((upvote) => upvote.report_id);
    }
  }

  return {
    items: reports.map(toListItem),
    total: count ?? reports.length,
    upvotedIds,
  };
}
