# Shalom Landing

Landing y panel de administración para Servicios Funerarios Shalom (HTML/CSS/JS + Hono).

## Requisitos

- Node.js 22+
- Variables de entorno (ver `.env.example`)

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run hash-password -- "tu-password"
# pega el hash en ADMIN_PASSWORD_HASH dentro de .env
npm run dev
```

Abre [http://127.0.0.1:3000](http://127.0.0.1:3000). Admin: `/admin` (login en `/login`).

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto HTTP (default `3000`) |
| `ADMIN_USER` | Usuario del panel |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt de la contraseña |
| `SESSION_SECRET` | Secreto largo para cookies firmadas |
| `NODE_ENV` | `development` o `production` |

El correo de contacto y la API key de Resend se configuran desde el admin (engranaje).

## Docker

```bash
cp .env.example .env
# completa ADMIN_PASSWORD_HASH y SESSION_SECRET
docker compose up --build -d
```

`./data` se monta como volumen para persistir contenido, analytics y ajustes.

## Despliegue

1. Configura las variables de entorno en el host.
2. `npm ci --omit=dev`
3. `npm start` (escucha en `0.0.0.0:$PORT`)

Asegúrate de que el directorio `data/` sea escribible en producción.
