# Test Event Creation with Different Modes
Write-Host ""
Write-Host "Testing Event Mode System" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

# Test 1: Quick Mode Event
Write-Host ""
Write-Host "Test 1: Creating Quick Mode Event" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Gray

$quickEvent = @{
    name = "Quick Test Event"
    number_of_days = 1
    eventMode = "quick"
    scoringMode = "continuous"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri 'http://localhost:3000/api/events/create' -Method POST -Body $quickEvent -ContentType 'application/json'
    
    Write-Host "SUCCESS: Quick Event Created!" -ForegroundColor Green
    Write-Host "Event ID: $($response1.data.event.id)" -ForegroundColor Gray
    Write-Host "Mode: $($response1.data.modeInfo.mode)" -ForegroundColor Gray
    Write-Host "Auto-cleanup: $($response1.data.modeInfo.autoCleanup)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Camp Mode Event
Write-Host ""
Write-Host "Test 2: Creating Camp Mode Event" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Gray

$campEvent = @{
    name = "Summer Camp 2026"
    number_of_days = 7
    eventMode = "camp"
    scoringMode = "daily"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri 'http://localhost:3000/api/events/create' -Method POST -Body $campEvent -ContentType 'application/json'
    
    Write-Host "SUCCESS: Camp Event Created!" -ForegroundColor Green
    Write-Host "Event ID: $($response2.data.event.id)" -ForegroundColor Gray
    Write-Host "Days: $($response2.data.event.number_of_days)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check Firebase Console:" -ForegroundColor White
Write-Host "https://console.firebase.google.com/project/combinedactivities-7da43/firestore" -ForegroundColor Cyan
Write-Host ""
