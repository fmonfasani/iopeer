# 🧭 IOpeer Progress Log

Este documento registra los avances, pendientes y próximos pasos del desarrollo de IOpeer.
Cada bloque diario incluye tareas, estado y observaciones.

---

## 📅 Día 1 — 5 de Octubre 2025

### ✅ Objetivos del día
- 🔒 **Seguridad:** rotar secretos, limpiar `.env`, crear `.env.example`.
- 📘 **Documentación:** guardar `workflow-flow.md` y mostrarlo en Next.
- 🧩 **Infraestructura:** subir `plan-bootstrap.json` a `apps/api/plans/`.
- 🗄️ **DB:** confirmar modelos `Connection` y `Run`, generar Prisma Client y migraciones.

### 🧠 Pasos ejecutados
```bash
pnpm -C apps/api prisma generate
pnpm -C apps/api prisma migrate dev -n "core_models"
```

### 📂 Estructura final esperada
```
apps/
 ├─ api/
 │   ├─ prisma/
 │   ├─ plans/
 │   │   └─ plan-bootstrap.json
 │   └─ src/
 ├─ web/
 │   └─ app/docs/workflow-flow/page.tsx
docs/
 ├─ workflow-flow.md
 ├─ progress-log.md
```

### 🧾 Resultado
- ✅ Prisma models actualizados.
- ✅ `plan-bootstrap.json` operativo para Scheduler.
- ✅ `workflow-flow.md` visible en `/docs/workflow-flow`.
- ⏳ Pendiente: `RunsService` + `RunsController`.

---

## 📅 Día 2 — (mañana)

### 🎯 Objetivos
- Implementar **API básica de ejecuciones**:
  - `RunsService` (cola en memoria, retries/backoff).
  - `RunsController` (`/runs`, `/runs/:id`, `/runs/test`).
- Integrar **Logging con Pino** + `request-id`.
- Crear **SchedulerService** (lee `plans/plan-bootstrap.json`).
- Crear **GateService** (valida `env`, `db`, dependencias Lx).
- Agregar **steps** básicos (`echo`, `delay`, `http`, `shell`).
- Configurar **Supabase Auth** en el frontend.

### 📦 Entregables esperados
- ✅ Endpoints REST funcionales.
- ✅ Scheduler inicial cargando plan bootstrap.
- ✅ Dashboard mínimo con tabla de runs.

---

## 📅 Día 3–5 — Próxima semana

### 🧱 CI/CD A3
- Configurar pipelines:
  - `deploy.yml`, `promote.yml`, `rollback.yml`, `alerts.yml`, `daily-summary.yml`.
- Alertas Slack (fallos, builds, rollbacks, daily summary).

### 📊 Observabilidad
- Endpoint `/metrics` con p95/p99 y error rate.
- `HealthCheckService` + logging estructurado Pino.

### 🔐 Hardening
- Cifrado de `Connection.secret_ref`.
- Feature flags básicos.
- Ramas protegidas: `main`, `canary`.

---

## 🔍 Resumen general (semana)

| Categoría | Avance | Detalle |
|------------|--------|----------|
| Infraestructura | 🟩 Completo | Supabase, Prisma, Vercel, Slack |
| Backend Core | 🟨 En progreso | RunsService, Scheduler, Gates |
| Frontend | 🟨 En progreso | Auth, dashboard mínimo |
| CI/CD | ⬜ Pendiente | Workflows A3 |
| Observabilidad | ⬜ Pendiente | Metrics, Health |
| Seguridad | 🟩 Completo | Secret rotation, .env cleaned |

---

## 📘 Notas adicionales
- Los archivos `.env` reales deben excluirse del repo (`.gitignore`).
- Mantener este log actualizado al final de cada jornada con:
  - **Qué se hizo.**
  - **Qué falta.**
  - **Qué se detectó como bloqueo o mejora.**

---

## 🧠 Automatización (opcional)
Podés agregar un comando en tu `package.json` para registrar progresos rápido:

```json
{
  "scripts": {
    "log:progress": "echo \"## $(date '+%Y-%m-%d %H:%M') — $(git branch --show-current)\" >> docs/progress-log.md && git add docs/progress-log.md"
  }
}
```

