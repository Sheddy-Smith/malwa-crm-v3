@echo off
REM Malwa CRM - Quick Windows Installer Builder
REM Simple batch file to build Windows 64-bit installer

echo ============================================
echo   Malwa CRM - Windows Installer Builder
echo   Version: 2.0.0
echo ============================================
echo.

echo [1/3] Building React frontend...
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Building Windows installer...
call npm run electron:build
if errorlevel 1 (
    echo.
    echo ERROR: Installer build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Build complete!
echo.
echo ============================================
echo   SUCCESS! Installer created
echo ============================================
echo.
echo Location: release\Malwa-CRM-Setup-2.0.0-x64.exe
echo.
echo You can now distribute this installer file.
echo.
pause
