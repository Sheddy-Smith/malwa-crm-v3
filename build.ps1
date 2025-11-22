# Malwa CRM - Build Script
# Builds Windows installer

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Malwa CRM - Build Script v2.0          " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Clean previous builds
Write-Host "Step 1: Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
    Write-Host "  Removed dist folder" -ForegroundColor Gray
}
if (Test-Path "release") {
    Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue
    Write-Host "  Removed release folder" -ForegroundColor Gray
}
Write-Host "✓ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Build React app
Write-Host "Step 2: Building React application..." -ForegroundColor Yellow
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ React app built successfully" -ForegroundColor Green
Write-Host ""

# Build Windows installer
Write-Host "Step 3: Building Windows installer..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes..." -ForegroundColor Gray
npm run electron:build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Installer build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Windows installer built successfully" -ForegroundColor Green
Write-Host ""

# Show results
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Build Complete! ✓                      " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Build output location:" -ForegroundColor Yellow
Write-Host "  .\release\" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "release") {
    $files = Get-ChildItem -Path "release" -File
    Write-Host "Generated files:" -ForegroundColor Yellow
    foreach ($file in $files) {
        $size = [math]::Round($file.Length / 1MB, 2)
        Write-Host "  $($file.Name) ($size MB)" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "You can now install the application:" -ForegroundColor Yellow
Write-Host "  1. Navigate to the 'release' folder" -ForegroundColor White
Write-Host "  2. Run the .exe installer" -ForegroundColor White
Write-Host "  3. Follow installation wizard" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
