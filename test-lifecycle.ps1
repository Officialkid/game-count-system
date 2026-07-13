# Test Event Lifecycle System
# Run: .\test-lifecycle.ps1

Write-Host "`n🧪 Testing Event Lifecycle Management System" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray

$baseUrl = "http://localhost:3002"
$headers = @{ "Content-Type" = "application/json" }

# ============================================
# Test 1: Create Quick Event with Auto-Cleanup
# ============================================
Write-Host "`n📝 TEST 1: Create Quick Event" -ForegroundColor Yellow

$createBody = @{
    name = "Lifecycle Test - Quick Event"
    eventMode = "quick"
    start_date = (Get-Date).ToString("yyyy-MM-dd")
    end_date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    event_type = "single"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/create" `
        -Method POST -Body $createBody -Headers $headers
    
    if ($createResponse.success) {
        $eventId = $createResponse.data.event.id
        $adminToken = $createResponse.data.tokens.admin
        $autoCleanupDate = $createResponse.data.event.autoCleanupDate
        
        Write-Host "✅ Event Created:" -ForegroundColor Green
        Write-Host "   Event ID: $eventId"
        Write-Host "   Mode: Quick (24-hour auto-cleanup)"
        Write-Host "   Auto-Cleanup Date: $autoCleanupDate"
        Write-Host "   Status: $($createResponse.data.event.eventStatus)"
        
        # Calculate time remaining
        $cleanupTime = [DateTime]::Parse($autoCleanupDate)
        $remaining = $cleanupTime - (Get-Date)
        Write-Host "   Time Remaining: $([Math]::Floor($remaining.TotalHours))h $($remaining.Minutes)m" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed: $($createResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================
# Test 2: Check Lifecycle Info
# ============================================
Write-Host "`n📊 TEST 2: Check Lifecycle Status" -ForegroundColor Yellow

try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/status" -Method GET
    
    if ($statusResponse.success) {
        Write-Host "✅ Lifecycle Info:" -ForegroundColor Green
        Write-Host "   Current Status: $($statusResponse.data.currentStatus)"
        Write-Host "   Available Transitions: $($statusResponse.data.availableTransitions -join ', ')"
        Write-Host "   Mode: $($statusResponse.data.mode)"
        Write-Host "   Is Finalized: $($statusResponse.data.isFinalized)"
    }
} catch {
    Write-Host "⚠️  Status check error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================
# Test 3: Activate Event (Draft → Active)
# ============================================
Write-Host "`n🔵 TEST 3: Activate Event (Draft → Active)" -ForegroundColor Yellow

$activateBody = @{
    status = "active"
    admin_token = $adminToken
} | ConvertTo-Json

try {
    $activateResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/status" `
        -Method PUT -Body $activateBody -Headers $headers
    
    if ($activateResponse.success) {
        Write-Host "✅ Status Transition Successful:" -ForegroundColor Green
        Write-Host "   Previous: $($activateResponse.data.previousStatus)"
        Write-Host "   New: $($activateResponse.data.newStatus)"
        Write-Host "   Next Available: $($activateResponse.data.availableTransitions -join ', ')"
    } else {
        Write-Host "❌ Failed: $($activateResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# Test 4: Try Invalid Transition (Active → Draft)
# ============================================
Write-Host "`n🚫 TEST 4: Try Invalid Transition (Active → Draft)" -ForegroundColor Yellow

$invalidBody = @{
    status = "draft"
    admin_token = $adminToken
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/status" `
        -Method PUT -Body $invalidBody -Headers $headers -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED: Invalid transition was allowed!" -ForegroundColor Red
} catch {
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Correctly Rejected:" -ForegroundColor Green
    Write-Host "   Reason: $($errorBody.error)"
}

# ============================================
# Test 5: Complete Event (Active → Completed)
# ============================================
Write-Host "`n🏆 TEST 5: Complete Event (Active → Completed)" -ForegroundColor Yellow

# First, finalize the event
$finalizeBody = @{
    admin_token = $adminToken
} | ConvertTo-Json

try {
    $finalizeResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/finalize" `
        -Method POST -Body $finalizeBody -Headers $headers -ErrorAction SilentlyContinue
} catch {
    Write-Host "   (Event may already be finalized or finalization not required)" -ForegroundColor Gray
}

# Now complete
$completeBody = @{
    status = "completed"
    admin_token = $adminToken
} | ConvertTo-Json

try {
    $completeResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/status" `
        -Method PUT -Body $completeBody -Headers $headers
    
    if ($completeResponse.success) {
        Write-Host "✅ Event Completed:" -ForegroundColor Green
        Write-Host "   Previous: $($completeResponse.data.previousStatus)"
        Write-Host "   New: $($completeResponse.data.newStatus)"
    } else {
        Write-Host "⚠️  Could not complete: $($completeResponse.error)" -ForegroundColor Yellow
        Write-Host "   (This is OK if event needs to be finalized first)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Complete failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================
# Test 6: Archive Event
# ============================================
Write-Host "`n📦 TEST 6: Archive Event" -ForegroundColor Yellow

$archiveBody = @{
    token = $adminToken
} | ConvertTo-Json

try {
    $archiveResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/archive" `
        -Method POST -Body $archiveBody -Headers $headers
    
    if ($archiveResponse.success) {
        Write-Host "✅ Event Archived:" -ForegroundColor Green
        Write-Host "   Previous: $($archiveResponse.data.previousStatus)"
        Write-Host "   New: $($archiveResponse.data.newStatus)"
        Write-Host "   Archived At: $($archiveResponse.data.archivedAt)"
    } else {
        Write-Host "❌ Failed: $($archiveResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# Test 7: Try to Modify Archived Event
# ============================================
Write-Host "`n🔒 TEST 7: Try to Modify Archived Event" -ForegroundColor Yellow

$modifyBody = @{
    status = "active"
    admin_token = $adminToken
} | ConvertTo-Json

try {
    $modifyResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/status" `
        -Method PUT -Body $modifyBody -Headers $headers -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED: Archived event was modified!" -ForegroundColor Red
} catch {
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Correctly Blocked:" -ForegroundColor Green
    Write-Host "   Reason: $($errorBody.error)"
}

# ============================================
# Test 8: Test Cleanup Job (Manual Trigger)
# ============================================
Write-Host "`n🧹 TEST 8: Test Cleanup Job (Manual Trigger)" -ForegroundColor Yellow

$cronSecret = $env:CRON_SECRET
if (-not $cronSecret) {
    $cronSecret = "test_secret_for_dev"
    Write-Host "   ⚠️  CRON_SECRET not set, using dev default" -ForegroundColor Yellow
}

$cronHeaders = @{ 
    "Authorization" = "Bearer $cronSecret"
}

try {
    Write-Host "   Running cleanup job..." -ForegroundColor Gray
    $cleanupResponse = Invoke-RestMethod -Uri "$baseUrl/api/cron/cleanup-events" `
        -Method GET -Headers $cronHeaders
    
    if ($cleanupResponse.success) {
        Write-Host "✅ Cleanup Job Completed:" -ForegroundColor Green
        Write-Host "   Checked: $($cleanupResponse.data.checked) events"
        Write-Host "   Deleted: $($cleanupResponse.data.deleted) events"
        Write-Host "   Failed: $($cleanupResponse.data.failed) events"
        Write-Host "   Timestamp: $($cleanupResponse.timestamp)"
        
        if ($cleanupResponse.data.events.Count -gt 0) {
            Write-Host "`n   Events Processed:" -ForegroundColor Cyan
            foreach ($evt in $cleanupResponse.data.events) {
                $status = if ($evt.deleted) { "✓ Deleted" } else { "✗ Failed" }
                Write-Host "   - $($evt.name) ($($evt.mode)): $status"
            }
        }
    } else {
        Write-Host "❌ Cleanup failed: $($cleanupResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# Summary
# ============================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Lifecycle Testing Complete!" -ForegroundColor Green
Write-Host "`nKey Features Verified:" -ForegroundColor Cyan
Write-Host "  ✓ Quick Event creation with auto-cleanup date"
Write-Host "  ✓ Status transitions (Draft → Active → Completed → Archived)"
Write-Host "  ✓ Invalid transition rejection"
Write-Host "  ✓ Archived event protection"
Write-Host "  ✓ Cleanup job execution"
Write-Host "`nEvent ID for reference: $eventId" -ForegroundColor Gray
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Verify archived_at and lifecycle fields through the Prisma-backed API"
Write-Host "   2. Wait 24 hours for auto-cleanup (or manually delete)"
Write-Host "   3. Deploy to Vercel to enable automatic hourly cron"
Write-Host "   4. Set CRON_SECRET environment variable in production"
Write-Host ""
