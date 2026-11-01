'use client';

import type { User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  /** Garante uma sessão (anônima, se necessário) antes de escrever no banco. */
  ensureSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_UNAVAILABLE_MESSAGE =
  'Não foi possível iniciar uma sessão. Verifique se o login anônimo está habilitado no Supabase (Authentication > Providers > Anonymous).';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingSession = useRef<Promise<User | null> | null>(null);

  const createAnonymousSession = useCallback(async (): Promise<User | null> => {
    if (!isSupabaseConfigured) {
      setError(
        'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return null;
    }

    if (pendingSession.current) return pendingSession.current;

    const request = (async () => {
      const { data, error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError) {
        setError(AUTH_UNAVAILABLE_MESSAGE);
        return null;
      }

      const sessionUser = data.user ?? data.session?.user ?? null;
      if (sessionUser) {
        setUser(sessionUser);
        setError(null);
      }
      return sessionUser;
    })();

    pendingSession.current = request;

    try {
      return await request;
    } finally {
      pendingSession.current = null;
    }
  }, []);

  const ensureSession = useCallback(async (): Promise<User | null> => {
    if (user) return user;

    if (!isSupabaseConfigured) {
      setError(
        'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return null;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setUser(data.session.user);
      return data.session.user;
    }

    return createAnonymousSession();
  }, [createAnonymousSession, user]);

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      setError(
        'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;

        if (data.session?.user) {
          setUser(data.session.user);
          setLoading(false);
          return;
        }

        void createAnonymousSession().finally(() => {
          if (active) setLoading(false);
        });
      })
      .catch(() => {
        if (!active) return;
        setError(AUTH_UNAVAILABLE_MESSAGE);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [createAnonymousSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      ensureSession,
    }),
    [user, loading, error, ensureSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return context;
}
