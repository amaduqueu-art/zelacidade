import { MapPinOff } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        <MapPinOff className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-accent">
        Erro 404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-primary">
        Esta página não foi encontrada
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        O endereço pode estar incompleto ou o conteúdo foi removido. Volte ao
        mural para continuar acompanhando os relatos da cidade.
      </p>
      <Button asChild variant="accent" size="lg" className="mt-6">
        <Link href="/">Voltar ao mural</Link>
      </Button>
    </div>
  );
}
