@echo off
REM Script de deploy da Scanitz API para Windows
REM Automatiza o processo de build e deploy usando Docker

echo 🚀 Iniciando deploy da Scanitz API...

REM Verificar se .env existe
if not exist ".env" (
    echo [ERROR] Arquivo .env não encontrado!
    echo [INFO] Copiando template para .env...
    copy .env.template .env
    echo [WARN] Configure suas variáveis no arquivo .env antes de continuar.
    pause
    exit /b 1
)

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker não está rodando! Inicie o Docker e tente novamente.
    pause
    exit /b 1
)

REM Parar containers existentes
echo [INFO] Parando containers existentes...
docker-compose down --remove-orphans

REM Limpar imagens antigas (opcional)
set /p clean="Deseja remover imagens antigas para economizar espaço? [y/N]: "
if /i "%clean%"=="y" (
    echo [INFO] Removendo imagens antigas...
    docker system prune -f
    docker image prune -f
)

REM Build da nova imagem
echo [INFO] Construindo nova imagem da API...
docker-compose build --no-cache scanitz-api

REM Subir os serviços
echo [INFO] Iniciando serviços...
docker-compose up -d scanitz-api

REM Aguardar API ficar disponível
echo [INFO] Aguardando API ficar disponível...
timeout /t 10 /nobreak >nul

REM Verificar se API está respondendo
for /l %%i in (1,1,15) do (
    curl -f -s "http://localhost:3000/health" >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] ✅ API está respondendo!
        goto :healthy
    )
    echo Tentativa %%i/15...
    timeout /t 2 /nobreak >nul
)

echo [ERROR] ❌ API não respondeu após 30 segundos
echo [INFO] Verificando logs...
docker-compose logs --tail=50 scanitz-api
pause
exit /b 1

:healthy
REM Mostrar status dos containers
echo [INFO] Status dos containers:
docker-compose ps

REM Mostrar informações de acesso
echo.
echo 🎉 Deploy concluído com sucesso!
echo.
echo 📡 API disponível em: http://localhost:3000
echo 📚 Documentação: http://localhost:3000/api/v1/docs
echo ❤️  Health Check: http://localhost:3000/health
echo.
echo 📋 Comandos úteis:
echo   - Ver logs: docker-compose logs -f scanitz-api
echo   - Parar API: docker-compose down
echo   - Restart: docker-compose restart scanitz-api
echo.

REM Opcional: rodar testes básicos
set /p test="Deseja executar testes básicos da API? [Y/n]: "
if /i not "%test%"=="n" (
    echo [INFO] Executando testes básicos...
    
    REM Teste do endpoint raiz
    curl -f -s "http://localhost:3000/" >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] ✅ Endpoint raiz: OK
    ) else (
        echo [ERROR] ❌ Endpoint raiz: FALHOU
    )
    
    REM Teste do Swagger
    curl -f -s "http://localhost:3000/api/v1/docs" >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] ✅ Documentação Swagger: OK
    ) else (
        echo [ERROR] ❌ Documentação Swagger: FALHOU
    )
    
    REM Teste de um endpoint da API
    curl -f -s "http://localhost:3000/api/v1/complaints/positions" >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] ✅ Endpoint de denúncias: OK
    ) else (
        echo [WARN] ⚠️  Endpoint de denúncias: FALHOU ^(pode ser normal se não houver dados^)
    )
    
    echo.
    echo [INFO] Testes concluídos!
)

echo 🎯 Deploy finalizado! A API Scanitz está pronta para uso.
pause