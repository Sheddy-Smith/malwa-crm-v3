# Malwa CRM - Installation and Setup Script
# This script automates the complete installation process

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Malwa CRM - Installation Script v2.0   " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Step 1: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Success: Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Recommended: Node.js 20.x LTS" -ForegroundColor Yellow
    exit 1
}

# Check npm installation
try {
    $npmVersion = npm --version
    Write-Host "Success: npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Clean previous installation
Write-Host "Step 2: Cleaning previous installation..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  Removing old node_modules folder..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Write-Host "  Removing old package-lock.json..." -ForegroundColor Gray
    Remove-Item package-lock.json -ErrorAction SilentlyContinue
}
if (Test-Path "dist") {
    Write-Host "  Removing old dist folder..." -ForegroundColor Gray
    Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
}
if (Test-Path "release") {
    Write-Host "  Removing old release folder..." -ForegroundColor Gray
    Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue
}
Write-Host "Success: Cleanup complete" -ForegroundColor Green
Write-Host ""

# Clear npm cache
Write-Host "Step 3: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "Success: npm cache cleared" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Step 4: Installing dependencies..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Success: Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Warning: Standard installation failed!" -ForegroundColor Yellow
    Write-Host "  Trying with --legacy-peer-deps flag..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success: Dependencies installed successfully (legacy mode)" -ForegroundColor Green
    } else {
        Write-Host "Error: Installation failed. Please check errors above." -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Create necessary folders
Write-Host "Step 5: Creating application folders..." -ForegroundColor Yellow
$folders = @(
    "C:\malwa_crm",
    "C:\malwa_crm\Data_Base",
    "C:\malwa_crm\Data_Base\backups",
    "C:\malwa_crm\Documents",
    "C:\malwa_crm\Documents\Customers",
    "C:\malwa_crm\Documents\Suppliers",
    "C:\malwa_crm\Documents\Vendors",
    "C:\malwa_crm\Documents\Labour",
    "C:\malwa_crm\Settings",
    "C:\malwa_crm\Logs",
    "C:\malwa_crm\Templates",
    "C:\malwa_crm\Migrations"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  Created: $folder" -ForegroundColor Gray
    }
}
Write-Host "Success: Application folders created" -ForegroundColor Green
Write-Host ""

# Build application
Write-Host "Step 6: Building application..." -ForegroundColor Yellow
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "Success: Application built successfully" -ForegroundColor Green
} else {
    Write-Host "Error: Build failed! Please check errors above." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Installation complete
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Installation Complete!                 " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To run in development mode (browser):" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To run as desktop application:" -ForegroundColor White
Write-Host "    npm run electron:dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To build Windows installer:" -ForegroundColor White
Write-Host "    npm run electron:build:win" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Application data location:" -ForegroundColor White
Write-Host "    C:\malwa_crm\" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installation script completed successfully!" -ForegroundColor Green
