import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Algo deu errado. Tente novamente.',
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

export function buildReportImagePath(
  userId: string,
  reportId: string,
  extension: string,
): string {
  const safeExtension = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  return `${userId}/${reportId}/foto-${Date.now()}.${safeExtension}`;
}
