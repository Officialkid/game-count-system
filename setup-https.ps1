# Setup HTTPS for local development
# This script installs mkcert, generates certificates, and configures Next.js

# Step 1: Download mkcert
Write-Host "Step 1: Downloading mkcert..." -ForegroundColor Green
$mkcertPath = "$env:APPDATA\mkcert.exe"
$url = "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe"

# Try direct download
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$webClient = New-Object System.Net.WebClient
$webClient.DownloadFile($url, $mkcertPath)
Write-Host "Downloaded mkcert" -ForegroundColor Green

# Step 2: Install root CA
Write-Host "`nStep 2: Installing root CA..." -ForegroundColor Green
& $mkcertPath -install
Write-Host "Root CA installed" -ForegroundColor Green

# Step 3: Create .cert directory
Write-Host "`nStep 3: Creating .cert directory..." -ForegroundColor Green
$certDir = "$(Get-Location)\.cert"
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}
Write-Host ".cert directory created at $certDir" -ForegroundColor Green

# Step 4: Generate certificates
Write-Host "`nStep 4: Generating certificates..." -ForegroundColor Green
Push-Location $certDir
& $mkcertPath localhost 127.0.0.1
Pop-Location
Write-Host "Certificates generated" -ForegroundColor Green

# Step 5: List generated files
Write-Host "`nStep 5: Certificate files:" -ForegroundColor Green
Get-ChildItem $certDir -Filter "*.pem" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Green
}

Write-Host "`nHTTPS Setup Complete!" -ForegroundColor Green
