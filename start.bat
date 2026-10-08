@echo off
title MDV Inventory System

echo ========================================
echo       MDV Inventory System
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Docker containers...
echo.

docker compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start the application.
    echo Make sure Docker Desktop is running.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo       MDV System Started Successfully
echo ========================================
echo.
echo Opening application in your browser...
echo.

timeout /t 3 /nobreak >nul

start http://localhost

exit