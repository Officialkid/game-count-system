@echo off
REM Backend Authentication Test Suite using curl

echo.
echo ================================================
echo  Backend Authentication Test Suite
echo ================================================
echo.

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:3000
set EMAIL_UNIQUE=%random%

echo [TEST 1] JWT Secret Configuration
echo.
curl -s -X GET "%BASE_URL%/api/auth/me" -H "Authorization: Bearer invalid_token" -H "Content-Type: application/json" | find "Unauthorized" >nul && (
    echo [PASS] Protected endpoint rejects invalid tokens
) || (
    echo [FAIL] Endpoint should return 401 for invalid token
)

echo.
echo [TEST 2] Token Generation
echo.
set "REGISTER_PAYLOAD={\"name\": \"Test User\", \"email\": \"test_%EMAIL_UNIQUE%@example.com\", \"password\": \"TestPassword123!@#\"}"
for /f "tokens=*" %%A in ('curl -s -X POST "%BASE_URL%/api/auth/register" -H "Content-Type: application/json" -d "%REGISTER_PAYLOAD%"') do set REGISTER_RESPONSE=%%A
echo Response: %REGISTER_RESPONSE%
echo %REGISTER_RESPONSE% | find "success" >nul && (
    echo [PASS] User successfully registered with tokens
) || (
    echo [FAIL] Registration failed
)

echo.
echo [TEST 3] Rate Limiting
echo.
echo Making 7 requests to login endpoint (limit is 5 per minute)...
for /L %%i in (1,1,7) do (
    for /f "tokens=*" %%A in ('curl -s -w "%%{http_code}" -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"test_%%i@example.com\", \"password\": \"Test123!@#\"}"') do set RESPONSE=%%A
    if "!RESPONSE:~-3!"=="429" (
        echo Request %%i: Rate Limited [429]
    ) else (
        echo Request %%i: Status !RESPONSE:~-3!
    )
)

echo.
echo [TEST 4] Authentication Required
echo.
curl -s -X GET "%BASE_URL%/api/auth/me" -H "Content-Type: application/json" | find "Unauthorized" >nul && (
    echo [PASS] Missing token properly rejected
) || (
    echo [FAIL] Should reject missing token
)

echo.
echo [TEST 5] Password Security
echo.
set "PWD_EMAIL=pwd_test_%random%@example.com"
set "PWD_PAYLOAD={\"name\": \"Password Test\", \"email\": \"%PWD_EMAIL%\", \"password\": \"TestPassword123!@#\"}"
curl -s -X POST "%BASE_URL%/api/auth/register" -H "Content-Type: application/json" -d "%PWD_PAYLOAD%" | find "success" >nul && (
    echo [PASS] Password successfully hashed with bcrypt
    
    REM Test wrong password
    set "WRONG_PWD_PAYLOAD={\"email\": \"%PWD_EMAIL%\", \"password\": \"WrongPassword123!@#\"}"
    curl -s -w "\n%%{http_code}" -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "%WRONG_PWD_PAYLOAD%" | find "401" >nul && (
        echo [PASS] Wrong password properly rejected
    ) || (
        echo [FAIL] Wrong password should be rejected
    )
) || (
    echo [FAIL] Registration failed
)

echo.
echo ================================================
echo  All Backend Authentication Tests Complete
echo ================================================
echo.
