import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { UpvoteButton } from '@/components/upvote-button';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/format';
import type { ReportListItem } from '@/lib/reports';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  report: ReportListItem;
  upvoted: boolean;
  onUpvoteChange?: (reportId: string, upvoted: boolean, count: number) => void;
}

export function ReportCard({ report, upvoted, onUpvoteChange }: ReportCardProps) {
  const category = CATEGORY_MAP[report.category];
  const CategoryIcon = category.icon;
  const detailHref = `/relato/?id=${report.id}`;

  return (
    <article className="group flex h-full animate-fade-in flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-raised">
      <Link
        href={detailHref}
        aria-label={`Ver detalhes do relato: ${report.title}`}
        className="relative block aspect-[16/10] overflow-hidden bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {report.imageUrl ? (
          <img
            src={report.imageUrl}
            alt={`Foto do problema: ${report.title}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br',
              category.gradient,
            )}
          >
            <CategoryIcon
              className="size-12 text-primary/40"
              aria-hidden="true"
            />
          </span>
        )}

        <span className="absolute left-3 top-3">
          <StatusBadge status={report.status} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <span
            className={cn(
              'inline-flex size-6 shrink-0 items-center justify-center rounded-md',
              category.iconClass,
            )}
          >
            <CategoryIcon className="size-3.5" aria-hidden="true" />
          </span>
          <span>{category.label}</span>
          {report.neighborhood ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate normal-case tracking-normal">
                {report.neighborhood}
              </span>
            </>
          ) : null}
        </div>

        <h3 className="text-base font-bold leading-snug text-foreground">
          <Link
            href={detailHref}
            className="rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {report.title}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {report.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <time
            dateTime={report.created_at}
            className="text-xs font-medium text-muted-foreground"
          >
            {formatRelativeTime(report.created_at)}
          </time>

          <UpvoteButton
            reportId={report.id}
            ownerId={report.user_id}
            initialCount={report.upvotes_count}
            initialUpvoted={upvoted}
            onChange={onUpvoteChange}
          />
        </div>

        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
        >
          Ver detalhes e status
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
