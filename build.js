// Build step para Netlify.
// Sustituye __DASHBOARD_PASSWORD_HASH__ en index.html por el valor de la env var
// DASHBOARD_PASSWORD_HASH. Si no está definida, deriva un hash de DASHBOARD_PASSWORD.
// En ausencia de ambas, usa una password demo y avisa por stderr.
//
// Formato del hash: pbkdf2$<iter>$<saltHex>$<hashHex>
//
// El script es idempotente solo si el placeholder sigue presente en index.html.
// Netlify hace checkout limpio en cada build, así que no es problema.

const fs = require("fs");
const crypto = require("crypto");

const HTML_PATH = "index.html";
const PLACEHOLDER = "__DASHBOARD_PASSWORD_HASH__";
const ITERATIONS = 100000;

function derive(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
  return `pbkdf2$${ITERATIONS}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

let hash = process.env.DASHBOARD_PASSWORD_HASH;
const password = process.env.DASHBOARD_PASSWORD;

if (!hash && password) {
  hash = derive(password);
  console.log("Hash derivado desde DASHBOARD_PASSWORD.");
} else if (hash) {
  console.log("Hash leído desde DASHBOARD_PASSWORD_HASH.");
} else {
  hash = derive("demo123");
  console.warn("[WARN] Falta DASHBOARD_PASSWORD_HASH y DASHBOARD_PASSWORD. Usando hash demo (password: demo123). NO usar en producción.");
}

const html = fs.readFileSync(HTML_PATH, "utf8");
if (!html.includes(PLACEHOLDER)) {
  console.error(`[ERROR] No se encontró el placeholder ${PLACEHOLDER} en ${HTML_PATH}.`);
  console.error("Verifica que CONFIG.passwordHash siga apuntando al placeholder.");
  process.exit(1);
}

fs.writeFileSync(HTML_PATH, html.replace(PLACEHOLDER, hash));
console.log(`Hash inyectado en ${HTML_PATH}.`);
