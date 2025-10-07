import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIReporterService } from './openai.reporter.service';

type StatusKey = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR' | 'CANCELLED';

type StatusReportTotals = {
  pending: number;
  running: number;
  success: number;
  error: number;
  cancelled: number;
  totalRuns: number;
};

export type StatusReport = {
  text: string;
  html: string;
  meta: {
    totals: StatusReportTotals;
    aiSummary?: {
      provider: 'openai';
      text: string;
    };
  };
};

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly openaiReporter?: OpenAIReporterService,
  ) {}

  private async countByStatus(status: StatusKey) {
    // Usamos string literal para evitar desajustes de enum entre versiones
    return this.prisma.run.count({ where: { status: status as any } });
  }

  async buildStatusReport(): Promise<StatusReport> {
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
      _count: { workflowId: true },
      orderBy: { _count: { workflowId: 'desc' } },
      take: 5,
    });

    const workflowIds = topWorkflows
      .map((t) => t.workflowId)
      .filter((id): id is string => id != null);

    type WorkflowSummary = { id: string; key: string | null; name: string | null };

    const workflowsMap = new Map<string, WorkflowSummary>(
      (
        await this.prisma.workflow.findMany({
          where: { id: { in: workflowIds } },
          select: { id: true, key: true, name: true },
        })
      ).map((w) => [w.id, w]),
    );

    const topWorkflowDetails = topWorkflows.map((t) => {
      const wf = t.workflowId != null ? workflowsMap.get(t.workflowId) : undefined;
      const label = wf ? `${wf.key ?? wf.name ?? wf.id}` : t.workflowId ?? 'workflow?';
      const count = t._count?.workflowId ?? 0;
      return { label, count };
    });

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
      ...topWorkflowDetails.map((t, i) => `  ${i + 1}. ${t.label}: ${t.count}`),
      ``,
      `*🕒 Últimos 10 runs:*`,
      ...latestRuns.map((r) => {
        const wfLabel = r.workflow?.key ?? r.workflow?.name ?? 'workflow?';
        const started = r.startedAt
          ? new Date(r.startedAt).toLocaleString('es-AR')
          : 'n/a';
        const durMs =
          r.finishedAt && r.startedAt
            ? Math.max(
                0,
                new Date(r.finishedAt).getTime() -
                  new Date(r.startedAt).getTime(),
              )
            : null;
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
        ${topWorkflowDetails
          .map((t) => `<li>${t.label}: ${t.count}</li>`)
          .join('')}
      </ol>
      <h3>Últimos 10 runs</h3>
      <ul>
        ${latestRuns
          .map((r) => {
            const wfLabel = r.workflow?.key ?? r.workflow?.name ?? 'workflow?';
            const started = r.startedAt
              ? new Date(r.startedAt).toLocaleString('es-AR')
              : 'n/a';
            const durMs =
              r.finishedAt && r.startedAt
                ? Math.max(
                    0,
                    new Date(r.finishedAt).getTime() -
                      new Date(r.startedAt).getTime(),
                  )
                : null;
            const dur = durMs != null ? `${Math.round(durMs / 1000)}s` : 'n/a';
            const err = r.error ? ` — error: ${r.error?.slice(0, 120)}` : '';
            return `<li>${r.id} — ${wfLabel} — ${r.status} — start: ${started} — dur: ${dur}${err}</li>`;
          })
          .join('')}
      </ul>
    `;

    return {
      text,
      html,
      meta: {
        totals: { pending, running, success, error, cancelled, totalRuns },
      },
    };
  }

  async generateReport(options: { provider?: 'openai' } = {}): Promise<StatusReport> {
    const report = await this.buildStatusReport();

    if (options.provider !== 'openai') {
      return report;
    }

    if (!this.openaiReporter?.isEnabled()) {
      this.logger.warn(
        'Se solicitó un reporte con IA pero OpenAI no está configurado correctamente (ver variables OPENAI_API_KEY y OPENAI_ASSISTANT_ID).',
      );
      return report;
    }

    try {
      const aiSummary = await this.openaiReporter.generateSummary(report.text);
      const htmlSummary = this.transformSummaryToHtml(aiSummary);

      report.text += `\n\n### 🤖 Análisis IA\n${aiSummary}`;
      report.html += htmlSummary;
      report.meta.aiSummary = {
        provider: 'openai',
        text: aiSummary,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo generar el resumen con OpenAI: ${message}`);
    }

    return report;
  }

  private transformSummaryToHtml(summary: string): string {
    const paragraphs = summary
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `<p>${this.escapeHtml(line)}</p>`);

    if (paragraphs.length === 0) {
      return '';
    }

    return `\n      <h3>🤖 Análisis IA</h3>\n      ${paragraphs.join('\n      ')}\n    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
