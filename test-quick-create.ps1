# Quick Create Flow Test Script
# Tests the one-click event creation flow
# Run: .\test-quick-create.ps1

Write-Host "`n🚀 Testing Quick Event Creation Flow" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray

$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api/events/quick-create"

# Test results tracking
$testsPassed = 0
$testsFailed = 0

function Test-QuickCreate {
    param(
        [string]$TestName,
        [hashtable]$Body,
        [int]$ExpectedStatus = 201,
        [bool]$ShouldSucceed = $true
    )
    
    Write-Host "`n📝 TEST: $TestName" -ForegroundColor Yellow
    
    try {
        $jsonBody = $Body | ConvertTo-Json -Compress
        
        $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
            -Body $jsonBody `
            -ContentType "application/json" `
            -UseBasicParsing -ErrorAction SilentlyContinue
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($response.StatusCode -eq $ExpectedStatus -and $data.success -eq $ShouldSucceed) {
            Write-Host "   ✓ PASSED" -ForegroundColor Green
            
            if ($data.success) {
                Write-Host "   Event ID: $($data.event.id)" -ForegroundColor Gray
                Write-Host "   Event Name: $($data.event.name)" -ForegroundColor Gray
                Write-Host "   Teams Created: $($data.teams.Count)" -ForegroundColor Gray
                Write-Host "   Admin Link: $($data.links.admin)" -ForegroundColor Gray
                
                # Return event data for further testing
                return $data
            }
            
            $script:testsPassed++
        } else {
            Write-Host "   ✗ FAILED" -ForegroundColor Red
            Write-Host "   Expected Status: $ExpectedStatus, Got: $($response.StatusCode)" -ForegroundColor Red
            $script:testsFailed++
        }
        
    } catch {
        if ($ShouldSucceed) {
            Write-Host "   ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $script:testsFailed++
        } else {
            Write-Host "   ✓ PASSED (Expected failure)" -ForegroundColor Green
            $script:testsPassed++
        }
    }
}

