import { STATUS_MAP } from '@/lib/constants';
import type { ReportStatus } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  const config = STATUS_MAP[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
        config.badgeClass,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
