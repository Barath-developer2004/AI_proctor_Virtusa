@echo off
echo ========================================
echo Testing Gemini API Key Validity
echo ========================================

echo Testing API key with simple request...
curl -s -o response.json "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs"

echo.
echo API Response:
type response.json

echo.
echo If you see error above, the API key is invalid/expired.
echo If you see list of models, API key is valid.
echo.

pause
