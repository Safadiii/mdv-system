@echo off
title MDV Inventory System

echo ========================================
echo       MDV Inventory System
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Docker Desktop...
echo.

start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo Waiting for Docker Engine to start...
echo.

:wait_for_docker
docker info >nul 2>&1

if %errorlevel% neq 0 (
    echo Docker is not ready yet...
    timeout /t 2 /nobreak >nul
    goto wait_for_docker
)

echo Docker Engine is ready!
echo.

echo Starting Docker containers...
echo.

docker compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start the application.
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