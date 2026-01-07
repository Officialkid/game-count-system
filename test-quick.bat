@echo off
REM Quick Production Test - PowerShell Script
REM Tests GameScore backend end-to-end

echo ========================================
echo GameScore Production Test
echo ========================================
echo.

set API_BASE=http://localhost:3000
if not "%1"=="" set API_BASE=%1

echo Backend: %API_BASE%
echo.

REM Test 1: Health Check
echo [1/6] Testing Health Check...
curl -s %API_BASE%/api/health
echo.
echo.

REM Test 2: Create Event
echo [2/6] Creating Test Event...
curl -s -X POST %API_BASE%/api/events/create ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Quick Test\",\"mode\":\"quick\",\"start_at\":\"2026-01-08T09:00:00Z\",\"retention_policy\":\"manual\"}" ^
  > temp_event.json
type temp_event.json
echo.
echo.

REM Extract tokens (requires jq or manual parsing)
echo [3/6] Event Created - Check temp_event.json for tokens
echo.

REM Test 3: Invalid Token
echo [4/6] Testing Invalid Token...
curl -s -w "\nHTTP Status: %%{http_code}\n" %API_BASE%/events/invalid_token_12345
echo.
echo.

REM Test 4: Public Scoreboard (placeholder - needs real token)
echo [5/6] Test Public Scoreboard - Open browser to public_url from temp_event.json
echo.

REM Test 5: Recap Page (placeholder - needs real token)
echo [6/6] Test Recap Page - Open browser to /recap/{public_token}
echo.

echo ========================================
echo Manual Steps Required:
echo ========================================
echo 1. Open temp_event.json
echo 2. Copy public_url and open in browser
echo 3. Replace token in URL with /recap/{token} to test recap
echo 4. Add teams using admin_url
echo 5. Add scores using scorer_url
echo ========================================

del temp_event.json

pause
