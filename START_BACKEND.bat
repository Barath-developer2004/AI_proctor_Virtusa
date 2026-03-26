@echo off
echo Starting Jatayu Proctor Backend...
echo.

echo Setting Gemini API Key...
set GEMINI_API_KEY=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs

echo Starting server...
cd backend
go run ./cmd/server

pause
