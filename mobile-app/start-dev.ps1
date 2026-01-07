#!/usr/bin/env pwsh
# Complete Development Startup Script
# Automatically sets up IP, starts backend, Metro, and runs the app

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Starting Pedicab Complaint System" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Auto-detect and configure IP
Write-Host "[1/5] Configuring network..." -ForegroundColor Cyan
& "$PSScriptRoot\setup-ip.ps1"

if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
    Write-Host "ERROR: IP setup failed!" -ForegroundColor Red
    exit 1
}

# Get the configured IP
$configPath = Join-Path $PSScriptRoot "src\config\index.js"
$configContent = Get-Content $configPath -Raw
$pattern = "const SERVER_IP = '(.+?)'"
if ($configContent -match $pattern) {
    $currentIP = $matches[1]
} else {
    Write-Host "ERROR: Could not read IP from config" -ForegroundColor Red
    exit 1
}

# Set environment variable
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $currentIP

# Step 2: Check if backend is running, if not prompt to start it
Write-Host "[2/5] Checking backend server..." -ForegroundColor Cyan
try {
    $null = Invoke-WebRequest -Uri "http://${currentIP}:5000/api/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Backend server is already running" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend is not running" -ForegroundColor Yellow
    $startBackend = Read-Host "Do you want to start the backend now? (Y/n)"
    
    if ($startBackend -eq '' -or $startBackend -eq 'Y' -or $startBackend -eq 'y') {
        Write-Host "Starting backend server..." -ForegroundColor Cyan
        $backendPath = Join-Path $PSScriptRoot "..\backend"
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start" -WindowStyle Normal
        Write-Host "✓ Backend server started in new window" -ForegroundColor Green
        Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        Write-Host "⚠ Continuing without backend. The app may not work correctly." -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 3: Setup ADB port forwarding
Write-Host "[3/5] Setting up device port forwarding..." -ForegroundColor Cyan
try {
    $devices = adb devices 2>$null | Select-String "device$"
    if ($devices.Count -gt 0) {
        adb reverse tcp:8081 tcp:8081 2>$null
        adb reverse tcp:5000 tcp:5000 2>$null
        Write-Host "✓ Port forwarding configured (8081, 5000)" -ForegroundColor Green
    } else {
        Write-Host "⚠ No Android device connected" -ForegroundColor Yellow
        Write-Host "  Connect your device via USB and enable USB debugging" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not setup port forwarding (is ADB installed?)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Clean and prepare
Write-Host "[4/5] Cleaning cache..." -ForegroundColor Cyan
$cleanCache = Read-Host "Do you want to clean Metro cache? (recommended for first run) (Y/n)"
if ($cleanCache -eq '' -or $cleanCache -eq 'Y' -or $cleanCache -eq 'y') {
    Write-Host "Cleaning Metro bundler cache..." -ForegroundColor Yellow
    Start-Process -NoNewWindow -Wait -FilePath "npx" -ArgumentList "react-native", "start", "--reset-cache", "--port", "8081"
    Start-Sleep -Seconds 2
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Cache cleaned" -ForegroundColor Green
}
Write-Host ""

# Step 5: Run the app
Write-Host "[5/5] Building and installing app..." -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Starting development environment..." -ForegroundColor Green
Write-Host "API URL: http://${currentIP}:5000/api" -ForegroundColor White
Write-Host "Metro URL: http://${currentIP}:8081" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Run npm run android which will start Metro and build the app
npm run android

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Development environment is running!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop Metro bundler" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
