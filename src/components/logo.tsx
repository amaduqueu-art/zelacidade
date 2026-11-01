import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 64 64"
        className="h-9 w-9 shrink-0 drop-shadow-sm"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="64" height="64" rx="16" fill="#f97316" />
        <path
          d="M32 12c-7.4 0-13.4 5.9-13.4 13.2C18.6 35.6 32 52 32 52s13.4-16.4 13.4-26.8C45.4 17.9 39.4 12 32 12Z"
          fill="#102a47"
        />
        <path
          d="m25.3 25.8 4.6 4.6 9-9"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-white">
          Zela<span className="text-orange-400">Cidade</span>
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
          Zeladoria urbana
        </span>
      </span>
    </span>
  );
}
