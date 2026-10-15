# shalom-landing

Sitio público y panel de administración para **Servicios Funerarios Shalom** (HTML/CSS/JS + Hono).

## Stack

- Node.js 22+
- Hono
- Sharp (imágenes WebP y resize bajo demanda)

## Qué incluye

- **Sitio público** — Inicio, Paquetes, Servicios, Nosotros y artículos
- **Admin** — Páginas, paquetes, capillas, artículos y moderación de comentarios
- **Medios** — subida a WebP y resize vía `/media?src=…&w=640` con caché
- **Contacto** — formulario con envío de correo (config desde el admin)
- **Analytics** — eventos básicos visibles en el panel

## Requisitos

- Node.js 22+

## Instalación local

```bash
git clone https://github.com/AllenC2/shalom-landing.git
cd shalom-landing

cp .env.example .env
npm install
npm run hash-password -- "tu-password"
# pega el hash en ADMIN_PASSWORD_HASH dentro de .env

npm run dev
```

Abre `http://127.0.0.1:3000`.

- Admin: `/admin`
- Login: `/login`

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `PORT` | Puerto HTTP (default `3000`) |
| `ADMIN_USER` | Usuario del panel |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt (`npm run hash-password`) |
| `SESSION_SECRET` | Secreto largo para cookies firmadas |
| `NODE_ENV` | `development` o `production` |

El correo de contacto y la API key de Resend se configuran desde el admin (engranaje).

## Docker

```bash
cp .env.example .env
# completa ADMIN_PASSWORD_HASH y SESSION_SECRET
docker compose up --build -d
```

`./data` se monta como volumen (contenido, analytics, comentarios y ajustes).

## Deploy

1. Configura las variables en el host (no subas `.env` ni `data/admin.json`).
2. `npm ci --omit=dev`
3. `npm start` (escucha en `0.0.0.0:$PORT`)

En producción, `data/`, `data/media-cache/` y `assets/uploads/` deben ser escribibles.

## Licencia

Uso privado · AllenC2
