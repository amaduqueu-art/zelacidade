'use client';

import {
  AlertTriangle,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import {
  CATEGORY_OPTIONS,
  MAX_IMAGE_BYTES,
} from '@/lib/constants';
import { formatFileSize } from '@/lib/format';
import { prepareImage } from '@/lib/image';
import { STORAGE_BUCKET, supabase } from '@/lib/supabase/client';
import type { ReportCategory } from '@/lib/supabase/types';
import {
  buildReportImagePath,
  cn,
  getErrorMessage,
} from '@/lib/utils';

type SubmitStage = 'idle' | 'preparing' | 'uploading' | 'saving';

const STAGE_INFO: Record<
  Exclude<SubmitStage, 'idle'>,
  { label: string; progress: number }
> = {
  preparing: { label: 'Otimizando a foto no seu dispositivo...', progress: 25 },
  uploading: { label: 'Enviando a foto com segurança...', progress: 60 },
  saving: { label: 'Publicando seu relato...', progress: 90 },
};

type FieldErrors = Partial<
  Record<'title' | 'category' | 'description' | 'neighborhood' | 'photo', string>
>;

export function ReportForm() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    error: authError,
    ensureSession,
  } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [neighborhood, setNeighborhood] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<SubmitStage>('idle');

  const titleRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLFieldSetElement>(null);
  const neighborhoodRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photo]);

  function clearError(field: keyof FieldErrors) {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Permite selecionar o mesmo arquivo novamente após remover.
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((previous) => ({
        ...previous,
        photo: 'Selecione um arquivo de imagem (JPG, PNG ou WebP).',
      }));
      toast.error('Arquivo inválido', {
        description: 'Selecione uma imagem em JPG, PNG ou WebP.',
      });
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((previous) => ({
        ...previous,
        photo: 'A foto deve ter no máximo 8 MB.',
      }));
      toast.error('Foto muito grande', {
        description: 'A imagem deve ter no máximo 8 MB.',
      });
      return;
    }

    setPhoto(file);
    clearError('photo');
  }

  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedNeighborhood = neighborhood.trim();

    if (trimmedTitle.length < 5) {
      nextErrors.title = 'Informe um título com pelo menos 5 caracteres.';
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = 'O título deve ter no máximo 120 caracteres.';
    }

    if (!category) {
      nextErrors.category = 'Selecione a categoria do problema.';
    }

    if (trimmedDescription.length < 10) {
      nextErrors.description =
        'Descreva o problema com pelo menos 10 caracteres.';
    } else if (trimmedDescription.length > 1200) {
      nextErrors.description =
        'A descrição deve ter no máximo 1.200 caracteres.';
    }

    if (trimmedNeighborhood.length > 80) {
      nextErrors.neighborhood = 'O bairro deve ter no máximo 80 caracteres.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.title) titleRef.current?.focus();
      else if (nextErrors.category) categoryRef.current?.focus();
      else if (nextErrors.description) descriptionRef.current?.focus();
      else if (nextErrors.neighborhood) neighborhoodRef.current?.focus();
      else if (nextErrors.photo) fileInputRef.current?.focus();

      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);
    setStage('preparing');

    let uploadedPath: string | null = null;

    try {
      const currentUser = user ?? (await ensureSession());

      if (!currentUser) {
        throw new Error(
          authError ??
            'Não foi possível iniciar sua sessão. Recarregue a página e tente novamente.',
        );
      }

      const reportId = crypto.randomUUID();

      if (photo) {
        const prepared = await prepareImage(photo);
        setStage('uploading');

        const path = buildReportImagePath(
          currentUser.id,
          reportId,
          prepared.extension,
        );

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, prepared.blob, {
            contentType: prepared.contentType,
            cacheControl: '31536000',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            'Não foi possível enviar a foto. Verifique sua conexão e tente novamente.',
          );
        }

        uploadedPath = path;
      }

      setStage('saving');

      const { error: insertError } = await supabase.from('reports').insert({
        id: reportId,
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        category: category as ReportCategory,
        neighborhood: neighborhood.trim() || null,
        image_path: uploadedPath,
      });

      if (insertError) throw insertError;

      toast.success('Relato publicado com sucesso!', {
        description:
          'Obrigado por cuidar da sua cidade. Acompanhe o status público da solicitação.',
      });

      router.push(`/relato/?id=${reportId}`);
    } catch (error) {
      if (uploadedPath) {
        try {
          await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
        } catch {
          // Falha ao limpar o arquivo órfão não deve esconder o erro principal.
        }
      }

      let message = getErrorMessage(
        error,
        'Não foi possível publicar o relato. Tente novamente.',
      );

      if (
        message.toLowerCase().includes('row-level security') ||
        message.toLowerCase().includes('row level security')
      ) {
        message =
          'Sua sessão expirou ou não tem permissão para publicar. Recarregue a página e tente novamente.';
      }

      setFormError(message);
      toast.error('Não foi possível publicar o relato', {
        description: message,
      });
      setStage('idle');
    } finally {
      setSubmitting(false);
      setStage('idle');
    }
  }

  const stageInfo = stage === 'idle' ? null : STAGE_INFO[stage];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {!authLoading && authError && !user ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <p>{authError}</p>
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-red-50 p-4 text-sm text-red-950"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p>{formError}</p>
        </div>
      ) : null}

      <fieldset disabled={submitting} className="min-w-0 space-y-6">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="title">
              Título do relato <span className="text-accent">*</span>
            </Label>
            <span
              className={cn(
                'text-xs tabular-nums',
                title.length > 120 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {title.length}/120
            </span>
          </div>
          <Input
            ref={titleRef}
            id="title"
            name="title"
            value={title}
            maxLength={120}
            onChange={(event) => {
              setTitle(event.target.value);
              clearError('title');
            }}
            placeholder="Ex.: Poste apagado na Rua das Acácias"
            autoComplete="off"
            aria-required="true"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : 'title-help'}
            className={cn(errors.title && 'border-destructive')}
          />
          <p id="title-help" className="text-xs text-muted-foreground">
            Seja direto: o que está errado e onde.
          </p>
          {errors.title ? (
            <p id="title-error" className="field-error">
              {errors.title}
            </p>
          ) : null}
        </div>

        <fieldset
          ref={categoryRef}
          tabIndex={-1}
          aria-describedby={errors.category ? 'category-error' : undefined}
          className="min-w-0 space-y-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <legend className="text-sm font-semibold text-foreground">
            Categoria <span className="text-accent">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = category === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    'relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    selected
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-white hover:border-primary/40 hover:bg-secondary/50',
                    submitting && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={selected}
                    onChange={() => {
                      setCategory(option.value);
                      clearError('category');
                    }}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      option.iconClass,
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {option.label}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {option.description}
                  </span>
                  {selected ? (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-accent text-white">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          {errors.category ? (
            <p id="category-error" className="field-error">
              {errors.category}
            </p>
          ) : null}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">
            Bairro{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            ref={neighborhoodRef}
            id="neighborhood"
            name="neighborhood"
            value={neighborhood}
            maxLength={80}
            onChange={(event) => {
              setNeighborhood(event.target.value);
              clearError('neighborhood');
            }}
            placeholder="Ex.: Jardim das Flores"
            autoComplete="address-level3"
            aria-invalid={Boolean(errors.neighborhood)}
            aria-describedby={
              errors.neighborhood ? 'neighborhood-error' : 'neighborhood-help'
            }
            className={cn(errors.neighborhood && 'border-destructive')}
          />
          <p id="neighborhood-help" className="text-xs text-muted-foreground">
            Ajuda a comunidade a localizar o problema. Não informe endereço
            completo ou dados pessoais.
          </p>
          {errors.neighborhood ? (
            <p id="neighborhood-error" className="field-error">
              {errors.neighborhood}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="description">
              Descrição <span className="text-accent">*</span>
            </Label>
            <span
              className={cn(
                'text-xs tabular-nums',
                description.length > 1200
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {description.length}/1200
            </span>
          </div>
          <Textarea
            ref={descriptionRef}
            id="description"
            name="description"
            value={description}
            maxLength={1200}
            rows={5}
            onChange={(event) => {
              setDescription(event.target.value);
              clearError('description');
            }}
            placeholder="Descreva o problema: há quanto tempo existe, como afeta o bairro e se há risco de acidente."
            aria-required="true"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? 'description-error' : 'description-help'
            }
            className={cn(errors.description && 'border-destructive')}
          />
          <p id="description-help" className="text-xs text-muted-foreground">
            Mínimo de 10 caracteres. Não inclua nomes, telefones ou documentos.
          </p>
          {errors.description ? (
            <p id="description-error" className="field-error">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo">
            Foto do problema{' '}
            <span className="font-normal text-muted-foreground">
              (recomendada)
            </span>
          </Label>

          <input
            ref={fileInputRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="sr-only"
            aria-describedby="photo-help photo-error"
          />

          {previewUrl && photo ? (
            <div className="overflow-hidden rounded-xl border bg-secondary">
              <div className="relative aspect-[16/10] w-full">
                <img
                  src={previewUrl}
                  alt="Pré-visualização da foto selecionada"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
                  {photo.name} · {formatFileSize(photo.size)}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus aria-hidden="true" />
                    Trocar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 text-destructive hover:bg-red-50 hover:text-destructive"
                    aria-label="Remover foto selecionada"
                    onClick={() => {
                      setPhoto(null);
                      clearError('photo');
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-secondary/40 px-4 py-8 text-center transition-colors hover:border-accent hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <Camera className="size-6" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold text-foreground">
                Adicionar foto
              </span>
              <span className="text-xs text-muted-foreground">
                Tire uma foto ou escolha da galeria · JPG, PNG ou WebP até 8 MB
              </span>
            </button>
          )}

          <p id="photo-help" className="text-xs text-muted-foreground">
            A imagem é comprimida no seu aparelho antes do envio. Evite rostos,
            placas de veículos e outros dados pessoais.
          </p>
          {errors.photo ? (
            <p id="photo-error" className="field-error">
              {errors.photo}
            </p>
          ) : null}
        </div>

        {stageInfo ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border bg-secondary/70 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Loader2
                className="size-4 animate-spin text-accent"
                aria-hidden="true"
              />
              {stageInfo.label}
            </div>
            <div
              className="mt-2.5 h-2 overflow-hidden rounded-full bg-white"
              role="progressbar"
              aria-label="Progresso do envio"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stageInfo.progress}
            >
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${stageInfo.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Não feche esta página até a publicação terminar.
            </p>
          </div>
        ) : null}

        <div className="space-y-3 border-t pt-5">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {submitting ? 'Publicando relato...' : 'Publicar relato'}
          </Button>

          <p className="flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Seu relato será público. Você recebe uma sessão anônima para
            acompanhar o status e apoiar outras demandas.
          </p>
        </div>
      </fieldset>
    </form>
  );
}

export function ReportFormTips() {
  return (
    <aside className="space-y-4" aria-label="Dicas para um bom relato">
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
          O que ajuda a equipe
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
          <li>• Uma foto nítida, de perto e de longe do problema.</li>
          <li>• O bairro ou um ponto de referência conhecido.</li>
          <li>• Uma descrição objetiva do risco e do tempo do problema.</li>
          <li>• Se possível, informe se há risco imediato a pedestres.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-950">
        <h2 className="text-sm font-bold">Privacidade e segurança</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Não publique nomes, documentos, placas, rostos ou endereços completos.
          O mural é público e qualquer pessoa pode visualizar o relato.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <h2 className="text-sm font-bold">Emergências</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Este canal não substitui serviços de emergência. Ligue 190 (Polícia),
          192 (SAMU) ou 193 (Bombeiros).
        </p>
      </div>
    </aside>
  );
}
