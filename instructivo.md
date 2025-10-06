# 🧠 IOpeer — Guía de Instalación y Configuración de la Base de Datos

Este instructivo explica cómo levantar **IOpeer Backend (NestJS + Prisma)** de dos formas:

1. **Modo local con Docker (Postgres en contenedor)**
2. **Modo remoto con Supabase (Postgres en la nube)**

---

## 📋 Requisitos previos

Asegurate de tener instalados:

- **Git**
- **Node.js 20+**  
- **pnpm** → `npm install -g pnpm`
- **Nest CLI** (opcional, para debug) → `npm install -g @nestjs/cli`
- **Prisma CLI** → se instala junto con las dependencias (`pnpm install`)

Opcional para modo local:
- **Docker Desktop** (Windows/macOS)
- **WSL2 habilitado** (Windows)

---

## 🧩 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO> iopeer
cd iopeer
pnpm install
