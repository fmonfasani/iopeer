#!/usr/bin/env bash
set -euo pipefail

# --- Config ---
SEMVER_REGEX='^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z\.-]+)?(\+[0-9A-Za-z\.-]+)?$'
DEFAULT_VERSION="0.0.0"
DRY_RUN="${DRY_RUN:-false}"   # export DRY_RUN=true para ver cambios sin escribir archivos

root_dir="$(pwd)"
echo "Repo root: $root_dir"
echo "DRY_RUN=$DRY_RUN"
echo

# --- Prechequeos ---
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Necesito Node.js disponible en PATH para modificar JSON. Abortando."
  exit 1
fi

# --- Función Node para actualizar un package.json ---
update_pkg_json() {
  local file="$1"
  node - "$file" "$SEMVER_REGEX" "$DEFAULT_VERSION" "$DRY_RUN" <<'NODECODE'
const fs = require('fs');

const file = process.argv[2];
const semverRe = new RegExp(process.argv[3]);
const defaultVersion = process.argv[4];
const dryRun = (process.argv[5] || 'false') === 'true';

let raw;
try {
  raw = fs.readFileSync(file, 'utf8');
} catch (e) {
  console.log(`⚠️  No se pudo leer: ${file} (${e.message})`);
  process.exit(0);
}

let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.log(`❌ JSON inválido: ${file}`);
  process.exit(0);
}

const before = { version: json.version, private: json.private };

let changed = false;

// version: debe existir y ser semver válido
if (!json.version || !semverRe.test(json.version)) {
  json.version = defaultVersion;
  changed = true;
}

// private: si falta, lo forzamos a true (para workspaces no publicables)
if (typeof json.private === 'undefined') {
  json.private = true;
  changed = true;
}

if (changed) {
  if (!dryRun) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
  }
  console.log(`✅ FIX -> ${file}
    version: ${before.version}  ->  ${json.version}
    private: ${before.private}  ->  ${json.private}`);
} else {
  console.log(`OK  -> ${file} (sin cambios)`);
}
NODECODE
}

# --- Buscar todos los package.json (excluye node_modules y .git) ---
mapfile -t files < <(find "$root_dir" -type f -name "package.json" \
  -not -path "*/node_modules/*" -not -path "*/.git/*" | sort)

if [ ${#files[@]} -eq 0 ]; then
  echo "No encontré package.json en el repo. Nada que hacer."
  exit 0
fi

echo "Analizando ${#files[@]} package.json..."
echo

# --- Actualizar cada package.json ---
for f in "${files[@]}"; do
  update_pkg_json "$f"
done

echo
echo "---------------------------------------------"
echo " Regenerando lockfile (sin scripts ni peers) "
echo "---------------------------------------------"
echo

# Limpieza (opcional pero recomendado)
rm -rf node_modules || true
rm -f package-lock.json || true

# Evitar husky/prepare y peers estrictos
export HUSKY=0
npm install --package-lock-only --legacy-peer-deps --ignore-scripts

echo
echo "✅ Listo. Bloqueo generado: package-lock.json"
echo "Ahora podés volver a construir Docker:"
echo "  docker compose down -v && docker compose up --build"
