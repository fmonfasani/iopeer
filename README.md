<h1 align="center">
  <a href="https://iopeer.com" target="_blank">IOPeer</a>
</h1>
<p align="center"><i>Developer-first automation platform — visual workflows, connectors, and AI in one place.</i></p>

<p align="center">
  <a href="#security"><img src="https://img.shields.io/badge/Security-Policy-blue?style=for-the-badge"></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-Commercial-black?style=for-the-badge"></a>
  <a href="#support"><img src="https://img.shields.io/badge/Status-Private%20SaaS-8A2BE2?style=for-the-badge"></a>
</p>

---

## What is IOPeer?
**IOPeer** is a private, commercial SaaS for building and running **visual workflows** (DAG) that integrate APIs, databases, queues, and **LLMs**. It’s designed for developers and technical teams that want speed **without** losing control, security, or observability.

**Highlights**
- 🎛️ **Visual builder** (drag & drop), versioned flows.
- 🔌 **Connectors** for HTTP, DBs, Email/SMTP, S3/MinIO, Slack, GitHub, etc.
- 🤖 **AI-first**: LLM calls, embeddings, classification, agent patterns.
- 📈 **Observability**: logs, metrics, and traces per step.
- 🔐 **Security**: encrypted credentials, isolated execution, RBAC (roadmap).
- 🧰 **SDK (TypeScript)** to implement custom nodes for your org.

> **Attribution notice**: Portions of this codebase adapt components originally available under the MIT License from the Activepieces project. Copyright © Activepieces contributors.  
> “Based on Activepieces (https://github.com/activepieces/activepieces) — MIT.”  
> Notices are preserved in the respective files where applicable.

---

## Quickstart (internal)
> This repository is **private**. Instructions below are for internal developers and trusted partners.

```bash
# Requirements: Node 20+, pnpm, Docker, Docker Compose

# 1) Clone & bootstrap
git clone <PRIVATE_REPO_URL> iopeer
cd iopeer
cp .env.example .env   # fill Postgres/Redis/S3/KMS/etc.

# 2) Infra (dev)
docker compose up -d   # postgres, redis, minio

# 3) Build workspaces
pnpm i
pnpm -r build

# 4) Run apps
pnpm --filter @iopeer/api dev
pnpm --filter @iopeer/editor dev
pnpm --filter @iopeer/worker dev
