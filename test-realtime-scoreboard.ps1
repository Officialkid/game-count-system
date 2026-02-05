# Test Real-Time Scoreboard Updates (CRITICAL FIX #7)
# Tests Firebase onSnapshot() real-time updates
# Run: .\test-realtime-scoreboard.ps1

Write-Host "`n🔴 Testing Real-Time Scoreboard Updates" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray

$baseUrl = "http://localhost:3000"

# ============================================
# TEST 1: Create Event with Quick Create
# ============================================
Write-Host "`n📝 TEST 1: Create Event via Quick Create" -ForegroundColor Yellow

$createBody = @{
    name = "Real-Time Test Event"
    numberOfDays = 1
    teamNames = "Lightning, Thunder, Storm"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/events/quick-create" `
        -Method POST -Body $createBody -ContentType "application/json"
    
    if ($response.success) {
        $eventId = $response.event.id
        $adminToken = $response.tokens.admin_token
        $scorerToken = $response.tokens.scorer_token
        $viewerToken = $response.tokens.viewer_token
        $teams = $response.teams
        
        Write-Host "✅ Event Created:" -ForegroundColor Green
        Write-Host "   Event ID: $eventId"
        Write-Host "   Event Name: $($response.event.name)"
        Write-Host "   Teams: $($teams.Count)"
        Write-Host "   Viewer Link: $baseUrl/scoreboard/$viewerToken"
        Write-Host ""
        Write-Host "🌐 OPEN THIS URL IN A BROWSER:" -ForegroundColor Cyan
        Write-Host "   $baseUrl/scoreboard/$viewerToken" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Failed: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================
# TEST 2: Wait for Browser
# ============================================
Write-Host "⏸️  STEP 2: Open Scoreboard in Browser" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Copy the URL above" -ForegroundColor Gray
Write-Host "   2. Open it in your browser" -ForegroundColor Gray
Write-Host "   3. You should see:" -ForegroundColor Gray
Write-Host "      - Green 'LIVE' badge pulsing" -ForegroundColor Green
Write-Host "      - 3 teams (Lightning, Thunder, Storm)" -ForegroundColor Gray
Write-Host "      - 0 points for each team" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter when ready to continue"

# ============================================
# TEST 3: Submit Score #1 - Watch Real-Time Update
# ============================================
Write-Host "`n📊 TEST 3: Submit Score #1 (Lightning +10)" -ForegroundColor Yellow

$score1 = @{
    eventId = $eventId
    teamId = $teams[0].id
    points = 10
    penalty = 0
    token = $scorerToken
} | ConvertTo-Json

try {
    $scoreResponse = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
        -Method POST -Body $score1 -ContentType "application/json"
    
    if ($scoreResponse.success) {
        Write-Host "✅ Score Submitted!" -ForegroundColor Green
        Write-Host "   Team: Lightning" -ForegroundColor White
        Write-Host "   Points: +10" -ForegroundColor Green
        Write-Host ""
        Write-Host "👀 WATCH YOUR BROWSER - Score should appear within 2 seconds!" -ForegroundColor Cyan
        Write-Host "   - Lightning should now have 10 points" -ForegroundColor Gray
        Write-Host "   - Team card should briefly highlight in green" -ForegroundColor Gray
        Write-Host "   - Score should appear in Recent Activity" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# ============================================
# TEST 4: Submit Score #2 - Another Team
# ============================================
Write-Host "`n📊 TEST 4: Submit Score #2 (Thunder +15)" -ForegroundColor Yellow

$score2 = @{
    eventId = $eventId
    teamId = $teams[1].id
    points = 15
    penalty = 0
    token = $scorerToken
} | ConvertTo-Json

try {
    $scoreResponse = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
        -Method POST -Body $score2 -ContentType "application/json"
    
    if ($scoreResponse.success) {
        Write-Host "✅ Score Submitted!" -ForegroundColor Green
        Write-Host "   Team: Thunder" -ForegroundColor White
        Write-Host "   Points: +15" -ForegroundColor Green
        Write-Host ""
        Write-Host "👀 WATCH FOR RANK CHANGE!" -ForegroundColor Cyan
        Write-Host "   - Thunder should jump to #1 (15 points)" -ForegroundColor Gray
        Write-Host "   - Lightning drops to #2 (10 points)" -ForegroundColor Gray
        Write-Host "   - Rank indicators should animate (↑↓)" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# ============================================
# TEST 5: Rapid Fire Scores
# ============================================
Write-Host "`n🚀 TEST 5: Rapid Fire - 5 Quick Scores" -ForegroundColor Yellow

$rapidScores = @(
    @{ team = 2; points = 5; name = "Storm" },
    @{ team = 0; points = 8; name = "Lightning" },
    @{ team = 1; points = 3; name = "Thunder" },
    @{ team = 2; points = 12; name = "Storm" },
    @{ team = 0; points = 7; name = "Lightning" }
)

Write-Host "Submitting 5 scores in rapid succession..." -ForegroundColor Gray
Write-Host ""

foreach ($rapidScore in $rapidScores) {
    $scoreBody = @{
        eventId = $eventId
        teamId = $teams[$rapidScore.team].id
        points = $rapidScore.points
        penalty = 0
        token = $scorerToken
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
            -Method POST -Body $scoreBody -ContentType "application/json"
        
        Write-Host "   ✓ $($rapidScore.name): +$($rapidScore.points)" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ $($rapidScore.name): FAILED" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "👀 WATCH THE SCOREBOARD!" -ForegroundColor Cyan
Write-Host "   - All 5 scores should appear in real-time" -ForegroundColor Gray
Write-Host "   - Rankings should update automatically" -ForegroundColor Gray
Write-Host "   - Recent Activity should show all scores" -ForegroundColor Gray
Write-Host "   - Highlights should animate for each change" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 4

# ============================================
# TEST 6: Current Standings
# ============================================
Write-Host "`n📊 TEST 6: Current Standings" -ForegroundColor Yellow

$currentStandings = @{
    "Lightning" = 10 + 8 + 7
    "Thunder" = 15 + 3
    "Storm" = 5 + 12
}

Write-Host "Expected Final Scores:" -ForegroundColor White
Write-Host "   #1: Lightning - 25 points" -ForegroundColor Green
Write-Host "   #2: Thunder - 18 points" -ForegroundColor Yellow
Write-Host "   #3: Storm - 17 points" -ForegroundColor Gray
Write-Host ""
Write-Host "👀 Verify these match your browser!" -ForegroundColor Cyan
Write-Host ""

# ============================================
# TEST 7: Test Connection Indicator
# ============================================
Write-Host "`n🔌 TEST 7: Live Indicator Status" -ForegroundColor Yellow
Write-Host ""
Write-Host "Check your browser for:" -ForegroundColor White
Write-Host "   ✓ Green pulsing 'LIVE' badge in header" -ForegroundColor Green
Write-Host "   ✓ Live Indicator showing 'Connected'" -ForegroundColor Green
Write-Host "   ✓ Last update timestamp (should be recent)" -ForegroundColor Gray
Write-Host ""

# ============================================
# TEST 8: Test Penalty Score
# ============================================
Write-Host "`n⚠️  TEST 8: Submit Score with Penalty" -ForegroundColor Yellow

$penaltyScore = @{
    eventId = $eventId
    teamId = $teams[2].id
    points = 20
    penalty = 5
    token = $scorerToken
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/scores/submit" `
        -Method POST -Body $penaltyScore -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Penalty Score Submitted!" -ForegroundColor Green
        Write-Host "   Team: Storm" -ForegroundColor White
        Write-Host "   Points: +20" -ForegroundColor Green
        Write-Host "   Penalty: -5" -ForegroundColor Red
        Write-Host "   Final: +15" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "👀 WATCH FOR:" -ForegroundColor Cyan
        Write-Host "   - Storm jumps to #1 with 32 points" -ForegroundColor Gray
        Write-Host "   - Penalty shown in Recent Activity" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# ============================================
# FINAL SUMMARY
# ============================================
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Real-Time Testing Complete!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""
Write-Host "Features Tested:" -ForegroundColor Cyan
Write-Host "  ✓ Real-time score updates (< 2 seconds)" -ForegroundColor Green
Write-Host "  ✓ Live indicator with connection status" -ForegroundColor Green
Write-Host "  ✓ Animated highlights when scores change" -ForegroundColor Green
Write-Host "  ✓ Rank change animations (↑↓)" -ForegroundColor Green
Write-Host "  ✓ Recent activity feed" -ForegroundColor Green
Write-Host "  ✓ Rapid-fire score handling" -ForegroundColor Green
Write-Host "  ✓ Penalty score display" -ForegroundColor Green
Write-Host "  ✓ Automatic team ranking" -ForegroundColor Green
Write-Host ""
Write-Host "Final Standings (verify in browser):" -ForegroundColor Yellow
Write-Host "  #1: Storm - 32 points (17 + 15)" -ForegroundColor White
Write-Host "  #2: Lightning - 25 points (10 + 8 + 7)" -ForegroundColor White
Write-Host "  #3: Thunder - 18 points (15 + 3)" -ForegroundColor White
Write-Host ""
Write-Host "💡 To Test Connection Loss:" -ForegroundColor Cyan
Write-Host "   1. Turn off WiFi/disconnect internet" -ForegroundColor Gray
Write-Host "   2. Watch indicator turn red/yellow" -ForegroundColor Gray
Write-Host "   3. Reconnect internet" -ForegroundColor Gray
Write-Host "   4. Watch it turn green and catch up" -ForegroundColor Gray
Write-Host ""
Write-Host "Event ID: $eventId" -ForegroundColor Gray
Write-Host "Scoreboard URL: $baseUrl/scoreboard/$viewerToken" -ForegroundColor Gray
Write-Host ""
