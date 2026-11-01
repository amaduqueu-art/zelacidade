'use client';

import { ArrowBigUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { formatNumber } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface UpvoteButtonProps {
  reportId: string;
  ownerId: string;
  initialCount: number;
  initialUpvoted: boolean;
  variant?: 'compact' | 'full';
  onChange?: (reportId: string, upvoted: boolean, count: number) => void;
}

export function UpvoteButton({
  reportId,
  ownerId,
  initialCount,
  initialUpvoted,
  variant = 'compact',
  onChange,
}: UpvoteButtonProps) {
  const { user, loading: authLoading, ensureSession } = useAuth();
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setUpvoted(initialUpvoted);
    setCount(initialCount);
  }, [initialUpvoted, initialCount, reportId]);

  const isOwner = user?.id === ownerId;

  async function handleToggle() {
    if (pending || isOwner) return;

    const currentUser = user ?? (await ensureSession());
    if (!currentUser) {
      toast.error('Não foi possível identificar sua sessão', {
        description:
          'Verifique se o login anônimo está habilitado no Supabase e recarregue a página.',
      });
      return;
    }

    if (currentUser.id === ownerId) {
      toast.info('Você não pode apoiar o próprio relato', {
        description: 'Compartilhe com vizinhos para que eles apoiem a demanda.',
      });
      return;
    }

    const nextUpvoted = !upvoted;
    const previousCount = count;
    const nextCount = Math.max(0, previousCount + (nextUpvoted ? 1 : -1));

    setUpvoted(nextUpvoted);
    setCount(nextCount);
    setPending(true);

    try {
      if (nextUpvoted) {
        const { error } = await supabase.from('upvotes').insert({
          report_id: reportId,
          user_id: currentUser.id,
        });

        if (error) {
          if (error.code === '23505') {
            // Já apoiado em outra aba/dispositivo: mantém o estado coerente.
            setUpvoted(true);
            setCount(previousCount);
            onChange?.(reportId, true, previousCount);
            return;
          }
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('upvotes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
      }

      onChange?.(reportId, nextUpvoted, nextCount);
    } catch (error) {
      setUpvoted(!nextUpvoted);
      setCount(previousCount);

      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: string }).code)
          : '';

      toast.error('Não foi possível registrar seu apoio', {
        description:
          code === '42501'
            ? 'Seu apoio não foi autorizado. Recarregue a página e tente novamente.'
            : 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setPending(false);
    }
  }

  const label = upvoted ? 'Remover apoio' : 'Apoiar relato';

  return (
    <Button
      type="button"
      variant={upvoted ? 'accent' : 'outline'}
      size={variant === 'full' ? 'lg' : 'sm'}
      onClick={handleToggle}
      disabled={pending || authLoading || isOwner}
      aria-pressed={upvoted}
      aria-busy={pending}
      title={
        isOwner
          ? 'Você criou este relato e não pode apoiá-lo'
          : `${label} (${formatNumber(count)} ${count === 1 ? 'apoio' : 'apoios'})`
      }
      aria-label={`${label} — ${formatNumber(count)} ${
        count === 1 ? 'apoio' : 'apoios'
      }`}
      className={cn(
        'gap-1.5 font-bold',
        variant === 'full' && 'w-full sm:w-auto',
        upvoted && 'shadow-sm',
      )}
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <ArrowBigUp
          className={cn('size-4', upvoted && 'fill-current')}
          aria-hidden="true"
        />
      )}

      {variant === 'full' ? (
        <span>{upvoted ? 'Apoiado' : 'Apoiar'}</span>
      ) : null}

      <span className="tabular-nums">{formatNumber(count)}</span>
      <span className="sr-only">{count === 1 ? 'apoio' : 'apoios'}</span>

      {isOwner ? <span className="sr-only">(seu relato)</span> : null}
    </Button>
  );
}
