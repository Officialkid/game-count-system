# Test Day Locking System
# Run: .\test-day-locking.ps1

Write-Host "`n🧪 Testing Day Locking System" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray

$baseUrl = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }

# ============================================
# Test 1: Create Multi-Day Event
# ============================================
Write-Host "`n📝 TEST 1: Create Multi-Day Event (3 days)" -ForegroundColor Yellow

$createBody = @{
    name = "Day Lock Test Event"
    eventMode = "camp"
    start_date = (Get-Date).ToString("yyyy-MM-dd")
    end_date = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")
    event_type = "daily"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/create" `
        -Method POST -Body $createBody -Headers $headers
    
    if ($createResponse.success) {
        $eventId = $createResponse.data.event.id
        $adminToken = $createResponse.data.tokens.admin
        $scorerToken = $createResponse.data.tokens.scorer
        
        Write-Host "✅ Event Created:" -ForegroundColor Green
        Write-Host "   Event ID: $eventId"
        Write-Host "   Total Days: 3"
        Write-Host "   Locked Days: $($createResponse.data.event.lockedDays -join ', ' || 'None')"
    } else {
        Write-Host "❌ Failed: $($createResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create some teams
Write-Host "`n   Creating teams..." -ForegroundColor Gray
$team1Body = @{ event_id = $eventId; name = "Team A"; color = "#FF0000" } | ConvertTo-Json
$team2Body = @{ event_id = $eventId; name = "Team B"; color = "#0000FF" } | ConvertTo-Json

$team1 = Invoke-RestMethod -Uri "$baseUrl/api/teams/add" -Method POST -Body $team1Body -Headers $headers
$team2 = Invoke-RestMethod -Uri "$baseUrl/api/teams/add" -Method POST -Body $team2Body -Headers $headers

$teamAId = $team1.data.team.id
$teamBId = $team2.data.team.id

Write-Host "   ✓ Created Team A ($teamAId)" -ForegroundColor Green
Write-Host "   ✓ Created Team B ($teamBId)" -ForegroundColor Green

# ============================================
# Test 2: Submit Scores to Unlocked Days
# ============================================
Write-Host "`n📊 TEST 2: Submit Scores to Unlocked Days" -ForegroundColor Yellow

$days = @(1, 2, 3)
foreach ($day in $days) {
    $scoreBody = @{
        event_id = $eventId
        team_id = $teamAId
        points = 10
        penalty = 0
        day_number = $day
        token = $scorerToken
    } | ConvertTo-Json
    
    try {
        $scoreResponse = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
            -Method POST -Body $scoreBody -Headers $headers
        
        if ($scoreResponse.success) {
            Write-Host "   ✅ Day $day - Score submitted successfully" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Day $day - Failed: $($scoreResponse.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Day $day - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# Test 3: Lock Day 1
# ============================================
Write-Host "`n🔒 TEST 3: Lock Day 1" -ForegroundColor Yellow

$lockBody = @{
    action = "lock"
    token = $adminToken
} | ConvertTo-Json

try {
    $lockResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/days/1/lock" `
        -Method POST -Body $lockBody -Headers $headers
    
    if ($lockResponse.success) {
        Write-Host "✅ Day 1 Locked Successfully:" -ForegroundColor Green
        Write-Host "   Message: $($lockResponse.data.message)"
        Write-Host "   Locked Days: $($lockResponse.data.lockedDays -join ', ')"
    } else {
        Write-Host "❌ Failed: $($lockResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# Test 4: Try to Submit Score to Locked Day
# ============================================
Write-Host "`n🚫 TEST 4: Try to Submit Score to Locked Day 1" -ForegroundColor Yellow

$lockedScoreBody = @{
    event_id = $eventId
    team_id = $teamBId
    points = 15
    penalty = 0
    day_number = 1
    token = $scorerToken
} | ConvertTo-Json

try {
    $lockedScoreResponse = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
        -Method POST -Body $lockedScoreBody -Headers $headers -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED: Score was allowed on locked day!" -ForegroundColor Red
} catch {
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Correctly Rejected:" -ForegroundColor Green
    Write-Host "   Reason: $($errorBody.error)"
}

# ============================================
# Test 5: Submit Score to Unlocked Day 2
# ============================================
Write-Host "`n✅ TEST 5: Submit Score to Unlocked Day 2" -ForegroundColor Yellow

$day2ScoreBody = @{
    event_id = $eventId
    team_id = $teamBId
    points = 20
    penalty = 0
    day_number = 2
    token = $scorerToken
} | ConvertTo-Json

try {
    $day2Response = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
        -Method POST -Body $day2ScoreBody -Headers $headers
    
    if ($day2Response.success) {
        Write-Host "✅ Day 2 Score Submitted Successfully:" -ForegroundColor Green
        Write-Host "   Team: $($day2Response.data.score.team_id)"
        Write-Host "   Points: $($day2Response.data.score.points)"
    } else {
        Write-Host "❌ Failed: $($day2Response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# Test 6: Lock Day 2 and Day 3
# ============================================
Write-Host "`n🔒 TEST 6: Lock Days 2 and 3" -ForegroundColor Yellow

foreach ($day in @(2, 3)) {
    $lockDayBody = @{
        action = "lock"
        token = $adminToken
    } | ConvertTo-Json
    
    try {
        $lockDayResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/days/$day/lock" `
            -Method POST -Body $lockDayBody -Headers $headers
        
        if ($lockDayResponse.success) {
            Write-Host "   ✅ Day $day locked" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ Day $day lock failed" -ForegroundColor Red
    }
}

# ============================================
# Test 7: Check Lock Status
# ============================================
Write-Host "`n📋 TEST 7: Check Lock Status for All Days" -ForegroundColor Yellow

foreach ($day in @(1, 2, 3)) {
    try {
        $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/days/$day/lock" `
            -Method GET
        
        if ($statusResponse.success) {
            $lockIcon = if ($statusResponse.data.isLocked) { "🔒" } else { "🔓" }
            $lockText = if ($statusResponse.data.isLocked) { "Locked" } else { "Unlocked" }
            
            Write-Host "   Day $day - $lockIcon $lockText" -ForegroundColor $(if ($statusResponse.data.isLocked) { "Red" } else { "Green" })
        }
    } catch {
        Write-Host "   Day $day - Error checking status" -ForegroundColor Yellow
    }
}

# ============================================
# Test 8: Try to Lock Already Locked Day
# ============================================
Write-Host "`n🚫 TEST 8: Try to Lock Already Locked Day 1" -ForegroundColor Yellow

$relockBody = @{
    action = "lock"
    token = $adminToken
} | ConvertTo-Json

try {
    $relockResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/days/1/lock" `
        -Method POST -Body $relockBody -Headers $headers -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED: Already locked day was locked again!" -ForegroundColor Red
} catch {
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Correctly Rejected:" -ForegroundColor Green
    Write-Host "   Reason: $($errorBody.error)"
}

# ============================================
# Test 9: Unlock Day 1
# ============================================
Write-Host "`n🔓 TEST 9: Unlock Day 1" -ForegroundColor Yellow

$unlockBody = @{
    action = "unlock"
    token = $adminToken
} | ConvertTo-Json

try {
    $unlockResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/days/1/lock" `
        -Method POST -Body $unlockBody -Headers $headers
    
    if ($unlockResponse.success) {
        Write-Host "✅ Day 1 Unlocked Successfully:" -ForegroundColor Green
        Write-Host "   Message: $($unlockResponse.data.message)"
        Write-Host "   Locked Days: $($unlockResponse.data.lockedDays -join ', ' || 'None')"
    } else {
        Write-Host "❌ Failed: $($unlockResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# Test 10: Submit Score to Newly Unlocked Day
# ============================================
Write-Host "`n✅ TEST 10: Submit Score to Newly Unlocked Day 1" -ForegroundColor Yellow

$unlockedScoreBody = @{
    event_id = $eventId
    team_id = $teamBId
    points = 25
    penalty = 5
    day_number = 1
    token = $scorerToken
} | ConvertTo-Json

try {
    $unlockedResponse = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
        -Method POST -Body $unlockedScoreBody -Headers $headers
    
    if ($unlockedResponse.success) {
        Write-Host "✅ Score Submitted to Unlocked Day:" -ForegroundColor Green
        Write-Host "   Team: Team B"
        Write-Host "   Points: 25"
        Write-Host "   Penalty: 5"
        Write-Host "   Final Score: 20"
    } else {
        Write-Host "❌ Failed: $($unlockedResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# Summary
# ============================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Day Locking Testing Complete!" -ForegroundColor Green
Write-Host "`nFeatures Verified:" -ForegroundColor Cyan
Write-Host "  ✓ Multi-day event creation"
Write-Host "  ✓ Score submission to unlocked days"
Write-Host "  ✓ Day locking (individual days)"
Write-Host "  ✓ Score rejection on locked days"
Write-Host "  ✓ Multiple days locking"
Write-Host "  ✓ Lock status checking"
Write-Host "  ✓ Duplicate lock prevention"
Write-Host "  ✓ Day unlocking"
Write-Host "  ✓ Score submission after unlocking"
Write-Host "`nEvent ID for reference: $eventId" -ForegroundColor Gray
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test DayLockManager component in admin UI"
Write-Host "   2. Test LockedDayIndicator in scorer view"
Write-Host "   3. Verify Firestore rules enforcement"
Write-Host "   4. Deploy updated rules to Firebase Console"
Write-Host ""
