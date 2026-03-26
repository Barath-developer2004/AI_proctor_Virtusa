@echo off
echo ========================================
echo Jatayu AI Proctor - Startup Script
echo ========================================
echo.

echo [1/4] Checking for processes on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    echo Found process %%a using port 8080, killing it...
    taskkill /F /PID %%a
)

echo.
echo [2/4] Starting PostgreSQL and Redis with Docker...
docker compose up postgres redis -d

echo.
echo [3/4] Waiting for databases to be ready...
timeout /t 5

echo.
echo [4/4] Starting backend server...
cd backend
start "Backend Server" cmd /k "go run ./cmd/server"

echo.
echo Backend starting on http://localhost:8080
echo.
echo ========================================
echo Next steps:
echo 1. Open new terminal
echo 2. Run: cd frontend
echo 3. Run: npm run dev
echo 4. Open: http://localhost:3000
echo ========================================
pause
