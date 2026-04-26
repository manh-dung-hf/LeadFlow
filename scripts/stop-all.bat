@echo off
title LeadFlow AI - Stopping...
color 0C
echo.
echo  ============================================
echo   LeadFlow AI - Stopping All Services
echo  ============================================
echo.

echo [1/5] Stopping Backend...
taskkill /fi "WINDOWTITLE eq LeadFlow-Backend*" /f >nul 2>&1
echo        [OK]

echo [2/5] Stopping Celery...
taskkill /fi "WINDOWTITLE eq LeadFlow-Celery*" /f >nul 2>&1
taskkill /im celery.exe /f >nul 2>&1
echo        [OK]

echo [3/5] Stopping Frontend...
taskkill /fi "WINDOWTITLE eq LeadFlow-Frontend*" /f >nul 2>&1
echo        [OK]

echo [4/5] Stopping Ngrok...
taskkill /fi "WINDOWTITLE eq LeadFlow-Ngrok*" /f >nul 2>&1
taskkill /im ngrok.exe /f >nul 2>&1
echo        [OK]

echo [5/5] Stopping Docker (DB + Redis)...
docker stop leadflow-db leadflow-redis >nul 2>&1
echo        [OK]

echo.
echo  Note: Ollama NOT stopped (shared service).
echo.
echo  ============================================
echo   All LeadFlow services stopped.
echo  ============================================
echo.
pause
