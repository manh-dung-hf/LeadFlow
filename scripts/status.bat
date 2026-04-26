@echo off
title LeadFlow AI - Status
color 0B
echo.
echo  ============================================
echo   LeadFlow AI - Service Status
echo  ============================================
echo.

:: Docker
echo  [Docker]
docker ps --filter "name=leadflow" --format "   {{.Names}}: {{.Status}}" 2>nul
if %errorlevel% neq 0 echo    Docker not running!
echo.

:: Ollama
echo  [Ollama]
curl -s http://localhost:11434 >nul 2>&1
if %errorlevel% equ 0 (
    echo    Ollama: RUNNING
    ollama list 2>nul | findstr /v "NAME" 2>nul
) else (
    echo    Ollama: STOPPED
)
echo.

:: Backend
echo  [Backend]
curl -s http://localhost:5000/api/auth/me >nul 2>&1
if %errorlevel% equ 0 (
    echo    Flask API: RUNNING :5000
) else (
    echo    Flask API: STOPPED
)
echo.

:: Frontend
echo  [Frontend]
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo    Vite Dev: RUNNING :5173
) else (
    echo    Vite Dev: STOPPED
)
echo.

:: Celery
echo  [Celery]
tasklist /fi "WINDOWTITLE eq LeadFlow-Celery*" /fo csv /nh 2>nul | findstr /i "cmd" >nul 2>&1
if %errorlevel% equ 0 (
    echo    Celery Worker: RUNNING
) else (
    echo    Celery Worker: STOPPED
)
echo.
echo  ============================================
pause
