# API Test Script for Windows PowerShell
# Builds the API server if needed, starts it on port 3000, runs the API tests, then stops the server.

$root = $PSScriptRoot
$apiDir = Join-Path $root "api-server"

if (-not (Test-Path (Join-Path $apiDir "dist\server.js"))) {
    Write-Host "Building API server..." -ForegroundColor Green
    Push-Location $apiDir
    npm run build
    $buildExit = $LASTEXITCODE
    Pop-Location
    if ($buildExit -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting API server on port 3000..." -ForegroundColor Green
$env:PORT = "3000"
# Run node directly so the process stopped below is the server itself
$serverProcess = Start-Process -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory $apiDir -NoNewWindow -PassThru

$testExit = 1
try {
    # Wait until the server answers its health check
    $ready = $false
    for ($i = 0; $i -lt 30 -and -not $ready; $i++) {
        try {
            Invoke-WebRequest -UseBasicParsing "http://localhost:3000/health" -TimeoutSec 2 | Out-Null
            $ready = $true
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $ready) {
        Write-Host "API server did not become ready on port 3000" -ForegroundColor Red
        exit 1
    }

    Write-Host "Running API tests..." -ForegroundColor Green
    Push-Location $root
    npm run test:api
    $testExit = $LASTEXITCODE
    Pop-Location
} finally {
    Write-Host "Stopping API server..." -ForegroundColor Green
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "Test run complete!" -ForegroundColor Green
exit $testExit
