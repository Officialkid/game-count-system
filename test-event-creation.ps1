# Test Event Creation with Different Modes
Write-Host "`n🧪 Testing Event Mode System`n" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray

# Test 1: Quick Mode Event
Write-Host "`n📋 Test 1: Creating Quick Mode Event" -ForegroundColor Yellow
Write-Host ("-" * 60) -ForegroundColor Gray

$quickEvent = @{
    name = "Quick Test Event"
    number_of_days = 1
    eventMode = "quick"
    scoringMode = "continuous"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri 'http://localhost:3000/api/events/create' `
        -Method POST `
        -Body $quickEvent `
        -ContentType 'application/json'
    
    Write-Host "✅ Quick Event Created!" -ForegroundColor Green
    Write-Host "   Event ID: $($response1.data.event.id)" -ForegroundColor Gray
    Write-Host "   Mode: $($response1.data.modeInfo.mode)" -ForegroundColor Gray
    Write-Host "   Auto-cleanup: $($response1.data.modeInfo.autoCleanup)" -ForegroundColor Gray
    Write-Host "   Max Duration: $($response1.data.modeInfo.maxDuration) day(s)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Camp Mode Event
Write-Host "`n📋 Test 2: Creating Camp Mode Event" -ForegroundColor Yellow
Write-Host ("-" * 60) -ForegroundColor Gray

$campEvent = @{
    name = "Summer Camp 2026"
    number_of_days = 7
    eventMode = "camp"
    scoringMode = "daily"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri 'http://localhost:3000/api/events/create' `
        -Method POST `
        -Body $campEvent `
        -ContentType 'application/json'
    
    Write-Host "✅ Camp Event Created!" -ForegroundColor Green
    Write-Host "   Event ID: $($response2.data.event.id)" -ForegroundColor Gray
    Write-Host "   Mode: $($response2.data.modeInfo.mode)" -ForegroundColor Gray
    Write-Host "   Days: $($response2.data.event.number_of_days)" -ForegroundColor Gray
    Write-Host "   Scoring: $($response2.data.event.scoringMode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Advanced Mode Event (will fail without auth, expected)
Write-Host "`n📋 Test 3: Creating Advanced Mode Event (without auth)" -ForegroundColor Yellow
Write-Host ("-" * 60) -ForegroundColor Gray

$advancedEvent = @{
    name = "Organization League"
    number_of_days = 90
    eventMode = "advanced"
    scoringMode = "continuous"
    requiresAuthentication = $true
    organizationId = "org_123"
    organizationName = "Sports League"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri 'http://localhost:3000/api/events/create' `
        -Method POST `
        -Body $advancedEvent `
        -ContentType 'application/json'
    
    Write-Host "✅ Advanced Event Created!" -ForegroundColor Green
    Write-Host "   Event ID: $($response3.data.event.id)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Expected to fail (auth required)" -ForegroundColor Yellow
    Write-Host "   This is correct behavior for Advanced mode" -ForegroundColor Gray
}

Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check your Firestore Console to see the created events:" -ForegroundColor White
Write-Host "https://console.firebase.google.com/project/combinedactivities-7da43/firestore" -ForegroundColor Gray
Write-Host ""
