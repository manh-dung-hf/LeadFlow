@echo off
title LeadFlow AI - Restarting...
color 0E
echo.
echo  ============================================
echo   LeadFlow AI - Restarting All Services
echo  ============================================
echo.

call "%~dp0stop-all.bat" <nul
timeout /t 3 /nobreak >nul
call "%~dp0start-all.bat"
