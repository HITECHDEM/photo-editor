@echo off
echo Starting Photo Studio Server...
echo.
echo Access your photo editor at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause 