'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

type SupabaseContextValue = SupabaseClient;

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'public-anon-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function SupabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [client] = useState(() => createClient());
  const value = useMemo(() => client, [client]);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('Supabase client is not available.');
  }
  return client;
}
