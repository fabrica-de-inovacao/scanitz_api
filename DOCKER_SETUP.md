# 🐳 Docker Setup - Scanitz API

## Guia Completo de Containerização

Este guia explica como rodar a API Scanitz em containers Docker, usando as variáveis de ambiente do arquivo `.env`.

## 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Arquivo .env** configurado com as credenciais do Firebase
- **Yarn** ou **NPM** para desenvolvimento local

## 🚀 Deploy Rápido

### Opção 1: Script Automatizado (Recomendado)

**Windows:**

```cmd
# Execute o script de deploy
deploy.bat
```

**Linux/Mac:**

```bash
# Dar permissão ao script
chmod +x deploy.sh

# Execute o script de deploy
./deploy.sh
```

### Opção 2: Comandos Manuais

```bash
# 1. Build da imagem
docker-compose build

# 2. Subir os serviços
docker-compose up -d

# 3. Verificar status
docker-compose ps

# 4. Ver logs
docker-compose logs -f scanitz-api
```

## 🔧 Configuração de Ambiente

### Variáveis Essenciais no .env

```bash
# Porta do servidor (importante para Docker)
PORT=3000

# Ambiente
NODE_ENV=production

# Firebase (copiado do seu .env atual)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_CREDENTIALS={"apiKey":"sua-api-key",...}
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
```

### Arquivo .env.template

Um arquivo template foi criado para facilitar configurações futuras. Copie e renomeie para `.env` quando necessário.

## 🏗️ Arquitetura Docker

### Multi-stage Build

```dockerfile
# 1. Dependencies - Instala dependências
# 2. Builder - Compila TypeScript
# 3. Runner - Executa aplicação otimizada
```

**Benefícios:**

- ✅ Imagem final pequena (~100MB)
- ✅ Melhor segurança (usuário não-root)
- ✅ Cache otimizado para builds rápidos

### Docker Compose

**Serviços incluídos:**

- **scanitz-api**: API principal
- **nginx**: Proxy reverso (opcional)
- **prometheus**: Monitoramento (profile: monitoring)

## 📡 Endpoints e Portas

| Serviço | Porta  | URL                               | Descrição        |
| ------- | ------ | --------------------------------- | ---------------- |
| API     | 3000   | http://localhost:3000             | API principal    |
| Docs    | 3000   | http://localhost:3000/api/v1/docs | Swagger UI       |
| Health  | 3000   | http://localhost:3000/health      | Health check     |
| Nginx   | 80/443 | http://localhost                  | Proxy (opcional) |

## 🔍 Monitoramento e Logs

### Health Check

```bash
# Verificar saúde da API
curl http://localhost:3000/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### Logs em Tempo Real

```bash
# Logs da API
docker-compose logs -f scanitz-api

# Logs de todos os serviços
docker-compose logs -f

# Logs específicos (últimas 50 linhas)
docker-compose logs --tail=50 scanitz-api
```

## 🛠️ Comandos Úteis

### Gerenciamento de Containers

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Restart de um serviço específico
docker-compose restart scanitz-api

# Rebuild sem cache
docker-compose build --no-cache scanitz-api

# Ver status detalhado
docker-compose ps -a
```

### Limpeza e Manutenção

```bash
# Remover imagens não utilizadas
docker image prune -f

# Limpeza geral do sistema
docker system prune -f

# Ver uso de espaço
docker system df
```

### Debug e Troubleshooting

```bash
# Executar shell dentro do container
docker-compose exec scanitz-api sh

# Verificar variáveis de ambiente
docker-compose exec scanitz-api env

# Testar conectividade
docker-compose exec scanitz-api wget -O- http://localhost:3000/health
```

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ **Usuário não-root**: Container roda como usuário `scanitz`
- ✅ **Variáveis seguras**: Credenciais via environment variables
- ✅ **Health checks**: Monitoramento automático de saúde
- ✅ **Resource limits**: Limites de CPU e memória
- ✅ **Network isolation**: Rede isolada para containers

### NGINX Security Headers

Se usar o proxy NGINX:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- CORS configurado para API

## 🚨 Troubleshooting

### Problemas Comuns

**1. API não responde:**

```bash
# Verificar se container está rodando
docker-compose ps

# Ver logs para erros
docker-compose logs scanitz-api

# Verificar health check
curl http://localhost:3000/health
```

**2. Erro de Firebase:**

```bash
# Verificar se variáveis estão configuradas
docker-compose exec scanitz-api env | grep FIREBASE

# Validar JSON das credenciais
echo $FIREBASE_SERVICE_ACCOUNT | jq .
```

**3. Porta ocupada:**

```bash
# Verificar processo usando a porta
netstat -tulpn | grep :3000

# Mudar porta no .env
echo "PORT=3001" >> .env
docker-compose up -d
```

## 📊 Performance

### Recursos Configurados

```yaml
# Limites por container
limits:
  cpus: "1.0" # 1 CPU core
  memory: 512M # 512MB RAM

reservations:
  cpus: "0.5" # Mínimo 0.5 core
  memory: 256M # Mínimo 256MB
```

### Otimizações

- **Keepalive**: Conexões persistentes
- **Gzip**: Compressão automática
- **Rate limiting**: Proteção contra abuse
- **Cache headers**: Cache inteligente

## 🔄 Deploy em Produção

### Variáveis Adicionais para Produção

```bash
# .env para produção
NODE_ENV=production
PORT=3000

# Configurações de CORS para produção
CORS_ORIGIN=https://seu-dominio.com

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=3600000
```

### Docker Compose Override

Para produção, crie `docker-compose.prod.yml`:

```yaml
version: "3.8"
services:
  scanitz-api:
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
```

Execute com:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📈 Próximos Passos

1. **SSL/HTTPS**: Configurar certificados no NGINX
2. **Load Balancer**: Multiple replicas da API
3. **Monitoring**: Prometheus + Grafana
4. **CI/CD**: GitHub Actions para deploy automático
5. **Backup**: Estratégia de backup dos dados

---

**✅ A API Scanitz está pronta para produção em Docker!**

Use os scripts de deploy para facilitar o processo e sempre monitore os logs para garantir funcionamento correto.
