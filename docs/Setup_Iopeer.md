# 🧠 IOpeer — Guía Completa de Instalación y Configuración del Backend

IOpeer es una plataforma modular de automatización y orquestación de agentes IA.  
Este documento explica paso a paso cómo levantar el backend (**NestJS + Prisma + PostgreSQL**)  
ya sea **localmente con Docker** o conectado a **Supabase (PostgreSQL remoto)**.

---

## 📋 Requisitos Previos

| Herramienta | Versión mínima | Uso |
|--------------|----------------|-----|
| **Git** | latest | Clonar el repositorio |
| **Node.js** | 18+ (recomendado 20.x) | Ejecutar el backend |
| **pnpm** | latest | Gestor de paquetes |
| **Nest CLI** *(opcional)* | — | Debug y desarrollo |
| **Docker Desktop** *(opcional)* | latest | Para base local |
| **WSL2** *(solo Windows)* | — | Requerido por Docker Desktop |

Instalación rápida (global):
```bash
npm install -g pnpm
npm install -g @nestjs/cli
```

---

## 📁 1. Clonar el Proyecto

```bash
git clone <URL_DEL_REPO> iopeer
cd iopeer
pnpm install
```

---

## ⚙️ 2. Crear Archivo de Entorno `.env`

Ubicación:  
`apps/api/.env`

### 🔹 Opción A — Base de datos local (Docker)

```ini
DATABASE_URL="postgresql://iopeer:iopeer@localhost:5432/iopeer?schema=public"
NODE_ENV=development
PORT=3001
```

### 🔹 Opción B — Base de datos remota (Supabase)

Obtené la conexión desde tu panel de Supabase →  
**Project Settings → Database → Connection Info**  

```ini
DATABASE_URL="postgresql://postgres:<TU_PASSWORD>@db.<HASH>.supabase.co:5432/postgres?schema=public&sslmode=require"
NODE_ENV=development
PORT=3001
```

> ⚠️ En Supabase es necesario usar `&sslmode=require`.

---

## 🐘 3. Base de Datos

### 🧩 Opción A — Docker Local

Desde `iopeer/apps/api`:

```bash
docker compose up -d db
docker compose ps   # Esperar a ver (healthy)
```

### ☁️ Opción B — Supabase

No necesitás Docker.  
Solo asegurate de que tu `DATABASE_URL` sea la correcta y el servicio esté online.

---

## 🧱 4. Aplicar Migraciones y Crear Tablas

Desde `iopeer/apps/api`:

```bash
# (Modo limpio, recomendado)
pnpm prisma migrate reset -- --force

# o si no querés borrar datos:
# pnpm prisma db push
```

Esto creará las tablas `Workflow`, `Run`, `User`, `Gate`, `Metric`, etc.

---

## 💾 5. Generar Prisma Client y Sembrar Datos (Seed)

```bash
pnpm prisma generate
pnpm prisma:seed
```

> Si aparece el error “table does not exist”, ejecutá `pnpm prisma db push` antes del seed.

---

## 🚀 6. Levantar la API

```bash
pnpm start
# o en modo desarrollo:
pnpm start:dev
```

Verificación:

```bash
curl http://localhost:3001/health
# → {"ok":true,"db":"up"}

curl -X POST http://localhost:3001/scheduler/next
# → {"status":"queued"}
```

---

## ☁️ 7. Confirmar Conexión Supabase

En tu panel de Supabase → **Table Editor**, deberías ver:
- `Workflow`
- `Run`
- `User`
- `Gate`
- `Metric`

Si no aparecen:
```bash
pnpm prisma db push
pnpm prisma:seed
```

---

## 🧹 8. Limpieza (solo modo Docker)

```bash
cd apps/api
docker compose down -v
```

Esto detiene y borra contenedores y volúmenes (`api-db-1`, `api_db_data_iopeer`, etc.).

---

## 🧠 9. Troubleshooting

| Error | Causa | Solución |
|-------|--------|----------|
| `P2021: table does not exist` | Migraciones no aplicadas | `pnpm prisma db push` o `pnpm prisma migrate reset -- --force` |
| `EPERM ... query_engine-windows.dll.node` | Prisma bloqueado por Node o antivirus | `taskkill /F /IM node.exe` y `pnpm prisma generate` |
| `No projects matched the filters` | Uso de `--filter` dentro de `apps/api` | Ejecutá `pnpm start` directo |
| `Workflow.key no existe` | Migración incompleta | Repetí `migrate reset` |
| Conexión Supabase rechazada | Falta SSL | Agregá `&sslmode=require` a la URL |
| Puerto 5432 ocupado | Otro Postgres corriendo | Cambiá el puerto en `docker-compose.yml` y `.env` |

---

## 📜 10. Flujo Completo Rápido

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear .env (Docker o Supabase)
# apps/api/.env

# 3. Levantar DB local (solo si usás Docker)
cd apps/api
docker compose up -d db

# 4. Aplicar migraciones
pnpm prisma migrate reset -- --force

# 5. Generar cliente y seed
pnpm prisma generate
pnpm prisma:seed

# 6. Iniciar API
pnpm start
```

---

## 🗂 11. Estructura Esperada del Proyecto

```
iopeer/
 ├─ apps/
 │   ├─ api/
 │   │   ├─ prisma/
 │   │   │   ├─ schema.prisma
 │   │   │   ├─ seed.ts
 │   │   ├─ src/
 │   │   ├─ .env
 │   │   ├─ docker-compose.yml
 │   │   └─ package.json
 │   └─ web/
 ├─ node_modules/
 ├─ package.json
 ├─ pnpm-workspace.yaml
 └─ docs/
     └─ SETUP_IOPEER.md
```

---

## 🧭 12. Pruebas Rápidas

### Verificar Salud
```
GET http://localhost:3001/health
→ {"ok":true,"db":"up"}
```

### Forzar Scheduler
```
POST http://localhost:3001/scheduler/next
→ {"status":"queued"}
```

---

## 🧩 13. Limpieza Completa / Reinicio Total

```bash
# Matar procesos Node (Windows)
taskkill /F /IM node.exe 2>$null

# Bajar y borrar Docker
cd apps/api
docker compose down -v

# Limpiar Prisma
rm -rf node_modules/.prisma
pnpm install

# Reaplicar schema y seed
pnpm prisma db push
pnpm prisma generate
pnpm prisma:seed

# Iniciar backend
pnpm start
```

---

## 🚀 14. Próximos Pasos

- Integrar frontend (`apps/web`):
  ```bash
  cd apps/web
  pnpm dev
  ```
- Explorar módulos: `Runs`, `Workflows`, `Metrics`, `Gates`
- Añadir monitoreo en `/metrics`
- Configurar despliegue CI/CD (Render, Vercel o Docker Compose)

---

✅ **Listo:**  
Con este único archivo podés levantar IOpeer en cualquier máquina,  
usando Docker o Supabase, sin pasos extra.
