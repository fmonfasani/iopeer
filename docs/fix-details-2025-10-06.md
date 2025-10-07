# 📌 Detalle técnico de fixes Prisma (06/10/2025)

Este documento resume los fixes aplicados en la API de IOpeer para estabilizar los flujos de `RunsService` y `SchedulerService` tras detectar errores de Prisma en ambientes donde el schema aún no expone las columnas `log` y `errorMessage`.

## 1. Recuperar runs cuando falta la columna `errorMessage`

### Contexto y síntoma
- Al ejecutar `RunsService` en bases restauradas desde backups antiguos, Prisma lanzaba `PrismaClientValidationError: Unknown argument "errorMessage"` cuando el schema no tenía la columna nueva `Run.errorMessage`.
- El pipeline quedaba atascado porque el update abortaba antes de persistir `status`, `meta` o `log`.

### Cambios implementados
- Se agregó un flag interno `errorMessageColumnAvailable` para detectar en runtime si la columna existe y evitar reintentos infinitos.【F:apps/api/src/runs/runs.service.ts†L69-L72】【F:apps/api/src/runs/runs.service.ts†L358-L409】
- `performRunUpdate` ahora reintenta automáticamente sin enviar `errorMessage` cuando detecta el error (`PrismaClientValidationError`) y hace fallback serializando `log` dentro de `meta` si también falta la columna `log`.【F:apps/api/src/runs/runs.service.ts†L372-L420】【F:apps/api/src/runs/runs.service.ts†L430-L463】
- `applyErrorMessageCompatibility` sincroniza los campos `error`/`errorMessage` para que los clientes sigan recibiendo el mensaje aun cuando la columna no exista.【F:apps/api/src/runs/runs.service.ts†L512-L523】
- `hydrateRun` normaliza la respuesta devolviendo siempre `errorMessage`, reutilizando `error` como fallback cuando sea necesario.【F:apps/api/src/runs/runs.service.ts†L442-L475】

### Pruebas
- `apps/api/test/runs.service.spec.ts` cubre el caso de error y verifica que `errorMessage` siga presente en la respuesta del servicio.【F:apps/api/test/runs.service.spec.ts†L72-L80】

### Impacto
- Los pipelines existentes siguen funcionando aunque la migración de `errorMessage` no se haya corrido todavía.
- La métrica de errores y los retrys continúan operativos porque el flag evita que Prisma bloquee la ejecución.

## 2. Scheduler resiliente ante `Run.errorMessage` inexistente

### Contexto y síntoma
- `SchedulerService.getSucceededRuns()` hacía `SELECT *` sobre `run`. En bases antiguas fallaba porque `errorMessage` no existía, dejando el scheduler sin poder evaluar dependencias.

### Cambios implementados
- Se introduce un flag similar (`errorMessageColumnAvailable`) que cae a un `select` explícito sin la columna problemática cuando Prisma responde con `P2022` (`column does not exist`).【F:apps/api/src/scheduler/scheduler.service.ts†L43-L47】【F:apps/api/src/scheduler/scheduler.service.ts†L96-L116】【F:apps/api/src/scheduler/scheduler.service.ts†L239-L266】
- `ensureErrorMessage()` mantiene el contrato del dominio garantizando el campo a partir de `run.error` cuando la columna no existe.【F:apps/api/src/scheduler/scheduler.service.ts†L268-L276】
- Nueva prueba unitaria confirma el retry con `select` reducido y que los runs devueltos conservan `errorMessage`.【F:apps/api/test/unit/scheduler/scheduler.service.spec.ts†L52-L133】

### Impacto
- El scheduler puede seguir consultando runs exitosos y resolviendo dependencias sin exigir la migración inmediata.
- Evita que la automatización de reportes y gates quede detenida por bases desactualizadas.

## 3. Generar Prisma Client antes de levantar NestJS

### Contexto
- En entornos donde se hace `pnpm start` sobre un checkout limpio (por ejemplo, despliegues CI o nuevas máquinas), `@prisma/client` no existía aún, provocando fallos en tiempo de arranque.

### Cambios implementados
- Se añadieron scripts `prestart`, `prestart:dev`, `prestart:debug` y `prestart:prod` para ejecutar `prisma generate` automáticamente antes de cualquier comando `start`.【F:apps/api/package.json†L9-L20】
- Esto asegura que el cliente Prisma y los tipos estén disponibles en todos los modos de ejecución sin pasos manuales.

### Impacto
- El arranque local y en CI es determinístico incluso tras reinstalar dependencias o limpiar `node_modules`.
- Reduce el riesgo de errores `Cannot find module '@prisma/client'` en pipelines automatizados.

---

### Próximos pasos sugeridos
1. Documentar en la checklist de migraciones que `errorMessage` debe agregarse cuando se actualicen los esquemas productivos.
2. Añadir métricas Prometheus/OTEL que detecten si los flags de compatibilidad siguen activos (para saber cuándo limpiar el fallback).
3. Programar una migración que normalice los datos históricos moviendo `meta.__log` nuevamente a la columna `log` una vez establecida.
