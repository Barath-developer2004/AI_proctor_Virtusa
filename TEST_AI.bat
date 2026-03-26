@echo off
echo Testing Gemini API Key...
echo.

curl -H "Content-Type: application/json" -d "{\"contents\":[{\"parts\":[{\"text\":\"Hello\"}]}]}" "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs"

pause
