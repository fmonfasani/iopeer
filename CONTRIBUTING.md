
---

# CONTRIBUTING.md (replace entire file)

```markdown
# Contributing to IOPeer

Thank you — your help makes IOPeer better. This document is for internal contributors and authorized partners only. This repository is **not** open-source: contributions are governed under our commercial/enterprise policies.

> Note: some components were adapted from Activepieces; original attribution and license notices remain in the files where required. Please do not remove those headers. :contentReference[oaicite:6]{index=6}

## Before you contribute
- This codebase is private. Do not fork, mirror, or publish it externally.
- Make sure you have approvals required by your manager or the repo owner.
- Use the internal development environment (`.env.example`) and follow infra instructions in the README.

## Workflow
1. Create a branch from `main` named: `feature/<short-description>` or `fix/<short-description>`.
2. Keep changes focused and well-scoped.
3. Add tests for new behavior; update existing tests if necessary.
4. Run linters and unit tests locally:
   ```bash
   pnpm -r lint
   pnpm -r test
