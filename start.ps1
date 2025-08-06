Write-Host "Starting Photo Studio Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Access your photo editor at: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    python -m http.server 8000
} catch {
    Write-Host "Error: Python not found or server failed to start" -ForegroundColor Red
    Write-Host "Make sure Python is installed and in your PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
} 