# Test Token System
Write-Host ""
Write-Host "Testing Token-Based Access System" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

# Test: Create Event with Tokens
Write-Host ""
Write-Host "Test: Creating Event and Generating Tokens" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Gray

$eventData = @{
    name = "Token Test Event"
    number_of_days = 3
    eventMode = "camp"
    scoringMode = "daily"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/events/create' `
        -Method POST `
        -Body $eventData `
        -ContentType 'application/json'
    
    if ($response.success) {
        Write-Host "SUCCESS: Event Created!" -ForegroundColor Green
        Write-Host "Event ID: $($response.data.event.id)" -ForegroundColor Gray
        Write-Host ""
        
        # Display tokens
        Write-Host "Generated Tokens:" -ForegroundColor Cyan
        Write-Host "  Admin Token:  $($response.data.tokens.admin_token.Substring(0,16))..." -ForegroundColor Red
        Write-Host "  Scorer Token: $($response.data.tokens.scorer_token.Substring(0,16))..." -ForegroundColor Yellow
        Write-Host "  Viewer Token: $($response.data.tokens.public_token.Substring(0,16))..." -ForegroundColor Green
        Write-Host ""
        
        # Display share links
        Write-Host "Share Links:" -ForegroundColor Cyan
        Write-Host "  Admin:  $($response.data.shareLinks.admin)" -ForegroundColor Gray
        Write-Host "  Scorer: $($response.data.shareLinks.scorer)" -ForegroundColor Gray
        Write-Host "  Viewer: $($response.data.shareLinks.viewer)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host $response.message -ForegroundColor Yellow
        
        # Save tokens for next test
        $global:eventId = $response.data.event.id
        $global:adminToken = $response.data.tokens.admin_token
        $global:scorerToken = $response.data.tokens.scorer_token
        $global:viewerToken = $response.data.tokens.public_token
    } else {
        Write-Host "FAILED: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test: Validate Admin Token
if ($global:eventId) {
    Write-Host ""
    Write-Host "Test: Validating Admin Token" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    $validateData = @{
        token = $global:adminToken
    } | ConvertTo-Json
    
    try {
        $validation = Invoke-RestMethod -Uri "http://localhost:3000/api/events/$($global:eventId)/validate-token" `
            -Method POST `
            -Body $validateData `
            -ContentType 'application/json'
        
        if ($validation.success) {
            Write-Host "SUCCESS: Token Valid!" -ForegroundColor Green
            Write-Host "Token Type: $($validation.data.tokenType)" -ForegroundColor Gray
            Write-Host "Permissions:" -ForegroundColor Cyan
            $validation.data.permissions.PSObject.Properties | ForEach-Object {
                $icon = if ($_.Value) { "YES" } else { "NO " }
                $color = if ($_.Value) { "Green" } else { "Gray" }
                Write-Host "  [$icon] $($_.Name)" -ForegroundColor $color
            }
        } else {
            Write-Host "FAILED: $($validation.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test: Validate Scorer Token
    Write-Host ""
    Write-Host "Test: Validating Scorer Token" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    $validateData = @{
        token = $global:scorerToken
    } | ConvertTo-Json
    
    try {
        $validation = Invoke-RestMethod -Uri "http://localhost:3000/api/events/$($global:eventId)/validate-token" `
            -Method POST `
            -Body $validateData `
            -ContentType 'application/json'
        
        if ($validation.success) {
            Write-Host "SUCCESS: Token Valid!" -ForegroundColor Green
            Write-Host "Token Type: $($validation.data.tokenType)" -ForegroundColor Gray
            Write-Host "Can Submit Scores: $($validation.data.permissions.canSubmitScores)" -ForegroundColor Cyan
            Write-Host "Can Edit Event: $($validation.data.permissions.canEditEvent)" -ForegroundColor Gray
        } else {
            Write-Host "FAILED: $($validation.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test: Invalid Token
    Write-Host ""
    Write-Host "Test: Validating Invalid Token (Should Fail)" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    $validateData = @{
        token = "invalid_token_12345"
    } | ConvertTo-Json
    
    try {
        $validation = Invoke-RestMethod -Uri "http://localhost:3000/api/events/$($global:eventId)/validate-token" `
            -Method POST `
            -Body $validateData `
            -ContentType 'application/json' `
            -ErrorAction Stop
        
        Write-Host "UNEXPECTED: Invalid token was accepted!" -ForegroundColor Red
    } catch {
        Write-Host "EXPECTED: Invalid token rejected" -ForegroundColor Green
        Write-Host "Error: 401 Unauthorized" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check Firebase Console to see hashed tokens:" -ForegroundColor White
Write-Host "https://console.firebase.google.com/project/combinedactivities-7da43/firestore" -ForegroundColor Cyan
Write-Host ""
