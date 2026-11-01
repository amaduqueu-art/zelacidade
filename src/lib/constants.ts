import {
  Accessibility,
  CheckCircle2,
  Clock3,
  Construction,
  Droplets,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

import type { ReportCategory, ReportStatus } from '@/lib/supabase/types';

export interface CategoryOption {
  value: ReportCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Classes de fundo/texto do ícone (contraste AA). */
  iconClass: string;
  /** Gradiente usado quando o relato não tem foto. */
  gradient: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: 'iluminacao',
    label: 'Iluminação',
    description: 'Postes apagados, lâmpadas queimadas, fiação exposta.',
    icon: Lightbulb,
    iconClass: 'bg-amber-100 text-amber-950',
    gradient: 'from-amber-100 via-amber-50 to-white',
  },
  {
    value: 'asfalto',
    label: 'Asfalto',
    description: 'Buracos, crateras, calçadas quebradas e afundamentos.',
    icon: Construction,
    iconClass: 'bg-slate-200 text-slate-900',
    gradient: 'from-slate-200 via-slate-100 to-white',
  },
  {
    value: 'acessibilidade',
    label: 'Acessibilidade',
    description: 'Rampas ausentes, obstáculos e falta de sinalização.',
    icon: Accessibility,
    iconClass: 'bg-sky-100 text-sky-950',
    gradient: 'from-sky-100 via-sky-50 to-white',
  },
  {
    value: 'saneamento',
    label: 'Saneamento',
    description: 'Vazamentos, esgoto a céu aberto e bueiros entupidos.',
    icon: Droplets,
    iconClass: 'bg-teal-100 text-teal-950',
    gradient: 'from-teal-100 via-teal-50 to-white',
  },
];

export const CATEGORY_MAP: Record<ReportCategory, CategoryOption> =
  CATEGORY_OPTIONS.reduce(
    (acc, option) => {
      acc[option.value] = option;
      return acc;
    },
    {} as Record<ReportCategory, CategoryOption>,
  );

export interface StatusOption {
  value: ReportStatus;
  label: string;
  description: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'aberto',
    label: 'Aberto',
    description: 'Relato recebido e aguardando triagem da equipe responsável.',
    icon: Clock3,
    badgeClass: 'border-amber-300 bg-amber-100 text-amber-950',
    dotClass: 'bg-amber-500',
  },
  {
    value: 'em_analise',
    label: 'Em análise',
    description: 'A equipe responsável está avaliando o problema relatado.',
    icon: Clock3,
    badgeClass: 'border-sky-300 bg-sky-100 text-sky-950',
    dotClass: 'bg-sky-500',
  },
  {
    value: 'resolvido',
    label: 'Resolvido',
    description: 'O problema foi solucionado. Obrigado por acompanhar!',
    icon: CheckCircle2,
    badgeClass: 'border-emerald-300 bg-emerald-100 text-emerald-950',
    dotClass: 'bg-emerald-500',
  },
];

export const STATUS_MAP: Record<ReportStatus, StatusOption> =
  STATUS_OPTIONS.reduce(
    (acc, option) => {
      acc[option.value] = option;
      return acc;
    },
    {} as Record<ReportStatus, StatusOption>,
  );

export const STATUS_ORDER: ReportStatus[] = [
  'aberto',
  'em_analise',
  'resolvido',
];

export const FEED_PAGE_SIZE = 9;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_IMAGE_DIMENSION = 1600;

export const APP_NAME = 'ZelaCidade';
export const APP_TAGLINE = 'Sua cidade, cuidada por todos.';
