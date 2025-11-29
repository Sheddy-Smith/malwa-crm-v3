#!/usr/bin/env pwsh
# Malwa CRM - Windows Installer Build Script
# Builds a production-ready Windows 64-bit installer

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Malwa CRM - Windows Installer Builder" -ForegroundColor Cyan
Write-Host "  Version: 2.0.0" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous builds
Write-Host "[1/6] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "  ✓ Removed dist folder" -ForegroundColor Green
}
if (Test-Path "release") {
    Remove-Item -Recurse -Force "release"
    Write-Host "  ✓ Removed release folder" -ForegroundColor Green
}
Write-Host ""

# Step 2: Install/Update dependencies
Write-Host "[2/6] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing dependencies..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "  ✓ Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Build React frontend
Write-Host "[3/6] Building React frontend with Vite..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Frontend build completed" -ForegroundColor Green
Write-Host ""

# Step 4: Verify build output
Write-Host "[4/6] Verifying build output..." -ForegroundColor Yellow
if (-not (Test-Path "dist/index.html")) {
    Write-Host "  ✗ Build verification failed - index.html not found!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build verification passed" -ForegroundColor Green
Write-Host ""

# Step 5: Build Windows installer
Write-Host "[5/6] Building Windows 64-bit installer..." -ForegroundColor Yellow
Write-Host "  This may take several minutes..." -ForegroundColor Cyan
npm run build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Installer build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Installer build completed" -ForegroundColor Green
Write-Host ""

# Step 6: Display results
Write-Host "[6/6] Build Summary" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✓ BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# List generated files
if (Test-Path "release") {
    Write-Host "Generated Files:" -ForegroundColor Cyan
    Write-Host ""
    Get-ChildItem -Path "release" -File | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  📦 $($_.Name)" -ForegroundColor White
        Write-Host "     Size: $size MB" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Find the installer
    $installer = Get-ChildItem -Path "release" -Filter "Malwa-CRM-Setup-*.exe" | Select-Object -First 1
    if ($installer) {
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "  INSTALLER READY!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  📍 Location: release\$($installer.Name)" -ForegroundColor Yellow
        Write-Host "  📏 Size: $([math]::Round($installer.Length / 1MB, 2)) MB" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  To install:" -ForegroundColor White
        Write-Host "  1. Run: release\$($installer.Name)" -ForegroundColor Gray
        Write-Host "  2. Follow installation wizard" -ForegroundColor Gray
        Write-Host "  3. Data will be stored in: C:\malwa-crm\Data_base\" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "  ✗ Release folder not found!" -ForegroundColor Red
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
