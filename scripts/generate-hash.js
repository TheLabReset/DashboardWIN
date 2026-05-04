// Genera un hash PBKDF2-SHA-256 de una password para usar como
// DASHBOARD_PASSWORD_HASH en Netlify (o donde corresponda).
//
// Uso:
//   node scripts/generate-hash.js "MI_PASSWORD"
//
// Imprime una línea con el hash en formato pbkdf2$<iter>$<saltHex>$<hashHex>.
// Copia esa línea completa y pégala en la env var DASHBOARD_PASSWORD_HASH.

const crypto = require("crypto");

const password = process.argv[2];
if (!password) {
  console.error("Uso: node scripts/generate-hash.js <password>");
  process.exit(1);
}

const ITERATIONS = 100000;
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
console.log(`pbkdf2$${ITERATIONS}$${salt.toString("hex")}$${hash.toString("hex")}`);
