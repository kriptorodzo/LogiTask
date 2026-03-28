# LogiTask - Local Setup Script for Windows
# Пуште во PowerShell како администратор

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LogiTask - Local Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectDir = "C:\Users\Win11\OneDrive\Documents\New project\LogiTask-main"

# Провери дали проектот постои
if (!(Test-Path "$ProjectDir\backend")) {
    Write-Host "ERROR: Backend folder not found!" -ForegroundColor Red
    Write-Host "Превземете го проектот од GitHub прво!" -ForegroundColor Yellow
    exit 1
}

# Прашање за Azure AD креденцијали (optional - може да се додадат подоцна)
Write-Host "Azure AD Конфигурација (optional - можете да ги додадете подоцна):" -ForegroundColor Yellow
$clientId = Read-Host "Внесете AZURE_AD_CLIENT_ID (или притиснете Enter за skip)"
$clientSecret = Read-Host "Внесете AZURE_AD_CLIENT_SECRET (или притиснете Enter за skip)"
$tenantId = Read-Host "Внесете AZURE_AD_TENANT_ID (или притиснете Enter за skip)"

# Ако не се внесени, користете placeholder
if ([string]::IsNullOrEmpty($clientId)) { $clientId = "your-azure-client-id" }
if ([string]::IsNullOrEmpty($clientSecret)) { $clientSecret = "your-azure-client-secret" }
if ([string]::IsNullOrEmpty($tenantId)) { $tenantId = "your-azure-tenant-id" }

# 1. Креирај .env фајл за backend
Write-Host "[1/7] Creating backend .env file..." -ForegroundColor Yellow
$envContent = @"
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="logitask-dev-secret-key-12345678901234567890"
AZURE_AD_CLIENT_ID="$clientId"
AZURE_AD_CLIENT_SECRET="$clientSecret"
AZURE_AD_TENANT_ID="$tenantId"
MS_GRAPH_ACCESS_TOKEN=""
"@
Set-Content -Path "$ProjectDir\backend\.env" -Value $envContent -Encoding UTF8

# 2. Креирај .env.local за frontend
Write-Host "[2/7] Creating frontend .env.local file..." -ForegroundColor Yellow
$frontendEnv = @"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=logitask-dev-secret-key-12345678901234567890
AZURE_AD_CLIENT_ID=$clientId
AZURE_AD_CLIENT_SECRET=$clientSecret
AZURE_AD_TENANT_ID=$tenantId
BACKEND_URL=http://localhost:4000
"@
Set-Content -Path "$ProjectDir\frontend\.env.local" -Value $frontendEnv -Encoding UTF8

# 3. Инсталирај backend зависности
Write-Host "[3/7] Installing backend dependencies (npm install)..." -ForegroundColor Yellow
Set-Location "$ProjectDir\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    exit 1
}

# 4. Генерирај Prisma client
Write-Host "[4/7] Generating Prisma client (npx prisma generate)..." -ForegroundColor Yellow
npx prisma generate

# 5. Пушти миграции
Write-Host "[5/7] Running Prisma migrations (npx prisma migrate dev)..." -ForegroundColor Yellow
npx prisma migrate dev

# 6. Инсталирај frontend зависности
Write-Host "[6/7] Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
Set-Location "$ProjectDir\frontend"
npm install

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Серверите се подготвени за стартување!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Терминал 1 (Backend):" -ForegroundColor Yellow
Write-Host "  cd $ProjectDir\backend" 
Write-Host "  npm run start:dev"
Write-Host ""
Write-Host "Терминал 2 (Frontend):" -ForegroundColor Yellow
Write-Host "  cd $ProjectDir\frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Backend: http://localhost:4000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "За повеќе информации, видете го USER_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# П прашање за стартување
$startNow = Read-Host "Дали сакате да го стартувате проектот сега? (Y/N)"
if ($startNow -eq "Y" -or $startNow -eq "y") {
    Write-Host "Стартувам Backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir\backend'; npm run start:dev"
    
    Start-Sleep -Seconds 3
    
    Write-Host "Стартувам Frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir\frontend'; npm run dev"
}
