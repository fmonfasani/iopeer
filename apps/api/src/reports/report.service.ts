import { Injectable } from '@nestjs/common';
import { PrismaService, Prisma } from '@prisma/client';

type StatusKey = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR' | 'CANCELLED';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  private async countByStatus(status: StatusKey) {
    // Usamos string literal para evitar desajustes de enum entre versiones
    return this.prisma.run.count({ where: { status: status as any } });
  }


  async buildStatusReport() {
    const [pending, running, success, error, cancelled] = await Promise.all([
      this.countByStatus('PENDING'),
      this.countByStatus('RUNNING'),
      this.countByStatus('SUCCESS'),
      this.countByStatus('ERROR'),
      this.countByStatus('CANCELLED'),
    ]);

    const totalRuns = pending + running + success + error + cancelled;

    const latestRuns = await this.prisma.run.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        workflow: { select: { key: true, name: true } },
        error: true,
      },
    });

    const [workflowsActive, schedulesActive] = await Promise.all([
      this.prisma.workflow.count({ where: { isActive: true } }),
      this.prisma.schedule.count({ where: { isActive: true } }),
    ]);

    const topWorkflows = await this.prisma.run.groupBy({
      by: ['workflowId'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 5,
    });

    const workflowsMap = new Map(
      (await this.prisma.workflow.findMany({
        where: { id: { in: topWorkflows.map(t => t.workflowId) } },
        select: { id: true, key: true, name: true },
      })).map(w => [w.id, w]),
    );

    const lines = [
      `*📊 IOpeer — Status Report*`,
      `• Fecha: ${new Date().toLocaleString('es-AR')}`,
      `• Workflows activos: ${workflowsActive}`,
      `• Schedules activos: ${schedulesActive}`,
      `• Runs totales (último snapshot): ${totalRuns}`,
      `  - 🟡 PENDING: ${pending}`,
      `  - 🔵 RUNNING: ${running}`,
      `  - ✅ SUCCESS: ${success}`,
      `  - 🔴 ERROR: ${error}`,
      `  - ⚪ CANCELLED: ${cancelled}`,
      ``,
      `*🏁 Top workflows por cantidad de runs:*`,
      ...topWorkflows.map((t, i) => {
        const wf = workflowsMap.get(t.workflowId);
        const label = wf ? `${wf.key ?? wf.name ?? wf.id}` : t.workflowId;
        return `  ${i + 1}. ${label}: ${t._count._all}`;
      }),
      ``,
      `*🕒 Últimos 10 runs:*`,
      ...latestRuns.map(r => {
        const wfLabel = r.workflow?.key ?? r.workflow?.name ?? 'workflow?';
        const started = r.startedAt ? new Date(r.startedAt).toLocaleString('es-AR') : 'n/a';
        const durMs =
          r.finishedAt && r.startedAt ? Math.max(0, new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) : null;
        const dur = durMs != null ? `${Math.round(durMs / 1000)}s` : 'n/a';
        const err = r.error ? ` — error: ${r.error?.slice(0, 120)}` : '';
        return `  • ${r.id} — ${wfLabel} — ${r.status} — start: ${started} — dur: ${dur}${err}`;
      }),
    ];

    const text = lines.join('\n');
    const html = `
      <h2>📊 IOpeer — Status Report</h2>
      <ul>
        <li><b>Fecha:</b> ${new Date().toLocaleString('es-AR')}</li>
        <li><b>Workflows activos:</b> ${workflowsActive}</li>
        <li><b>Schedules activos:</b> ${schedulesActive}</li>
      </ul>
      <h3>Resumen de Runs</h3>
      <ul>
        <li>PENDING: ${pending}</li>
        <li>RUNNING: ${running}</li>
        <li>SUCCESS: ${success}</li>
        <li>ERROR: ${error}</li>
        <li>CANCELLED: ${cancelled}</li>
      </ul>
      <h3>Top Workflows</h3>
      <ol>
        ${topWorkflows
          .map(t => {
            const wf = workflowsMap.get(t.workflowId);
            const label = wf ? `${wf.key ?? wf.name ?? wf.id}` : t.workflowId;
            return `<li>${label}: ${t._count._all}</li>`;
          })
          .join('')}
      </ol>
      <h3>Últimos 10 runs</h3>
      <ul>
        ${latestRuns
          .map(r => {
            const wfLabel = r.workflow?.key ?? r.workflow?.name ?? 'workflow?';
            const started = r.startedAt ? new Date(r.startedAt).toLocaleString('es-AR') : 'n/a';
            const durMs =
              r.finishedAt && r.startedAt ? Math.max(0, new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) : null;
            const dur = durMs != null ? `${Math.round(durMs / 1000)}s` : 'n/a';
            const err = r.error ? ` — error: ${r.error?.slice(0, 120)}` : '';
            return `<li>${r.id} — ${wfLabel} — ${r.status} — start: ${started} — dur: ${dur}${err}</li>`;
          })
          .join('')}
      </ul>
    `;

    return { text, html, meta: { totals: { pending, running, success, error, cancelled, totalRuns } } };
  }
}
