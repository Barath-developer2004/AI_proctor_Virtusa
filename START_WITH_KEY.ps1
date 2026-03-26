# Set environment variable for this session
$env:GEMINI_API_KEY="AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs"

# Change to backend directory
cd backend

# Start the server
Write-Host "🚀 Starting Jatayu Proctor with Gemini API Key..."
Write-Host "Backend will be available at: http://localhost:8080"
Write-Host "Gemini API Key: [SET]"
Write-Host ""

go run ./cmd/server
