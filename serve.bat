@echo off
setlocal
cd /d "%~dp0"
set PORT=8000

where node >nul 2>nul
if not %ERRORLEVEL%==0 (
    echo Node.js not found in PATH. Install from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting local HTTP server on http://localhost:%PORT%/
echo Press Ctrl+C in this window to stop.
echo.

start "" "http://localhost:%PORT%/"
call npx --yes http-server -p %PORT% -c-1 -s .
