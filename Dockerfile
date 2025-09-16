# Multi-stage Dockerfile para Scanitz API
# Otimizado para produção com layers reduzidas

# ================== STAGE 1: Dependencies ==================
FROM node:18-alpine AS deps
LABEL maintainer="Scanitz Team"
LABEL description="Scanitz API - Sistema de Denúncias Urbanas"

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json yarn.lock* ./

# Instalar dependências usando yarn (otimizado)
RUN yarn --frozen-lockfile --network-timeout 1000000

# ================== STAGE 2: Builder ==================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Build do TypeScript
RUN yarn build

# ================== STAGE 3: Runner ==================
FROM node:18-alpine AS runner

# Instalar dumb-init para gerenciamento de processos
RUN apk add --no-cache dumb-init

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 scanitz

WORKDIR /app

# Copiar apenas os arquivos necessários para produção
COPY --from=builder --chown=scanitz:nodejs /app/dist ./dist
COPY --from=builder --chown=scanitz:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=scanitz:nodejs /app/package.json ./package.json

# Criar diretório para logs
RUN mkdir -p /app/logs && chown scanitz:nodejs /app/logs

# Definir usuário
USER scanitz

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta configurável
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: process.env.PORT || 3000, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      console.log('Health check status:', res.statusCode); \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('error', (err) => { console.error('Health check failed:', err); process.exit(1); }); \
    req.end();"

# Iniciar aplicação com dumb-init para gerenciamento de sinais
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]