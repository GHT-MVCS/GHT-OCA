# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src ./src

# Compilar TypeScript
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Instalar dumb-init para mejor manejo de señales
RUN apk add --no-cache dumb-init

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar archivos compilados del stage anterior
COPY --from=builder /app/dist ./dist

# Copiar archivos estáticos (HTML, CSS, JS)
COPY index.html ./
COPY style.css ./

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/flights/ping', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

# Usar dumb-init para evitar problemas con señales
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["node", "dist/main.js"]

# Exponer puerto
EXPOSE 3000
