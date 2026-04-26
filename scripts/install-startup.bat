@echo off
title LeadFlow AI - Install Startup
color 0A
echo.
echo  ============================================
echo   LeadFlow AI - Add to Windows Startup
echo  ============================================
echo.
echo  This will create a shortcut in your Startup
echo  folder so LeadFlow starts when Windows boots.
echo.

set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_PATH=D:\learning\LeadFlow AI\scripts\LeadFlow-Start-Hidden.vbs
set SHORTCUT=%STARTUP%\LeadFlow AI.lnk

:: Create shortcut using PowerShell
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_PATH%\"'; $s.WorkingDirectory = 'D:\learning\LeadFlow AI\scripts'; $s.Description = 'LeadFlow AI - Auto Start'; $s.Save()"

if exist "%SHORTCUT%" (
    echo  [OK] Shortcut created at:
    echo       %SHORTCUT%
    echo.
    echo  LeadFlow AI will auto-start on next boot.
) else (
    echo  [FAIL] Could not create shortcut.
)

echo.
pause
