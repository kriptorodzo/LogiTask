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
set DATABASE_URL=file:./dev.db
call npx prisma migrate dev

echo.
echo [3/4] Seeding database...
call npm run prisma:seed

echo.
echo [4/4] Starting Backend server...
echo Backend will run on http://localhost:4000
echo Open a new terminal for Frontend
echo.
start "LogiTask Backend" cmd /k "cd /d \"%PROJECT_DIR%backend\" && npm run start:dev"

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
