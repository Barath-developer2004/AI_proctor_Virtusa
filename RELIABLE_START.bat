@echo off
echo ========================================
echo Jatayu AI Proctor - Reliable Startup
echo ========================================
echo.

echo [1/5] Checking and stopping any existing processes...
taskkill /F /IM go.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo Done.

echo [2/5] Starting database containers...
docker compose up postgres redis -d
echo Waiting for databases to start...
timeout /t 10 >nul

echo [3/5] Verifying database connection...
docker compose ps
echo.

echo [4/5] Starting backend with Gemini API key...
set GEMINI_API_KEY=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs
cd backend
start "Backend Server" cmd /k "go run ./cmd/server"
echo Backend starting...

echo [5/5] Starting frontend...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"
echo Frontend starting...

echo.
echo ========================================
echo SERVICES STARTING...
echo ========================================
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Wait 30 seconds for all services to fully start
echo Then test: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit...
pause
