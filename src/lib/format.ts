const relativeTime = new Intl.RelativeTimeFormat('pt-BR', {
  numeric: 'auto',
});

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const longDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(diffInSeconds);

  if (absolute < 60) return 'agora mesmo';
  if (absolute < 60 * 60) return relativeTime.format(Math.round(diffInSeconds / 60), 'minute');
  if (absolute < 60 * 60 * 24) {
    return relativeTime.format(Math.round(diffInSeconds / 3600), 'hour');
  }
  if (absolute < 60 * 60 * 24 * 7) {
    return relativeTime.format(Math.round(diffInSeconds / 86400), 'day');
  }

  return shortDate.format(date);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return shortDate.format(date);
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return longDate.format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
