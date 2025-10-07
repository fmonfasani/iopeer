export function toMarkdownReport(info) {
  return `
# 📊 Reporte técnico — ${info.name}

**Descripción:** ${info.description ?? 'Sin descripción'}

**Repositorio:** ${info.url}  
**Última actualización:** ${new Date(info.updatedAt).toLocaleString()}

## ⭐ Estadísticas
- Estrellas: ${info.stars}
- Forks: ${info.forks}
- Issues abiertos: ${info.issues}
- Pull Requests abiertos: ${info.pulls}

## 💻 Lenguajes principales
${info.languages.map((l) => `- ${l}`).join('\n')}

## 🧩 Últimos commits
${info.commits.map((c) => `- ${c.message} (${new Date(c.date).toLocaleDateString()})`).join('\n')}

---
_Nivel de actividad estimado: ${activityLevel(info)} / 5_
`;
}

function activityLevel(info) {
  const stars = info.stars || 0;
  const issues = info.issues || 0;
  if (stars > 50) return 5;
  if (stars > 20) return 4;
  if (stars > 5) return 3;
  if (issues > 0) return 2;
  return 1;
}
