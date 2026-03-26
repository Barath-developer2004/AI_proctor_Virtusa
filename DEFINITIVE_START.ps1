# Simple PowerShell startup script
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Jatayu AI Proctor - DEFINITIVE STARTUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Step 1: Kill existing processes
Write-Host "`n[1/4] Killing old processes..." -ForegroundColor Yellow
taskkill /F /IM go.exe 2>$null
taskkill /F /IM node.exe 2>$null
Write-Host "Done." -ForegroundColor Green

# Step 2: Start databases
Write-Host "`n[2/4] Starting databases..." -ForegroundColor Yellow
docker compose up postgres redis -d
Start-Sleep -Seconds 10
Write-Host "Done." -ForegroundColor Green

# Step 3: Start backend in new window
Write-Host "`n[3/4] Starting backend..." -ForegroundColor Yellow
$env:GEMINI_API_KEY = "AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:GEMINI_API_KEY='AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs'; go run ./cmd/server" -WindowStyle Normal
Write-Host "Backend starting in new window..." -ForegroundColor Green

# Step 4: Start frontend in new window
Write-Host "`n[4/4] Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal
Write-Host "Frontend starting in new window..." -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "ALL SERVICES STARTING!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nWait 30 seconds, then test:" -ForegroundColor Cyan
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nDO NOT CLOSE the new windows that open!" -ForegroundColor Red
Write-Host "`nPress Enter to close this window..."
Read-Host
