@echo off
title LeadFlow AI - Setup Telegram Live
color 0B
echo.
echo  ============================================
echo   LeadFlow AI - Setup Telegram Live
echo  ============================================
echo.
echo  Buoc nay se:
echo  1. Cai ngrok (tao tunnel public)
echo  2. Tao URL public cho backend
echo  3. Set webhook Telegram bot
echo.
echo  Sau khi xong, bat ky ai nhan tin cho bot
echo  Telegram cua ban se tu dong tao lead.
echo.

set BACKEND=D:\learning\LeadFlow AI\backend
set VENV=%BACKEND%\venv\Scripts

:: Check ngrok
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/3] Cai ngrok...
    echo.
    echo  Tai ngrok tu: https://ngrok.com/download
    echo  Hoac chay: winget install ngrok.ngrok
    echo.
    winget install ngrok.ngrok >nul 2>&1
    if %errorlevel% neq 0 (
        echo  [!] Khong cai duoc tu dong.
        echo  Tai thu cong tai: https://ngrok.com/download
        echo  Giai nen vao C:\ngrok\ roi chay lai script nay.
        pause
        exit /b 1
    )
    echo  [OK] ngrok da cai
) else (
    echo [1/3] ngrok da co san
)

:: Start ngrok
echo [2/3] Tao tunnel public...
echo.
echo  Dang chay: ngrok http 5000
echo  (Cua so ngrok se mo rieng)
echo.
start "ngrok" cmd /c "ngrok http 5000"

echo  Cho 5 giay de ngrok khoi dong...
timeout /t 5 /nobreak >nul

:: Get ngrok URL
echo [3/3] Lay URL va set webhook...
for /f "tokens=*" %%a in ('curl -s http://127.0.0.1:4040/api/tunnels ^| "%VENV%\python.exe" -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])"') do set NGROK_URL=%%a

if "%NGROK_URL%"=="" (
    echo  [!] Khong lay duoc URL ngrok.
    echo  Mo http://127.0.0.1:4040 de xem URL thu cong.
    pause
    exit /b 1
)

echo  Ngrok URL: %NGROK_URL%
echo.

:: Get bot token from DB
for /f "tokens=*" %%t in ('"%VENV%\python.exe" -c "from app import create_app; from app.extensions import db; from app.models.integration import Integration; app=create_app(); ctx=app.app_context(); ctx.push(); tg=Integration.query.filter_by(name='telegram').first(); print(tg.config.get('token','') if tg else '')"') do set BOT_TOKEN=%%t

if "%BOT_TOKEN%"=="" (
    echo  [!] Chua co bot token. Vao Settings ^> Telegram de nhap token.
    pause
    exit /b 1
)

:: Set webhook
echo  Dang set webhook cho Telegram bot...
curl -s "https://api.telegram.org/bot%BOT_TOKEN%/setWebhook?url=%NGROK_URL%/api/integrations/webhook/telegram"
echo.
echo.
echo  ============================================
echo   DONE! Telegram Live da san sang!
echo  ============================================
echo.
echo   Ngrok URL:  %NGROK_URL%
echo   Webhook:    %NGROK_URL%/api/integrations/webhook/telegram
echo.
echo   Bay gio bat ky ai nhan tin cho bot
echo   Telegram cua ban se tu dong tao lead
echo   trong he thong LeadFlow AI.
echo.
echo   De test: Mo Telegram, tim @SaleLieu92bot
echo   va gui tin nhan bat ky.
echo.
echo   [!] KHONG DONG cua so ngrok nay.
echo   Dong ngrok = mat ket noi Telegram.
echo  ============================================
echo.
pause
