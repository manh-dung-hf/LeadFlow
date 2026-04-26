@echo off
title LeadFlow AI - Starting...
color 0B
echo.
echo  ============================================
echo   LeadFlow AI - Starting All Services
echo  ============================================
echo.

set PROJECT=D:\learning\LeadFlow AI
set BACKEND=%PROJECT%\backend
set FRONTEND=%PROJECT%\frontend
set VENV=%BACKEND%\venv\Scripts
set NGROK=D:\ngrok\ngrok.exe

:: ── 0. Kill old processes ──
echo [0/8] Cleaning old processes...
taskkill /fi "WINDOWTITLE eq LeadFlow-Backend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq LeadFlow-Celery*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq LeadFlow-Frontend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq LeadFlow-Ngrok*" /f >nul 2>&1
taskkill /im ngrok.exe /f >nul 2>&1
timeout /t 2 /nobreak >nul
echo        [OK] Cleaned

:: ── 1. Docker: PostgreSQL + Redis ──
echo [1/8] Starting PostgreSQL + Redis...
docker start leadflow-db leadflow-redis >nul 2>&1
if %errorlevel% neq 0 (
    echo        Creating containers...
    docker run -d --name leadflow-db -p 5433:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=leadflow_db postgres:15 >nul 2>&1
    docker run -d --name leadflow-redis -p 6379:6379 redis:7 >nul 2>&1
)
echo        [OK] PostgreSQL :5433 + Redis :6379
timeout /t 3 /nobreak >nul

:: ── 2. Ollama ──
echo [2/8] Checking Ollama...
curl.exe -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    echo        Starting Ollama...
    start "" "C:\Users\Admin\AppData\Local\Programs\Ollama\ollama.exe" serve
    timeout /t 5 /nobreak >nul
)
echo        [OK] Ollama :11434

:: ── 3. Seed Database ──
echo [3/8] Seeding database...
cd /d "%BACKEND%"
"%VENV%\python.exe" seed.py 2>nul
echo        [OK] Database ready

:: ── 4. Backend ──
echo [4/8] Starting Backend...
start "LeadFlow-Backend" /min cmd /c "cd /d "%BACKEND%" && "%VENV%\python.exe" run.py"
echo        [OK] Backend :5000
timeout /t 4 /nobreak >nul

:: ── 5. Celery Worker ──
echo [5/8] Starting Celery Worker...
start "LeadFlow-Celery" /min cmd /c "cd /d "%BACKEND%" && "%VENV%\celery.exe" -A celery_worker.celery worker --loglevel=info --pool=solo"
echo        [OK] Celery Worker

:: ── 6. Frontend ──
echo [6/8] Starting Frontend...
start "LeadFlow-Frontend" /min cmd /c "cd /d "%FRONTEND%" && npm run dev"
echo        [OK] Frontend :5173

:: ── 7. Ngrok tunnel ──
echo [7/8] Starting Ngrok tunnel...
if not exist "%NGROK%" (
    echo        [!] Ngrok not found at %NGROK%
    echo        Skipping Telegram live webhook.
    goto :skip_ngrok
)
start "LeadFlow-Ngrok" /min cmd /c ""%NGROK%" http 5000"
echo        Waiting for ngrok to start...
timeout /t 5 /nobreak >nul

:: Get ngrok public URL
set NGROK_URL=
for /f "delims=" %%u in ('curl.exe -s http://127.0.0.1:4040/api/tunnels 2^>nul ^| "%VENV%\python.exe" -c "import sys,json; d=json.load(sys.stdin); tunnels=[t for t in d.get('tunnels',[]) if t.get('proto')=='https']; print(tunnels[0]['public_url'] if tunnels else '')" 2^>nul') do set NGROK_URL=%%u

if "%NGROK_URL%"=="" (
    echo        [!] Could not get ngrok URL. Telegram webhook skipped.
    goto :skip_ngrok
)
echo        [OK] Ngrok: %NGROK_URL%

:: ── 8. Set Telegram Webhook ──
echo [8/8] Setting Telegram webhook...
cd /d "%BACKEND%"
for /f "delims=" %%t in ('"%VENV%\python.exe" -c "from app import create_app; from app.extensions import db; from app.models.integration import Integration; app=create_app(); ctx=app.app_context(); ctx.push(); tg=Integration.query.filter_by(name='telegram').first(); print(tg.config.get('token','') if tg and tg.config else '')" 2^>nul') do set BOT_TOKEN=%%t

if "%BOT_TOKEN%"=="" (
    echo        [!] No Telegram bot token. Configure in Settings first.
    goto :skip_ngrok
)

curl.exe -s "https://api.telegram.org/bot%BOT_TOKEN%/setWebhook?url=%NGROK_URL%/api/integrations/webhook/telegram" >nul 2>&1
echo        [OK] Telegram webhook set!
echo.
echo   Telegram Bot: @SaleLieu92bot
echo   Webhook URL:  %NGROK_URL%/api/integrations/webhook/telegram
goto :done

:skip_ngrok
echo.

:done
echo.
echo  ============================================
echo   ALL SERVICES STARTED!
echo  ============================================
echo.
echo   Frontend:   http://localhost:5173
echo   Backend:    http://localhost:5000
echo   Database:   PostgreSQL :5433
echo   Ollama:     http://localhost:11434
if not "%NGROK_URL%"=="" (
echo   Ngrok:      %NGROK_URL%
echo   Telegram:   LIVE - nhan tin @SaleLieu92bot
)
echo.
echo   Login: admin@leadflow.ai / admin123
echo.
echo   De dung tat ca: chay stop-all.bat
echo  ============================================
echo.
pause
