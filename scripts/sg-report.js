// scripts/sg-report.js
import 'dotenv/config';
import fetch from 'node-fetch';

const SG_ENDPOINT = process.env.SG_ENDPOINT || 'https://sourcegraph.com/.api/graphql';
const SG_TOKEN = process.env.SG_TOKEN || '';
const SG_REPO = process.env.SG_REPO; // "github.com/owner/repo"
const DAYS_COMMITS = parseInt(process.env.SG_DAYS_COMMITS || '7', 10);
const DAYS_DIFFS = parseInt(process.env.SG_DAYS_DIFFS || '30', 10);
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

if (!SG_REPO) {
  console.error('❌ Falta SG_REPO (github.com/owner/repo) en .env');
  process.exit(1);
}

// Util: llamada GraphQL
async function sgGraphQL(query, variables = {}) {
  const res = await fetch(SG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SG_TOKEN ? { Authorization: `token ${SG_TOKEN}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Sourcegraph HTTP ${res.status} - ${res.statusText}\n${t}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error('Sourcegraph GraphQL errors:\n' + JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

// Q1: info básica del repo (nombre y default branch)
const Q_REPO_INFO = `
query RepoInfo($name: String!) {
  repository(name: $name) {
    name
    defaultBranch { displayName }
    url
  }
}
`;

// Q2: commits recientes (últimos N días) - Search V3 con type:commit
const Q_RECENT_COMMITS = `
query RecentCommits($query: String!) {
  search(version: V3, query: $query) {
    results {
      matchCount
      results {
        __typename
        ... on CommitSearchResult {
          commit {
            oid
            subject
            message
            author { person { displayName email } date }
            committer { person { displayName email } date }
            url
          }
        }
      }
    }
  }
}
`;

// Q3: diffs recientes (últimos N días) - para “archivos más cambiados”
const Q_RECENT_DIFFS = `
query RecentDiffs($query: String!) {
  search(version: V3, query: $query) {
    results {
      matchCount
      results {
        __typename
        ... on DiffSearchResult {
          file { path }
          hunks { __typename } # no necesitamos el contenido, solo contar
        }
      }
    }
  }
}
`;

// Q4: top files por búsqueda simple (p. ej. package.json, schema.prisma, docker, etc.)
const Q_TOP_FILES = `
query TopFiles($query: String!) {
  search(version: V3, query: $query) {
    results {
      matchCount
      results {
        __typename
        ... on FileMatch {
          file { path }
          repository { name }
          limitHit
          lineMatches { preview }
        }
      }
    }
  }
}
`;

function daysAgo(d) {
  const now = new Date();
  now.setDate(now.getDate() - d);
  // formato ISO corto
  return now.toISOString().split('T')[0];
}

function groupByPrefix(paths, prefixCount = 2) {
  // Agrupa por primeros N segmentos (ej: apps/api, apps/web)
  const map = new Map();
  for (const p of paths) {
    const parts = p.split('/');
    const key = parts.slice(0, prefixCount).join('/');
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

async function main() {
  const repoInfo = await sgGraphQL(Q_REPO_INFO, { name: SG_REPO });
  const repo = repoInfo?.repository;
  if (!repo) {
    throw new Error(`No se encontró el repo ${SG_REPO} en Sourcegraph`);
  }

  // Commits últimos X días
  const sinceCommits = daysAgo(DAYS_COMMITS);
  const qCommits = `repo:${SG_REPO} type:commit after:${sinceCommits}`;
  const commitsData = await sgGraphQL(Q_RECENT_COMMITS, { query: qCommits });
  const commitResults = commitsData?.search?.results?.results || [];
  const commits = commitResults
    .filter(r => r.__typename === 'CommitSearchResult')
    .map(r => r.commit);

  // Diffs últimos Y días (para paths más cambiados)
  const sinceDiffs = daysAgo(DAYS_DIFFS);
  const qDiffs = `repo:${SG_REPO} type:diff after:${sinceDiffs}`;
  const diffsData = await sgGraphQL(Q_RECENT_DIFFS, { query: qDiffs });
  const diffResults = diffsData?.search?.results?.results || [];
  const changedPaths = diffResults
    .filter(r => r.__typename === 'DiffSearchResult' && r.file?.path)
    .map(r => r.file.path);

  // “Top áreas” (apps/api, apps/web, etc.)
  const topAreas = groupByPrefix(changedPaths, 2).slice(0, 10);

  // Conteo por autor (commits)
  const byAuthor = new Map();
  for (const c of commits) {
    const who = c.author?.person?.displayName || c.author?.person?.email || 'Unknown';
    byAuthor.set(who, (byAuthor.get(who) || 0) + 1);
  }
  const topAuthors = [...byAuthor.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top archivos interesantes (ejemplos: Prisma, Docker, CI)
  const interestingQueries = [
    { label: 'Prisma schema', q: `repo:${SG_REPO} file:prisma patterntype:literal schema.prisma` },
    { label: 'Seeds', q: `repo:${SG_REPO} patterntype:literal seed.ts` },
    { label: 'Docker', q: `repo:${SG_REPO} file:Dockerfile OR file:docker-compose.yml` },
    { label: 'CI/CD', q: `repo:${SG_REPO} file:.github/workflows/` },
    { label: 'Env samples', q: `repo:${SG_REPO} file:.env* OR file:env.example` },
  ];

  const spot = [];
  for (const item of interestingQueries) {
    const data = await sgGraphQL(Q_TOP_FILES, { query: item.q });
    const hits = data?.search?.results?.results || [];
    const paths = hits
      .filter(h => h.__typename === 'FileMatch' && h.file?.path)
      .map(h => h.file.path);
    if (paths.length) {
      spot.push({ label: item.label, count: paths.length, paths: paths.slice(0, 10) });
    }
  }

  // Markdown final
  const md = [
    `# 📊 IOpeer — Reporte del Repositorio`,
    ``,
    `**Repo:** [${repo.name}](${repo.url})`,
    `**Branch por defecto:** ${repo.defaultBranch?.displayName || 'main'}`,
    `**Generado:** ${new Date().toLocaleString('es-AR')}`,
    ``,
    `## 1) Commits últimos ${DAYS_COMMITS} días`,
    `Total: **${commits.length}**`,
    ``,
    ...commits.slice(0, 10).map(c => {
      const date = c.author?.date ? new Date(c.author.date).toLocaleString('es-AR') : 'n/a';
      const who = c.author?.person?.displayName || c.author?.person?.email || 'Unknown';
      return `- ${date} — **${(c.subject || '').slice(0, 80)}** — _${who}_`;
    }),
    ``,
    `## 2) Áreas con más cambios (últimos ${DAYS_DIFFS} días)`,
    ...(topAreas.length ? topAreas.map(([area, count], i) => `${i + 1}. \`${area}\` — ${count} cambios`) : ['_(sin datos)_']),
    ``,
    `## 3) Top contribuidores (por commits)`,
    ...(topAuthors.length ? topAuthors.map(([auth, n], i) => `${i + 1}. **${auth}** — ${n}`) : ['_(sin datos)_']),
    ``,
    `## 4) Archivos/Carpetas clave detectados`,
    ...(spot.length
      ? spot.map(s => `- **${s.label}**: ${s.count} hallazgos\n  ${s.paths.map(p => `- \`${p}\``).join('\n  ')}`)
      : ['_(sin hallazgos relevantes)_']),
    ``,
    `> Fuente: Sourcegraph Cloud (GraphQL Search V3).`,
  ].join('\n');

  // Enviar a Slack si está configurado
  if (SLACK_WEBHOOK_URL) {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: md }),
    });
    if (!res.ok) {
      const tx = await res.text().catch(() => '');
      console.error('⚠️ Error enviando a Slack:', res.status, res.statusText, tx);
    } else {
      console.log('✅ Reporte enviado a Slack');
    }
  }

  console.log('\n---- Markdown ----\n');
  console.log(md);
}

main().catch(err => {
  console.error('❌ Error generando reporte:', err?.message || err);
  process.exit(1);
});
