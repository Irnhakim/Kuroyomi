@echo off
title Kuroyomi — Personal Comic Reader
echo.
echo  ██╗  ██╗██╗   ██╗██████╗  ██████╗ ██╗   ██╗ ██████╗ ███╗   ███╗██╗
echo  ██║ ██╔╝██║   ██║██╔══██╗██╔═══██╗╚██╗ ██╔╝██╔═══██╗████╗ ████║██║
echo  █████╔╝ ██║   ██║██████╔╝██║   ██║ ╚████╔╝ ██║   ██║██╔████╔██║██║
echo  ██╔═██╗ ██║   ██║██╔══██╗██║   ██║  ╚██╔╝  ██║   ██║██║╚██╔╝██║██║
echo  ██║  ██╗╚██████╔╝██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║ ╚═╝ ██║██║
echo  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚═╝
echo.
echo  Personal Web Comic Reader — Inspired by Tachiyomi/Suwayomi
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 20+ from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [SETUP] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Setup Prisma DB if not exists
if not exist "server\prisma\dev.db" (
    echo [SETUP] Initializing database...
    cd server
    call npx prisma db push --skip-generate 2>nul
    cd ..
)

echo [INFO] Starting Kuroyomi...
echo [INFO] Frontend: http://localhost:5173
echo [INFO] Backend:  http://localhost:3001
echo.

:: Start both server and client concurrently
call npm run dev
