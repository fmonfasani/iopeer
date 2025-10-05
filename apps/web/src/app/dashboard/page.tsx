'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Run = {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export default function DashboardPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/runs`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const data: Run[] = await response.json();
      setRuns(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar la lista de runs');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadRuns();
    const interval = setInterval(loadRuns, 5_000);
    return () => clearInterval(interval);
  }, [loadRuns]);

  const hasRuns = runs.length > 0;

  const content = useMemo(() => {
    if (loading && !hasRuns) {
      return <p className="text-sm text-gray-500">Cargando runs…</p>;
    }

    if (error && !hasRuns) {
      return <p className="text-sm text-red-600">{error}</p>;
    }

    if (!hasRuns) {
      return <p className="text-sm text-gray-500">No hay runs recientes.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Run ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Workflow
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Inicio
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-blue-600">
                  <Link href={`/dashboard/runs/${run.id}`}>{run.id}</Link>
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">{run.workflowId}</td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  <StatusPill status={run.status} />
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">{formatDate(run.startedAt)}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{formatDate(run.finishedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [error, hasRuns, loading, runs]);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Dashboard de Runs</h1>
        <p className="text-sm text-gray-500">
          Polling cada 5 segundos desde {apiBase}/runs. Ajustá NEXT_PUBLIC_API_URL para ambientes
          remotos.
        </p>
        {error && hasRuns && (
          <p className="text-sm text-red-600">Último error de polling: {error}</p>
        )}
      </header>
      {content}
    </main>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function StatusPill({ status }: { status: string }) {
  const normalized = status?.toUpperCase?.() ?? '';
  const color = getStatusColor(normalized);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {normalized || '—'}
    </span>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'SUCCEEDED':
      return 'bg-emerald-100 text-emerald-700';
    case 'RUNNING':
      return 'bg-blue-100 text-blue-700';
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    case 'QUEUED':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
