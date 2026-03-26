@echo off
echo ==========================================
echo JATAYU AI PROCTOR - FINAL WORKING VERSION
echo ==========================================
echo.
echo This will start all services properly.
echo.
echo STEP 1: Killing any old processes...
taskkill /F /IM go.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8080') DO taskkill /F /PID %%P >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000') DO taskkill /F /PID %%P >nul 2>&1
echo Done.
echo.
echo STEP 2: Starting databases (please wait)...
docker compose up postgres redis -d
timeout /t 10 /nobreak >nul
echo Done.
echo.
echo STEP 3: Starting Backend in NEW WINDOW...
echo DO NOT CLOSE the backend window!
cd backend
start cmd /k "set GEMINI_API_KEY=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs&& go run ./cmd/server"
cd ..
echo Backend starting...
echo.
echo STEP 4: Starting Frontend in NEW WINDOW...
echo DO NOT CLOSE the frontend window!
cd frontend  
start cmd /k "npm run dev"
cd ..
echo Frontend starting...
echo.
echo ==========================================
echo ALL SERVICES STARTED!
echo ==========================================
echo.
echo IMPORTANT INSTRUCTIONS:
echo 1. Wait 30 seconds for everything to start
echo 2. Open http://localhost:3000 in your browser
echo 3. DO NOT CLOSE the two new windows that opened
echo 4. Test the Socratic AI - it should work now
echo.
echo If it still doesn't work, the backend window will
echo show the exact error message. Tell me what it says.
echo.
pause
