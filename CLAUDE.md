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
| CSS variables `:root` (paleta WIN dark-naranja) | 15-33 |
| Reset y body con gradients de fondo | 35-50 |
| CSS login screen (card, wave, input, submit, footer) | 53-232 |
| CSS rotation prompt | 234-289 |
| CSS app screen (header, icon-btn, iframe-wrap, loader) | 291-376 |
| HTML login screen | 381-424 |
| HTML rotation prompt | 426-457 |
| HTML app screen (header + iframe) | 459-498 |
| `<script>`: objeto `CONFIG` (con placeholder de hash) | 504-528 |
| Setea textos dinámicos e inyecta logos | 535-554 |
| Helpers de hashing (`sha256Hex`, `hexToBytes`, `verifyPassword`) | 557-595 |
| Refs a pantallas y `showLogin`/`showApp` | 598-625 |
| Lógica de login (handleLogin, eye toggle, autologin) | 627-690 |
| Logout, refresh, fullscreen API | 692-730 |
| Botón fullscreen del rotate prompt y dismiss | 732-745 |
| Detección de orientation portrait + media query | 747-765 |
| Wave: re-disparar al hover de la card | 767-779 |
| Registro del service worker | 781-789 |

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