function Test-LinkAccessibility {
    param(
        [string]$LinkName,
        [string]$Url
    )
    
    Write-Host "`n🔗 Testing $LinkName accessibility..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✓ $LinkName is accessible" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "   ✗ $LinkName returned status: $($response.StatusCode)" -ForegroundColor Red
            $script:testsFailed++
        }
    } catch {
        Write-Host "   ✗ Failed to access $LinkName : $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "Starting Quick Create Tests..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# ============================================
# TEST 1: Create Quick Event with Teams
# ============================================
$event1 = Test-QuickCreate -TestName "Create Quick Event with Teams" -Body @{
    name = "Summer Games 2026"
    numberOfDays = 1
    teamNames = "Team Red, Team Blue, Team Green, Team Yellow"
}

Start-Sleep -Seconds 1

# ============================================
# TEST 2: Create Quick Event without Teams
# ============================================
$event2 = Test-QuickCreate -TestName "Create Quick Event without Teams" -Body @{
    name = "Basketball Tournament"
    numberOfDays = 1
    teamNames = ""
}

Start-Sleep -Seconds 1

# ============================================
# TEST 3: Create 2-Day Quick Event
# ============================================
$event3 = Test-QuickCreate -TestName "Create 2-Day Quick Event" -Body @{
    name = "Weekend Camp Games"
    numberOfDays = 2
    teamNames = "Eagles, Hawks, Falcons"
}

Start-Sleep -Seconds 1

# ============================================
# TEST 4: Create 3-Day Quick Event
# ============================================
$event4 = Test-QuickCreate -TestName "Create 3-Day Quick Event" -Body @{
    name = "Three Day Challenge"
    numberOfDays = 3
    teamNames = "Alpha, Beta, Gamma, Delta"
}

Start-Sleep -Seconds 1

# ============================================
# TEST 5: Test with Comma-Separated Array
# ============================================
$event5 = Test-QuickCreate -TestName "Create with Pre-Parsed Array" -Body @{
    name = "Quick Test Event"
    numberOfDays = 1
    teamNames = @("Team A", "Team B", "Team C")
}

Start-Sleep -Seconds 1

# ============================================
# TEST 6: Validation - Empty Event Name
# ============================================
Test-QuickCreate -TestName "Validation: Empty Event Name" -Body @{
    name = ""
    numberOfDays = 1
    teamNames = "Team 1, Team 2"
} -ExpectedStatus 400 -ShouldSucceed $false

Start-Sleep -Seconds 1

# ============================================
# TEST 7: Validation - Event Name Too Short
# ============================================
Test-QuickCreate -TestName "Validation: Event Name Too Short" -Body @{
    name = "Hi"
    numberOfDays = 1
    teamNames = "Team 1, Team 2"
} -ExpectedStatus 400 -ShouldSucceed $false

Start-Sleep -Seconds 1

# ============================================
# TEST 8: Validation - Invalid Days (0)
# ============================================
Test-QuickCreate -TestName "Validation: Zero Days" -Body @{
    name = "Test Event"
    numberOfDays = 0
    teamNames = "Team 1, Team 2"
} -ExpectedStatus 400 -ShouldSucceed $false

Start-Sleep -Seconds 1

# ============================================
# TEST 9: Validation - Too Many Days (4+)
# ============================================
Test-QuickCreate -TestName "Validation: Too Many Days" -Body @{
    name = "Long Event"
    numberOfDays = 5
    teamNames = "Team 1, Team 2"
} -ExpectedStatus 400 -ShouldSucceed $false

Start-Sleep -Seconds 1

# ============================================
# TEST 10: Validation - Single Team (Min 2)
# ============================================
Test-QuickCreate -TestName "Validation: Only One Team" -Body @{
    name = "Test Event"
    numberOfDays = 1
    teamNames = "Single Team"
} -ExpectedStatus 400 -ShouldSucceed $false

Start-Sleep -Seconds 1

# ============================================
# TEST 11: Test Link Accessibility
# ============================================
if ($event1) {
    Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
    Write-Host "Testing Generated Links..." -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    # Test each link type
    Test-LinkAccessibility -LinkName "Admin Link" -Url $event1.links.admin
    Test-LinkAccessibility -LinkName "Scorer Link" -Url $event1.links.scorer
    Test-LinkAccessibility -LinkName "Viewer Link" -Url $event1.links.viewer
    Test-LinkAccessibility -LinkName "Scoreboard" -Url $event1.links.scoreboard
}

# ============================================
# TEST 12: Verify Event Fields
# ============================================
if ($event1) {
    Write-Host "`n📊 Verifying Event Structure..." -ForegroundColor Yellow
    
    $allFieldsValid = $true
    
    # Check required fields
    $requiredFields = @(
        @{ Field = "event.id"; Value = $event1.event.id },
        @{ Field = "event.name"; Value = $event1.event.name },
        @{ Field = "event.eventMode"; Value = $event1.event.eventMode },
        @{ Field = "event.eventStatus"; Value = $event1.event.eventStatus },
        @{ Field = "tokens.admin_token"; Value = $event1.tokens.admin_token },
        @{ Field = "tokens.scorer_token"; Value = $event1.tokens.scorer_token },
        @{ Field = "tokens.viewer_token"; Value = $event1.tokens.viewer_token },
        @{ Field = "teams.length"; Value = $event1.teams.Length }
    )
    
    foreach ($field in $requiredFields) {
        if ($field.Value) {
            Write-Host "   ✓ $($field.Field): $($field.Value)" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $($field.Field): MISSING" -ForegroundColor Red
            $allFieldsValid = $false
        }
    }
    
    if ($allFieldsValid) {
        $script:testsPassed++
    } else {
        $script:testsFailed++
    }
}

# ============================================
# TEST 13: Verify Team Creation
# ============================================
if ($event1 -and $event1.teams.Length -gt 0) {
    Write-Host "`n👥 Verifying Team Creation..." -ForegroundColor Yellow
    
    $expectedTeams = @("Team Red", "Team Blue", "Team Green", "Team Yellow")
    $createdTeamNames = $event1.teams | ForEach-Object { $_.name }
    
    $allTeamsCreated = $true
    foreach ($expectedTeam in $expectedTeams) {
        if ($createdTeamNames -contains $expectedTeam) {
            Write-Host "   ✓ Team created: $expectedTeam" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Team missing: $expectedTeam" -ForegroundColor Red
            $allTeamsCreated = $false
        }
    }
    
    # Check team colors
    foreach ($team in $event1.teams) {
        if ($team.color -match '^#[0-9A-Fa-f]{6}$') {
            Write-Host "   ✓ $($team.name) has valid color: $($team.color)" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $($team.name) has invalid color: $($team.color)" -ForegroundColor Red
            $allTeamsCreated = $false
        }
    }
    
    if ($allTeamsCreated) {
        $script:testsPassed++
    } else {
        $script:testsFailed++
    }
}

# ============================================
# TEST 14: Quick Event Mode Verification
# ============================================
if ($event1) {
    Write-Host "`n⚡ Verifying Quick Mode Configuration..." -ForegroundColor Yellow
    
    $isQuickMode = $event1.event.eventMode -eq "quick"
    $hasAutoCleanup = $event1.event.autoCleanupDate -ne $null
    $isActive = $event1.event.eventStatus -eq "active"
    
    if ($isQuickMode) {
        Write-Host "   ✓ Event mode is 'quick'" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "   ✗ Event mode is '$($event1.event.eventMode)' (expected 'quick')" -ForegroundColor Red
        $script:testsFailed++
    }
    
    if ($hasAutoCleanup) {
        Write-Host "   ✓ Auto-cleanup date set: $($event1.event.autoCleanupDate)" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "   ✗ Auto-cleanup date not set" -ForegroundColor Red
        $script:testsFailed++
    }
    
    if ($isActive) {
        Write-Host "   ✓ Event status is 'active'" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "   ✗ Event status is '$($event1.event.eventStatus)' (expected 'active')" -ForegroundColor Red
        $script:testsFailed++
    }
}

# ============================================
# FINAL SUMMARY
# ============================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$totalTests = $testsPassed + $testsFailed
$successRate = if ($totalTests -gt 0) { [math]::Round(($testsPassed / $totalTests) * 100, 2) } else { 0 }

Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray

if ($testsFailed -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "`n🎉 Quick Create flow is working perfectly!" -ForegroundColor Cyan
    Write-Host "   Try it out: $baseUrl/quick-create" -ForegroundColor Gray
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "`nPlease review the failures above and fix any issues." -ForegroundColor Yellow
}

Write-Host ""
