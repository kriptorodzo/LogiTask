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
echo [2/4] Running Prisma setup...
cd /d "%PROJECT_DIR%backend"

REM Remove old migrations folder completely if exists (for clean SQLite setup)
if exist "migrations" (
    echo Removing old migrations folder...
    rmdir /s /q migrations 2>nul
)

REM Recreate migration_lock.toml with sqlite (Prisma needs this)
echo provider = "sqlite" > migration_lock.toml

REM Create .env file with default SQLite if not exists
if not exist ".env" (
    echo Creating .env file with SQLite configuration...
    (
        echo DATABASE_URL=file:./dev.db
        echo AUTH_MODE=development
        echo NODE_ENV=development
    ) > .env
)

REM Delete existing dev.db for clean setup
if exist "dev.db" (
    del dev.db 2>nul
)

REM Use prisma db push instead of migrate dev (faster for local dev, no migration files needed)
echo Using DATABASE_URL: file:./dev.db
call npx prisma db push --force-reset

echo.
echo [3/4] Seeding database...
call npx ts-node prisma/seed.ts

echo.
echo [4/4] Starting Backend server...
echo Backend will run on http://localhost:4000
echo Open a new terminal for Frontend
echo.

start "LogiTask Backend" cmd /k "set DATABASE_URL=file:./dev.db && cd /d \"%PROJECT_DIR%backend\" && npm run start:dev"

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
