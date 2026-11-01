'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  reportId: string;
  title: string;
}

export function ShareButton({ reportId, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/relato/?id=${reportId}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `ZelaCidade — ${title}`,
          text: 'Veja este relato e apoie essa demanda do bairro:',
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado!', {
        description: 'Compartilhe com vizinhos para aumentar o apoio ao relato.',
      });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar o link', {
        description: 'Copie o endereço diretamente da barra do navegador.',
      });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleShare}
      className="w-full gap-2 sm:w-auto"
    >
      {copied ? (
        <Check className="text-emerald-700" aria-hidden="true" />
      ) : (
        <Share2 aria-hidden="true" />
      )}
      {copied ? 'Link copiado' : 'Compartilhar'}
    </Button>
  );
}
