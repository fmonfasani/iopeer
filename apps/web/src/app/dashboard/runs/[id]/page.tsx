import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RunResponse = {
  id: string;
  workflowId: string;
  status: string;
  log?: {
    meta?: Record<string, unknown>;
    attempts?: number;
    maxAttempts?: number;
    nextAttemptAt?: string | null;
    error?: string;
    stepLogs?: StepLog[];
  };
  startedAt: string | null;
  finishedAt: string | null;
};

type StepLog = {
  id: string;
  type: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: 'OK' | 'ERROR';
  output?: unknown;
  error?: string;
};

export default async function RunDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const response = await fetch(`${API_BASE}/runs/${params.id}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Error al obtener el run ${params.id}`);
  }

  const run = (await response.json()) as RunResponse;
  const stepLogs = Array.isArray(run.log?.stepLogs) ? run.log?.stepLogs ?? [] : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-blue-600">
        ← Volver al dashboard
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Run {run.id}</h1>
        <p className="text-sm text-gray-500">
          Workflow {run.workflowId} — Estado {run.status}
        </p>
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-500">Intentos</dt>
            <dd>
              {run.log?.attempts ?? 0} / {run.log?.maxAttempts ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Próximo intento</dt>
            <dd>{formatDate(run.log?.nextAttemptAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Inicio</dt>
            <dd>{formatDate(run.startedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Fin</dt>
            <dd>{formatDate(run.finishedAt)}</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Metadatos</h2>
        <pre className="overflow-x-auto rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          {JSON.stringify(run.log?.meta ?? {}, null, 2)}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Step Logs</h2>
        {stepLogs.length === 0 ? (
          <p className="text-sm text-gray-500">Sin registros de pasos todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nodo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Inicio
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Fin
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Duración (ms)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Output / Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {stepLogs.map((log) => (
                  <tr key={`${log.id}-${log.startedAt}`} className="align-top">
                    <td className="px-4 py-2 text-sm font-medium text-gray-700">{log.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.status}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{formatDate(log.startedAt)}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{formatDate(log.finishedAt)}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.durationMs ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {log.status === 'OK' ? (
                        <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-2">
                          {formatOutput(log.output)}
                        </pre>
                      ) : (
                        <span className="text-red-600">{log.error ?? 'Error desconocido'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {run.log?.error && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-red-600">Último error</h2>
          <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {run.log.error}
          </p>
        </section>
      )}
    </main>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatOutput(value: unknown) {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}
