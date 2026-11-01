import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Indica se as variáveis públicas do Supabase foram fornecidas no build.
 * O static export do Next embute essas variáveis no bundle do browser.
 */
export const isSupabaseConfigured =
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 20;

/**
 * Cliente único do Supabase para o browser.
 * - Persiste a sessão anônima no localStorage.
 * - Renova o token automaticamente.
 * - As permissões reais são aplicadas pelas políticas de RLS no PostgreSQL.
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

export const STORAGE_BUCKET = 'report-images';
