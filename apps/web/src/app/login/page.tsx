'use client';

import { FormEvent, useState } from 'react';
import { useSupabase } from '../supabase-provider';

export default function LoginPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const redirectTo =
      process.env.NEXT_PUBLIC_SUPABASE_REDIRECT ?? 'http://localhost:3000/dashboard';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('sent');
    setMessage('Revisá tu email para el Magic Link.');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-gray-500">
          Usamos Magic Links de Supabase. Configurá las variables NEXT_PUBLIC_SUPABASE_URL y
          NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno local.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border border-gray-300 p-2"
            placeholder="usuario@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {status === 'loading' ? 'Enviando…' : 'Enviar Magic Link'}
        </button>
      </form>
      {message && (
        <p className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-emerald-600'}>
          {message}
        </p>
      )}
    </main>
  );
}
