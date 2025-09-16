#!/bin/bash

# Script de deploy da Scanitz API
# Automatiza o processo de build e deploy usando Docker

set -e

echo "🚀 Iniciando deploy da Scanitz API..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para logs
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se .env existe
if [ ! -f ".env" ]; then
    log_error "Arquivo .env não encontrado!"
    log_info "Copie o arquivo .env.template para .env e configure suas variáveis"
    cp .env.template .env
    log_warn "Arquivo .env criado a partir do template. Configure suas variáveis antes de continuar."
    exit 1
fi

# Carregar variáveis do .env
export $(grep -v '^#' .env | xargs)

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    log_error "Docker não está rodando! Inicie o Docker e tente novamente."
    exit 1
fi

# Parar containers existentes
log_info "Parando containers existentes..."
docker-compose down --remove-orphans || true

# Limpar imagens antigas (opcional)
read -p "Deseja remover imagens antigas para economizar espaço? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Removendo imagens antigas..."
    docker system prune -f
    docker image prune -f
fi

# Build da nova imagem
log_info "Construindo nova imagem da API..."
docker-compose build --no-cache scanitz-api

# Subir os serviços
log_info "Iniciando serviços..."
docker-compose up -d scanitz-api

# Aguardar API ficar disponível
log_info "Aguardando API ficar disponível..."
for i in {1..30}; do
    if curl -f -s "http://localhost:${PORT:-3000}/health" > /dev/null; then
        log_info "✅ API está respondendo!"
        break
    fi
    echo -n "."
    sleep 2
done

# Verificar se API está healthy
HEALTH_CHECK=$(curl -s "http://localhost:${PORT:-3000}/health" | grep -o '"status":"healthy"' || echo "")
if [ -n "$HEALTH_CHECK" ]; then
    log_info "✅ Health check passou!"
else
    log_error "❌ Health check falhou!"
    log_info "Verificando logs..."
    docker-compose logs --tail=50 scanitz-api
    exit 1
fi

# Mostrar status dos containers
log_info "Status dos containers:"
docker-compose ps

# Mostrar informações de acesso
echo ""
log_info "🎉 Deploy concluído com sucesso!"
echo ""
echo "📡 API disponível em: http://localhost:${PORT:-3000}"
echo "📚 Documentação: http://localhost:${PORT:-3000}/api/v1/docs"
echo "❤️  Health Check: http://localhost:${PORT:-3000}/health"
echo ""
echo "📋 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f scanitz-api"
echo "  - Parar API: docker-compose down"
echo "  - Restart: docker-compose restart scanitz-api"
echo ""

# Opcional: rodar testes básicos
read -p "Deseja executar testes básicos da API? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    log_info "Executando testes básicos..."
    
    # Teste do endpoint raiz
    if curl -f -s "http://localhost:${PORT:-3000}/" > /dev/null; then
        log_info "✅ Endpoint raiz: OK"
    else
        log_error "❌ Endpoint raiz: FALHOU"
    fi
    
    # Teste do Swagger
    if curl -f -s "http://localhost:${PORT:-3000}/api/v1/docs" > /dev/null; then
        log_info "✅ Documentação Swagger: OK"
    else
        log_error "❌ Documentação Swagger: FALHOU"
    fi
    
    # Teste de um endpoint da API
    if curl -f -s "http://localhost:${PORT:-3000}/api/v1/complaints/positions" > /dev/null; then
        log_info "✅ Endpoint de denúncias: OK"
    else
        log_warn "⚠️  Endpoint de denúncias: FALHOU (pode ser normal se não houver dados)"
    fi
    
    echo ""
    log_info "Testes concluídos!"
fi

log_info "🎯 Deploy finalizado! A API Scanitz está pronta para uso."