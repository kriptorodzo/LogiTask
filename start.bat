@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   LogiTask - Start Script
echo ========================================
echo.

REM Get the directory where the batch file is located
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo [1/4] Installing backend dependencies...
cd /d "%PROJECT_DIR%backend"
call npm install
if errorlevel 1 (
    echo ERROR: Backend npm install failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Running Prisma migrations...
cd /d "%PROJECT_DIR%backend"

REM Check if .env exists and load it
if exist "%PROJECT_DIR%backend\.env" (
    echo Loading environment from .env file...
    for /f "usebackq tokens=1,2 delims==" %%a in ("%PROJECT_DIR%backend\.env") do (
        if not "%%a" == "#" (
            set "%%a=%%b"
        )
    )
)

REM Set default DATABASE_URL if not set
if not defined DATABASE_URL set "DATABASE_URL=file:./dev.db"
echo Using DATABASE_URL: %DATABASE_URL%

call npx prisma migrate dev

echo.
echo [3/4] Seeding database...

REM Set default DATABASE_URL if not set
if not defined DATABASE_URL set "DATABASE_URL=file:./dev.db"
call npm run prisma:seed

echo.
echo [4/4] Starting Backend server...
echo Backend will run on http://localhost:4000
echo Open a new terminal for Frontend
echo.

REM Set default DATABASE_URL if not set
if not defined DATABASE_URL set "DATABASE_URL=file:./dev.db"
start "LogiTask Backend" cmd /k "set DATABASE_URL=%DATABASE_URL% && cd /d \"%PROJECT_DIR%backend\" && npm run start:dev"

cd /d "%PROJECT_DIR%frontend"

echo.
echo ========================================
echo Installing Frontend dependencies...
call npm install

echo.
echo ========================================
echo Starting Frontend server...
echo Frontend will run on http://localhost:3000
echo ========================================
start "LogiTask Frontend" cmd /k "cd /d \"%PROJECT_DIR%frontend\" && npm run dev"

echo.
echo Servers should be starting...
pause
