<p align="center">
  <a href="https://iopeer.com" target="_blank">
    <img src="assets/logo_Iopeer_samile_black.png" alt="IOPeer" height="240">
  </a>
</p>


<p align="center"><i>Developer-first automation platform — visual workflows, connectors, and AI in one place.</i></p>

<p align="center">
  <a href="#security"><img src="https://img.shields.io/badge/Security-Policy-blue?style=for-the-badge"></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-Commercial-black?style=for-the-badge"></a>
  <a href="#support"><img src="https://img.shields.io/badge/Status-Private%20SaaS-8A2BE2?style=for-the-badge"></a>
</p>

---

## What is IOPeer?
**IOPeer** is a private, commercial SaaS product for building and running **visual workflows** (DAG) that integrate APIs, databases, queues, and **LLMs**. It’s built for developer teams that want speed **without** losing control, security, or observability.

**Highlights**
- 🎛️ **Visual builder** (drag & drop), versioned flows.
- 🔌 **Connectors** for HTTP, DBs, Email/SMTP, S3/MinIO, Slack, GitHub, and more.
- 🤖 **AI-first**: LLM calls, embeddings, classification, agent patterns.
- 📈 **Observability**: logs, metrics, and traces per step.
- 🔐 **Security-conscious**: encrypted credentials, isolated execution, RBAC (roadmap).
- 🧰 **SDK (TypeScript)** to implement custom nodes for your org.

> **Attribution notice:** Portions of this codebase adapt components that were originally available under the MIT License from the Activepieces project. Those original notices are preserved in the respective files where applicable. This repository is a private, commercial IOPeer product and is not public/open-source. See the LICENSE section for details.

---

## Quickstart (internal)
> This repository is **private**. These instructions are for internal developers and authorized partners.

```bash
# Requirements: Node 20+, pnpm, Docker, Docker Compose

# 1) Clone & bootstrap
git clone <PRIVATE_REPO_URL> iopeer
cd iopeer
cp .env.example .env   # fill Postgres/Redis/S3/KMS/etc.

# 2) Infra (dev)
docker compose up -d   # postgres, redis, minio

# 3) Install & build
pnpm i
pnpm -r build

# 4) Run apps (examples)
pnpm --filter @iopeer/api dev
pnpm --filter @iopeer/editor dev
pnpm --filter @iopeer/worker dev
