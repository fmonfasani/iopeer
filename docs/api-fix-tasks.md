# Tasks para corregir issues en apps/api

## Prioridad alta
- [ ] Actualizar `AppController` para inyectar `AppService`, exponer `getHello()` y agregar la ruta `GET /health` que devuelva `{ ok: true, ts: new Date().toISOString() }`.
- [ ] Ajustar `AppModule` para registrar los controladores (`AppController`, `RunsController`, `HealthController`) y proveedores (`AppService`, `PrismaClient`, `RunsService`, `StepsRegistry`, `EchoStep`, `DelayStep`, `HttpStep`, `GateService`, `SchedulerService`).
- [ ] Modificar `RunsService` y `SchedulerService` para consumir `Prisma.RunStatus` en lugar de `$Enums.RunStatus`.
- [ ] Actualizar las pruebas en `apps/api/src/**/*.spec.ts` para que esperen los estados `PENDING` y `SUCCESS` en lugar de `QUEUED` y `SUCCEEDED`.
- [ ] Reescribir `HttpStep` (`apps/api/src/steps/http.ts`) para usar la API nativa `fetch` y eliminar la dependencia de Axios, preservando la interfaz actual.
- [ ] Migrar la configuración de Vitest a un archivo `vitest.config.mts` y simplificar la configuración de coverage a `{ provider: 'v8', enabled: true }`.
- [ ] Actualizar `apps/api/package.json` para que el script `test` sea `vitest run --run` e incluir `vitest@3.2.4` y `@vitest/coverage-v8@3.2.4` como dependencias de desarrollo.

## Configuración del monorepo
- [ ] Fijar `packageManager` en el `package.json` raíz a `pnpm@9.15.9` y asegurar que `pnpm-lock.yaml` esté sincronizado y trackeado.
- [ ] Definir `"prepare": "echo skip-husky"` en `apps/api/package.json` para evitar que Husky se ejecute fuera de la raíz.
- [ ] Verificar que `.env*` continúen ignorados en `.gitignore` y que exista un `.env.example` sanitizado.

## CI/CD
- [ ] Ajustar `.github/workflows/ci.yml` para instalar `pnpm@9.15.9`, ejecutar `pnpm install --frozen-lockfile`, construir y probar `./apps/api` con filtros, y subir la cobertura (`apps/api/coverage`) mediante `actions/upload-artifact@v4`.

## Verificación final
- [ ] Ejecutar `pnpm install` en la raíz.
- [ ] Correr `pnpm --filter ./apps/api build`.
- [ ] Correr `pnpm --filter ./apps/api test` y confirmar que la cobertura se genere correctamente.
- [ ] Confirmar que el job de CI pasa y publica el artefacto `api-coverage`.
