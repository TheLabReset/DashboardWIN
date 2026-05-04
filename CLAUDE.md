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

- `CONFIG.passwordHash` siempre es SHA-256, nunca plaintext.
- `sw.js` no debe cachear `app.powerbi.com` ni `*.powerbi.com`. El iframe va siempre a la red.
- `start_url` y `scope` del manifest se mantienen relativos (`./`).
- Compatibilidad iOS Safari donde se pueda. APIs solo-Android (`screen.orientation.lock`) van envueltas en try/catch silencioso.
- Cualquier cambio a un asset cacheado en `sw.js` obliga a bumpear `CACHE_NAME` (ej. `dashboard-wrapper-v1` a `v2`).

## Mapa del index.html

| Sección | Líneas |
|---|---|
| Meta tags y links (manifest, icons, theme-color) | 1-13 |
| CSS variables `:root` (paleta) | 14-31 |
| Reset y body con gradients de fondo | 33-49 |
| CSS login screen (card, wave, input, submit, footer) | 51-226 |
| CSS rotation prompt | 228-283 |
| CSS app screen (header, icon-btn, iframe-wrap, loader) | 285-370 |
| HTML login screen | 375-418 |
| HTML rotation prompt | 420-451 |
| HTML app screen (header + iframe) | 453-492 |
| `<script>`: objeto `CONFIG` | 498-527 |
| Setea textos dinámicos e inyecta logos | 533-551 |
| Helper `sha256` | 554-558 |
| Refs a pantallas y `showLogin`/`showApp` | 561-588 |
| Lógica de login (handleLogin, eye toggle, autologin) | 591-651 |
| Logout, refresh, fullscreen API | 654-691 |
| Botón fullscreen del rotate prompt y dismiss | 693-706 |
| Detección de orientation portrait + media query | 709-726 |
| Registro del service worker | 729-737 |

## Comandos comunes

```bash
# Servir local (SW funciona en localhost sin HTTPS)
npx serve . -l 3000

# Servir con HTTPS self-signed para probar PWA real
npx http-server -S -C cert.pem -K key.pem .

# Generar hash SHA-256 de una password
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode(process.argv[1])).then(b => console.log(Buffer.from(b).toString('hex')))" "MI_PASSWORD"

# Bumpear cache del SW: editar sw.js, subir CACHE_NAME (v1 -> v2)

# Validar manifest e iconos
npx pwa-asset-generator --help
```

Deploy: Cloudflare Pages (recomendado), Vercel (`npx vercel --prod`) o Netlify drop. Sin build command, output dir `/`.

## Pendientes

(vacío por ahora)
