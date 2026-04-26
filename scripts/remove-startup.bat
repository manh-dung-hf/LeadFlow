@echo off
title LeadFlow AI - Remove Startup
color 0C
echo.
echo  Removing LeadFlow AI from Windows Startup...
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LeadFlow AI.lnk" >nul 2>&1
echo  [OK] Removed.
echo.
pause
