# Auto IP Detection and Configuration Script

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Pedicab Complaint System - IP Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get the active WiFi/LAN IP
Write-Host "Detecting current network IP..." -ForegroundColor Green

$allIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike '*Loopback*' -and 
    $_.IPAddress -notlike '169.*'
}

if ($allIPs.Count -eq 0) {
    Write-Host "ERROR: No active network connection found!" -ForegroundColor Red
    exit 1
}

if ($allIPs.Count -gt 1) {
    Write-Host "Multiple network interfaces detected:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $allIPs.Count; $i++) {
        Write-Host "  [$i] $($allIPs[$i].IPAddress) - $($allIPs[$i].InterfaceAlias)" -ForegroundColor White
    }
    $selection = Read-Host "Select the IP to use (default: 0)"
    if ([string]::IsNullOrWhiteSpace($selection)) {
        $selection = 0
    }
    $currentIP = $allIPs[[int]$selection].IPAddress
} else {
    $currentIP = $allIPs[0].IPAddress
}

Write-Host "Detected IP: $currentIP" -ForegroundColor Green
Write-Host ""

# Path to config file
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "src\config\index.js"

if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: Config file not found at $configPath" -ForegroundColor Red
    exit 1
}

# Read and update config
$configContent = Get-Content $configPath -Raw

# Find old IP
if ($configContent -match "const SERVER_IP = '(\d+\.\d+\.\d+\.\d+)'") {
    $oldIP = $matches[1]
    Write-Host "Current config IP: $oldIP" -ForegroundColor Yellow
    
    if ($oldIP -eq $currentIP) {
        Write-Host "IP is already up to date! No changes needed." -ForegroundColor Green
    } else {
        Write-Host "Updating IP from $oldIP to $currentIP..." -ForegroundColor Cyan
        
        # Replace IP in config
        $configContent = $configContent.Replace("const SERVER_IP = '$oldIP'", "const SERVER_IP = '$currentIP'")
        Set-Content -Path $configPath -Value $configContent -NoNewline
        
        Write-Host "Config file updated successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "ERROR: Could not find SERVER_IP in config file" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check backend
Write-Host "Checking backend server..." -ForegroundColor Green
try {
    $null = Invoke-WebRequest -Uri "http://${currentIP}:5000/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Backend server is running!" -ForegroundColor Green
} catch {
    Write-Host "Backend server is NOT running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server IP: $currentIP" -ForegroundColor White
Write-Host "API URL: http://${currentIP}:5000/api" -ForegroundColor White
Write-Host ""

# Set environment variable
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $currentIP
