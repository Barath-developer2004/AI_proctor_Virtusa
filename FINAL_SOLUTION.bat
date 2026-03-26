@echo off
echo ==========================================
echo JATAYU PROCTOR - DEFINITIVE SOLUTION
echo ==========================================
echo.

:: Kill any existing processes first
echo [1/5] Stopping any running services...
taskkill /F /IM go.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM jatayu-server.exe >nul 2>&1
echo Done.
echo.

:: Start databases
echo [2/5] Starting PostgreSQL and Redis...
docker compose up postgres redis -d
echo Waiting for databases to be ready...
timeout /t 15 /nobreak >nul
echo Done.
echo.

:: Build backend binary (more stable than go run)
echo [3/5] Building backend binary...
cd backend
go build -o jatayu-server.exe ./cmd/server
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to build backend
    pause
    exit /b 1
)
echo Build successful.
echo.

:: Start backend with environment variable
echo [4/5] Starting backend server...
echo DO NOT CLOSE this window!
start "Jatayu Backend" cmd /k "set GEMINI_API_KEY=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs && jatayu-server.exe"
cd ..
echo Backend started in new window.
echo.

:: Start frontend
echo [5/5] Starting frontend server...
echo DO NOT CLOSE this window!
cd frontend
start "Jatayu Frontend" cmd /k "npm run dev"
cd ..
echo Frontend started in new window.
echo.

echo ==========================================
echo ALL SERVICES STARTED SUCCESSFULLY!
echo ==========================================
echo.
echo NEXT STEPS:
echo 1. Wait 30 seconds for services to fully start
echo 2. Open: http://localhost:3000
echo 3. DO NOT CLOSE the two new windows!
echo 4. Complete MCQ and Coding phases
echo 5. Test Socratic AI
echo.
echo TROUBLESHOOTING:
echo - If Socratic AI still shows 500 error, check the
necho   "Jatayu Backend" window for error messages
echo - Most likely cause: Gemini API key issue or model error
echo.
pause
