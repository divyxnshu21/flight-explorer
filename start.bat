@echo off
echo Starting FlightDesk...
echo.

REM Start backend (exposed on all interfaces for LAN access)
start "FlightDesk Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment then start frontend
timeout /t 2 /nobreak >nul
start "FlightDesk Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul
start "" http://localhost:5173
echo.
echo FlightDesk is starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo To access from phone (same WiFi), use your PC's local IP:
echo   http://YOUR-LOCAL-IP:5173
echo (run "ipconfig" to find your IPv4 address)
echo.
