# Dashboard Wrapper · Power BI

Wrapper PWA con login por contraseña para envolver un dashboard de Power BI publicado.
Eleva la presentación del dashboard sin tocar Power BI.

## Estructura

```
dashboard-wrapper/
├── index.html              # App completa (login + wrapper + iframe)
├── manifest.webmanifest    # Config PWA
├── sw.js                   # Service worker (cache del shell, no del dashboard)
├── icon-192.png            # Icono PWA
├── icon-512.png            # Icono PWA
└── icon-512-maskable.png   # Icono adaptable Android
```

## Configuración (3 pasos)

### 1. Edita el bloque `CONFIG` dentro de `index.html`

Está al inicio del `<script>`, alrededor de la línea 350. Cambia:

```js
const CONFIG = {
  clientName: "UPN",
  dashboardLabel: "Dashboard UPN",
  dashboardUrl: "https://app.powerbi.com/view?r=...&chromeless=1",
  passwordHash: "...",      // ver paso 2
  clientLogo: "logo-upn.svg",
  agencyLogo: "logo-reset.svg",
  footerText: "© 2026 UPN · Reset",
  storageKey: "upn_dashboard_v1"
};
```

**Tip Power BI**: agrega `&chromeless=1` al link de Publish to Web para esconder
las barras nativas. Otros parámetros útiles:
- `&filterPaneEnabled=false`
- `&navContentPaneEnabled=false`

### 2. Genera el hash de tu contraseña

La password no va en el repo. Se inyecta en build desde una env var de Netlify.

```bash
node scripts/generate-hash.js "MI_PASSWORD"
# imprime: pbkdf2$100000$<saltHex>$<hashHex>
```

Pega esa línea completa en Netlify, en **Site settings → Environment variables**, con el nombre `DASHBOARD_PASSWORD_HASH`. En cada deploy, `build.js` la sustituye dentro de `index.html`.

> En `index.html`, `CONFIG.passwordHash` queda con el placeholder `__DASHBOARD_PASSWORD_HASH__`. Si servís sin pasar por `build.js`, el script local cae a un hash demo (password `demo123`) y avisa por stderr. **No subas un build con ese fallback a producción.**

Alternativa más rápida (sin generar hash a mano): definí `DASHBOARD_PASSWORD` en Netlify y `build.js` deriva el hash en cada deploy. Eso invalida las sesiones recordadas en cada build (salt nuevo cada vez), así que lo recomendado es `DASHBOARD_PASSWORD_HASH`.

### 3. Reemplaza los iconos y logos

- **Logos**: pon `logo-cliente.svg` y `logo-agencia.svg` (o png) en la carpeta y
  apúntalos desde `clientLogo` / `agencyLogo`. Si dejas en `null`, muestra el `clientName`.
- **Iconos PWA**: reemplaza `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`
  con tus propios iconos del mismo tamaño. El maskable necesita el contenido importante
  centrado (safe area del 80%).

## Deploy

### Netlify (configuración actual)
1. Conectá el repo en Netlify. El `netlify.toml` define build command (`node build.js`) y publish dir (`.`).
2. En **Site settings → Environment variables** definí `DASHBOARD_PASSWORD_HASH` con el valor que generaste en el paso 2.
3. Push a la branch que despliega Netlify. El build sustituye el placeholder y publica.

### Otros hostings
- **Cloudflare Pages / Vercel**: replicar el build command (`node build.js`), publish dir `/`, y la misma env var.
- **Netlify drop / hostings sin build**: corré `node build.js` local con la env var seteada, y subí la carpeta resultante.

### IMPORTANTE: HTTPS obligatorio
El service worker y la PWA solo funcionan sobre HTTPS (o `localhost`).
Cualquiera de los hostings de arriba lo da por default.

## Cómo funciona la "instalación" como PWA

- **Android Chrome**: muestra prompt automático "Add to Home Screen". También aparece
  un botón en la barra de URL.
- **iOS Safari**: el usuario tiene que ir a Compartir → "Añadir a pantalla de inicio".
  iOS no soporta el prompt automático, pero la app sí queda standalone (sin Safari UI).
- **Desktop Chrome/Edge**: aparece icono de instalación a la derecha de la URL.

Una vez instalada, abre como app independiente, sin barra de navegador.

## Detalles técnicos

- **Login client-side**: NO es seguridad real. Cualquiera con devtools puede ver el hash
  y, si conoce el link directo del Power BI, accederlo. Es un *gate* visual y de UX,
  no un firewall. El link de Publish to Web ya es público por definición.
- **Hash en repo vs en secreto**: el hash ya no vive en `index.html` del repo. Se inyecta
  desde la env var `DASHBOARD_PASSWORD_HASH` durante el build de Netlify. El hash final
  sigue siendo visible en el JS servido al cliente, pero no aparece en el código fuente
  público. Además se usa PBKDF2-SHA-256 con 100k iteraciones para encarecer brute-force
  offline contra el hash deployado.
- **Si necesitas seguridad real**: usa Power BI Embedded con backend (Node/FastAPI)
  que genere tokens por usuario. Es otro proyecto.
- **Service worker** solo cachea el shell (HTML/CSS/icons). El iframe del Power BI
  va siempre directo a la red para tener datos frescos.
- **Recordar contraseña**: usa `localStorage` si el checkbox está marcado, sino
  `sessionStorage` (se pierde al cerrar la pestaña).
- **Rotación**: detecta portrait + ancho < 900px y muestra el prompt. El botón
  "Activar pantalla completa" usa Fullscreen API + `screen.orientation.lock("landscape")`
  (este último solo Android).
- **iOS y fullscreen**: iOS Safari no soporta Fullscreen API en iframes ni en doc.
  La única forma real de "fullscreen" en iPhone es instalando como PWA. El botón
  oculta el prompt igual.

## Customización rápida

### Cambiar la paleta
Edita las CSS variables al inicio de `index.html`:
```css
:root {
  --bg-1: #050b2e;
  --accent-1: #93a5fc;
  --accent-2: #c4b5fd;
  /* ... */
}
```

### Cambiar el saludo o textos
Busca "Hola", "Gira tu dispositivo", "CLAVE DE ACCESO" en el HTML.

### Múltiples usuarios con passwords distintas
Cambia `passwordHash: "..."` por `passwordHashes: ["hash1", "hash2", ...]`
y en `handleLogin()` reemplaza `=== CONFIG.passwordHash` por
`CONFIG.passwordHashes.includes(hash)`.

## Versionado del cache

Cuando hagas cambios al `index.html` y quieras forzar que los usuarios bajen la
versión nueva, sube el número en `sw.js`:
```js
const CACHE_NAME = "dashboard-wrapper-v2"; // <- v1 → v2
```
