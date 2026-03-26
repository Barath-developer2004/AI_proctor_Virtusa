@echo off
echo ========================================
echo Jatayu AI Proctor - Service Status Check
echo ========================================
echo.

echo [1/4] Checking Database Containers...
docker compose ps
echo.

echo [2/4] Checking Backend Health...
curl -s http://localhost:8080/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is RUNNING on port 8080
) else (
    echo ❌ Backend is NOT running
    echo To fix: Run RELIABLE_START.bat
)
echo.

echo [3/4] Checking Frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is RUNNING on port 3000
) else (
    echo ❌ Frontend is NOT running
    echo To fix: Run RELIABLE_START.bat
)
echo.

echo [4/4] Checking for Port Conflicts...
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Port 8080 is in use (by backend)
) else (
    echo ❌ Port 8080 is free (backend not running)
)

netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Port 3000 is in use (by frontend)
) else (
    echo ❌ Port 3000 is free (frontend not running)
)

echo.
echo ========================================
echo QUICK FIX COMMANDS:
echo ========================================
echo 1. Start everything: RELIABLE_START.bat
echo 2. Check status:    CHECK_SERVICES.bat
echo 3. Kill all:        taskkill /F /IM go.exe && taskkill /F /IM node.exe
echo ========================================
echo.
pause
