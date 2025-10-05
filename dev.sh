#!/usr/bin/env bash
# Simple script to bootstrap the IOPeer development stack.
# It assumes you have docker and npm installed on your host.

set -euo pipefail

# Start only the database and cache so that the API can run migrations
printf "Starting postgres and redis containers...\n"
docker compose up -d postgres redis

# Give services a moment to become healthy
printf "Waiting for database and redis to be ready...\n"
sleep 5

# Install npm dependencies respecting the lockfile
printf "Installing npm dependencies...\n"
npm install --legacy-peer-deps

# If Prisma CLI is installed, run migrations (ignore errors if not configured)
if [ -x node_modules/.bin/prisma ]; then
  printf "Running database migrations via Prisma...\n"
  npx prisma migrate dev || echo "Prisma migrations not configured, skipping."
fi

# Bring up the backend, engine and frontend containers
printf "Starting backend, engine and frontend services...\n"
docker compose up -d backend engine frontend

printf "All services are starting.  The API should be available on http://localhost:3001 and the web UI on http://localhost:3000 once the containers have finished initializing.\n"
