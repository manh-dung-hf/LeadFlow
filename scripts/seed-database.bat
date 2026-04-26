@echo off
title LeadFlow AI - Seed Database
color 0A
echo.
echo  ============================================
echo   LeadFlow AI - Seed Database
echo  ============================================
echo.
echo  This will create tables and insert sample data.
echo  Safe to run multiple times (skips existing data).
echo.

set BACKEND=D:\learning\LeadFlow AI\backend
set VENV=%BACKEND%\venv\Scripts

cd /d "%BACKEND%"
"%VENV%\python.exe" seed.py

echo.
pause
