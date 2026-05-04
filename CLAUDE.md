# CLAUDE.md

Guía interna para trabajar este repo con Claude Code. Lee esto antes de tocar archivos.

## Arquitectura

PWA estática de un solo archivo (`index.html`) que envuelve un iframe a un Power BI publicado por "Publish to web". Tres pantallas controladas por JS vanilla: login con hash SHA-256, prompt de rotación móvil, y app con header propio sobre el iframe `&chromeless=1`. Service worker (`sw.js`) cachea solo el shell, nunca el dominio de Power BI. Toda la config (URL, hash, logos, textos) vive en el objeto `CONFIG` al inicio del `<script>`. Sin build step, sin frameworks, deploy directo a hosting estático.

## Convenciones del proyecto

- Single-file HTML. No fragmentar en módulos sin acordarlo antes.
- CSS variables en `:root` son la única fuente de paleta. Color hardcodeado fuera de ahí es bug.
- `CONFIG` es la única fuente de verdad para textos, URLs, hashes y paths a logos.
- Sin frameworks (React, Vue, Tailwind, jQuery). Vanilla puro.
- Sin trackers ni analytics salvo pedido explícito.
- Sin guiones largos ni em dashes en strings de UI ni comentarios. Coma, punto, o reformular.
- Naming: camelCase en JS, kebab-case en clases CSS, kebab-case en archivos.
- Comentarios en español cuando aporten contexto del proyecto, en inglés cuando sean técnica pura.
- Commits pequeños y atómicos, mensaje en español, formato `feat:`/`fix:`/`refactor:`/`style:`/`docs:`.
- Antes de tocar varios archivos, anunciar en una o dos líneas qué cambia y por qué.
- Bugs e ideas detectadas en passing van a la sección "Pendientes" de este archivo, no se arreglan en silencio.

## Restricciones críticas

- `CONFIG.passwordHash` siempre es PBKDF2 (`pbkdf2$...`) o SHA-256 hex (legacy), nunca plaintext.
- En el repo, `CONFIG.passwordHash` debe quedar siempre con el placeholder `__DASHBOARD_PASSWORD_HASH__`. Nunca commitear el hash real ni un build sustituido.
- `sw.js` no debe cachear `app.powerbi.com` ni `*.powerbi.com`. El iframe va siempre a la red.
- `start_url` y `scope` del manifest se mantienen relativos (`./`).
- Compatibilidad iOS Safari donde se pueda. APIs solo-Android (`screen.orientation.lock`) van envueltas en try/catch silencioso.
- Cualquier cambio a un asset cacheado en `sw.js` obliga a bumpear `CACHE_NAME` (ej. `dashboard-wrapper-v1` a `v2`).
- CSP en `netlify.toml` permite `frame-src` solo a `*.powerbi.com`. Si el iframe migra a otro dominio, hay que actualizar la CSP.

## Mapa del index.html

| Sección | Líneas |
|---|---|
| Meta tags y links (manifest, icons, theme-color) | 1-13 |
| CSS variables `:root` (paleta WIN dark-naranja) | 18-34 |
| `.sr-only` (accesibilidad) y focus rings de botones | 38-49 |
| Reset y body con gradients de fondo | 50-65 |
| CSS login screen (card, wave, input, submit, footer) | 66-272 |
| CSS rotation prompt | 274-329 |
| CSS app screen (header, icon-btn, iframe-wrap, loader) | 331-443 |
| CSS update banner (PWA update) | 445-475 |
| HTML login screen | 487-533 |
| HTML rotation prompt | 537-565 |
| HTML app screen (header + iframe + error overlay) | 570-622 |
| HTML banner de nueva versión | 625-628 |
| `<script>`: objeto `CONFIG` (con placeholder de hash) | 636-662 |
| Helpers de hashing (`sha256Hex`, `hexToBytes`, `verifyPassword`) | 689-730 |
| Pantallas, estado y `loadDashboard` con watchdog | 740-795 |
| Lógica de login (handleLogin, eye toggle, autologin) | 797-865 |
| Logout, refresh, fullscreen API + sync icon | 869-930 |
| Botón fullscreen del rotate prompt y dismiss | 933-945 |
| Detección iOS / standalone y variant del rotate prompt | 939-985 |
| Wave: re-disparar al hover de la card | 985-1008 |
| Registro del service worker + auto-update prompt | 995-1030 |

> Las líneas son aproximadas y se desplazan al editar. Usar `grep -n` para anclajes exactos.

## Comandos comunes

```bash
# Servir local (SW funciona en localhost sin HTTPS).
# Antes de abrir el browser, correr build.js para sustituir el placeholder.
DASHBOARD_PASSWORD=demo123 node build.js && npx serve . -l 3000

# Generar el hash PBKDF2 de una password (la línea se pega en Netlify env var)
node scripts/generate-hash.js "MI_PASSWORD"

# Build Netlify (lo corre el CI). Reemplaza __DASHBOARD_PASSWORD_HASH__ in-place.
node build.js

# Bumpear cache del SW: editar sw.js, subir CACHE_NAME (v1 -> v2)
```

Deploy: Netlify es el target oficial (`netlify.toml` define build y headers). Cloudflare Pages / Vercel funcionan replicando el build command y la env var. **Importante**: nunca commitear `index.html` con el hash sustituido. Si por error pasa, revertir el placeholder antes del push.

## Pendientes

- Optimizar `win-white.png` (~302KB), `win-orange.png` (~316KB) y los Reset (~470KB cada uno). PNG de 2880x1620 servidos para mostrar 28-36px de alto es excesivo. Pasarlos a WebP/AVIF o resamplear a tamaños cercanos a los de uso.
- El logo wordmark de WIN tiene el puntito de la "i" muy arriba, lo que descentra ópticamente la fila de logos en alturas chicas. Revisar alineación vertical (translateY pequeño en `.logos-row img` o un padding compensado solo para el logo de WIN).
- Theme color de la meta tag (`#0a0a0a`) y del manifest (`#ff6b1a`) están desalineados a propósito (URL bar oscura, splash naranja). Validar que en Android se vea bien, si no, alinear ambos.
