// scripts/log-progress.js
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// argumentos opcionales: --msg "texto"
const args = process.argv.slice(2);
const msgIndex = args.indexOf("--msg");
const extraMsg = msgIndex >= 0 ? args.slice(msgIndex + 1).join(" ").trim() : "";

// fecha local legible
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const hh = String(now.getHours()).padStart(2, "0");
const min = String(now.getMinutes()).padStart(2, "0");
const stamp = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

let branch = "unknown";
try {
  branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
} catch {}

const lines = [];
lines.push("");
lines.push(`## ${stamp} ‚Äî ${branch}`);
lines.push("");
lines.push("### ‚úÖ Hecho");
lines.push("- ...");
lines.push("");
lines.push("### ‚è≠Ô∏è Pendiente");
lines.push("- ...");
lines.push("");
lines.push("### Ì≥ù Notas");
lines.push(extraMsg ? `- ${extraMsg}` : "- ...");
lines.push("");

const docPath = path.join(process.cwd(), "docs", "progress-log.md");
if (!fs.existsSync(path.dirname(docPath))) {
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
}
fs.appendFileSync(docPath, lines.join("\n"), "utf8");

try {
  execSync(`git add "${docPath}"`, { stdio: "ignore" });
} catch {}

console.log(`‚úî Progreso registrado en ${docPath}`);
