FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY server ./server
COPY index.html admin.html login.html admin.js admin.css content.js templates.js script.js styles.css ./
COPY templates ./templates
COPY vendor ./vendor
COPY assets ./assets
COPY data ./data

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
