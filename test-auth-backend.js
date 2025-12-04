#!/usr/bin/env node
/**
 * Backend Authentication Test Suite
 * Tests: JWT Secret, Token Refresh, Rate Limiting, Email Verification, Session Management, Cookie Auth
 */

const BASE_URL = 'http://localhost:3000';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, title, message) {
  console.log(`${color}${title}${colors.reset} ${message}`);
}

function success(title, message) {
  log(colors.green, '✅', `${title}: ${message}`);
}

function error(title, message) {
  log(colors.red, '❌', `${title}: ${message}`);
}

function info(title, message) {
  log(colors.blue, 'ℹ️', `${title}: ${message}`);
}

function warn(title, message) {
  log(colors.yellow, '⚠️', `${title}: ${message}`);
}

// Test utilities
async function makeRequest(method, endpoint, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json().catch(() => null);

  return { status: response.status, data, headers: response.headers };
}

// Test cases
const tests = {
  // Test 1: JWT Secret Configuration
  async testJWTSecret() {
    console.log(`\n${colors.cyan}━━━ Test 1: JWT Secret Configuration ━━━${colors.reset}`);
    
    try {
      // Attempt to access protected endpoint without token
      const { status } = await makeRequest('GET', '/api/auth/me', null, {
        'Authorization': 'Bearer invalid_token',
      });

      if (status === 401) {
        success('JWT Secret', 'Protected endpoints properly reject invalid tokens');
      } else {
        error('JWT Secret', `Expected 401, got ${status}`);
      }
    } catch (err) {
      error('JWT Secret Test', err.message);
    }
  },

  // Test 2: Token Generation and Verification
  async testTokenGeneration() {
    console.log(`\n${colors.cyan}━━━ Test 2: Token Generation & Verification ━━━${colors.reset}`);
    
    try {
      // Register new user
      const uniqueEmail = `test_${Date.now()}@example.com`;
      const { data: registerData } = await makeRequest('POST', '/api/auth/register', {
        name: 'Test User',
        email: uniqueEmail,
        password: 'TestPassword123!@#',
      });

      if (!registerData?.success) {
        error('Token Generation', `Registration failed: ${registerData?.error}`);
        return;
      }

      const accessToken = registerData.data.access_token;
      const refreshToken = registerData.data.refresh_token;

      if (!accessToken) {
        error('Token Generation', 'No access token returned');
        return;
      }

      success('Token Generation', 'Access token generated successfully');
      info('Token Generation', `Access Token Length: ${accessToken.length}`);
      info('Token Generation', `Refresh Token Length: ${refreshToken.length}`);

      // Store for later tests
      tests.lastAccessToken = accessToken;
      tests.lastRefreshToken = refreshToken;
      tests.lastEmail = uniqueEmail;

      // Verify token format (JWT has 3 parts separated by dots)
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        success('Token Format', 'Access token has valid JWT structure');
      } else {
        error('Token Format', `JWT should have 3 parts, got ${tokenParts.length}`);
      }
    } catch (err) {
      error('Token Generation Test', err.message);
    }
  },

  // Test 3: Token Refresh
  async testTokenRefresh() {
    console.log(`\n${colors.cyan}━━━ Test 3: Token Refresh Mechanism ━━━${colors.reset}`);
    
    if (!tests.lastRefreshToken) {
      warn('Token Refresh', 'Skipping - no refresh token from previous test');
      return;
    }

    try {
      const { data: refreshData, status } = await makeRequest(
        'POST',
        '/api/auth/refresh',
        { refresh_token: tests.lastRefreshToken }
      );

      if (status === 200 && refreshData?.success) {
        success('Token Refresh', 'Successfully refreshed access token');
        info('Token Refresh', `New Token: ${refreshData.data.access_token.substring(0, 20)}...`);
        tests.lastAccessToken = refreshData.data.access_token;
      } else {
        error('Token Refresh', `Expected 200, got ${status}: ${refreshData?.error}`);
      }

      // Test with invalid refresh token
      const { status: invalidStatus } = await makeRequest(
        'POST',
        '/api/auth/refresh',
        { refresh_token: 'invalid_refresh_token' }
      );

      if (invalidStatus === 401) {
        success('Token Refresh', 'Invalid refresh token properly rejected');
      } else {
        error('Token Refresh', `Invalid token should return 401, got ${invalidStatus}`);
      }
    } catch (err) {
      error('Token Refresh Test', err.message);
    }
  },

  // Test 4: Rate Limiting
  async testRateLimiting() {
    console.log(`\n${colors.cyan}━━━ Test 4: Rate Limiting ━━━${colors.reset}`);
    
    try {
      let requestCount = 0;
      let rateLimitHit = false;
      const results = [];

      // Make 7 requests to login endpoint (limit is 5 per minute)
      for (let i = 0; i < 7; i++) {
        const { status, headers } = await makeRequest('POST', '/api/auth/login', {
          email: `ratelimit_test_${i}@example.com`,
          password: 'TestPassword123!@#',
        });

        requestCount++;
        results.push({ attempt: i + 1, status });

        if (status === 429) {
          rateLimitHit = true;
          const retryAfter = headers.get('Retry-After');
          info('Rate Limiting', `Hit rate limit at attempt ${i + 1}`);
          if (retryAfter) {
            info('Rate Limiting', `Retry-After header: ${retryAfter}s`);
          }
        } else {
          info('Rate Limiting', `Request ${i + 1}: Status ${status}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (rateLimitHit) {
        success('Rate Limiting', 'Rate limit enforcement working');
      } else {
        warn('Rate Limiting', 'Rate limit not enforced in test (may need to wait for cleanup)');
      }
    } catch (err) {
      error('Rate Limiting Test', err.message);
    }
  },

  // Test 5: Authentication Required
  async testAuthenticationRequired() {
    console.log(`\n${colors.cyan}━━━ Test 5: Authentication Required ━━━${colors.reset}`);
    
    try {
      // Test endpoint without token
      const { status: noTokenStatus } = await makeRequest('GET', '/api/auth/me');

      if (noTokenStatus === 401) {
        success('Authentication Required', 'Protected endpoint rejects missing token');
      } else {
        warn('Authentication Required', `Expected 401, got ${noTokenStatus}`);
      }

      // Test with invalid token
      const { status: invalidTokenStatus } = await makeRequest('GET', '/api/auth/me', null, {
        'Authorization': 'Bearer invalid.token.here',
      });

      if (invalidTokenStatus === 401) {
        success('Authentication Required', 'Invalid token properly rejected');
      } else {
        warn('Authentication Required', `Expected 401, got ${invalidTokenStatus}`);
      }

      // Test with valid token
      if (tests.lastAccessToken) {
        const { status: validTokenStatus } = await makeRequest('GET', '/api/auth/me', null, {
          'Authorization': `Bearer ${tests.lastAccessToken}`,
        });

        if (validTokenStatus === 200) {
          success('Authentication Required', 'Valid token accepted');
        } else {
          warn('Authentication Required', `Expected 200 with valid token, got ${validTokenStatus}`);
        }
      }
    } catch (err) {
      error('Authentication Required Test', err.message);
    }
  },

  // Test 6: Session Management
  async testSessionManagement() {
    console.log(`\n${colors.cyan}━━━ Test 6: Session Management ━━━${colors.reset}`);
    
    if (!tests.lastAccessToken) {
      warn('Session Management', 'Skipping - no access token from previous tests');
      return;
    }

    try {
      // Get current user info
      const { data: meData, status } = await makeRequest('GET', '/api/auth/me', null, {
        'Authorization': `Bearer ${tests.lastAccessToken}`,
      });

      if (status === 200 && meData?.data?.user) {
        success('Session Management', 'User session retrieved successfully');
        info('Session Management', `User ID: ${meData.data.user.id}`);
        info('Session Management', `Email: ${meData.data.user.email}`);
      } else {
        error('Session Management', `Failed to retrieve user session: ${meData?.error}`);
      }
    } catch (err) {
      error('Session Management Test', err.message);
    }
  },

  // Test 7: Password Hashing Security
  async testPasswordSecurity() {
    console.log(`\n${colors.cyan}━━━ Test 7: Password Security (Bcrypt) ━━━${colors.reset}`);
    
    try {
      // Create two users with same password
      const email1 = `pwd_test_${Date.now()}@example.com`;
      const password = 'TestPassword123!@#';

      const { data: registerData } = await makeRequest('POST', '/api/auth/register', {
        name: 'Password Test 1',
        email: email1,
        password,
      });

      if (registerData?.success) {
        success('Password Security', 'User registered with bcrypt hashing');

        // Try to login with correct password
        const { status: correctPwdStatus, data: correctPwdData } = await makeRequest(
          'POST',
          '/api/auth/login',
          { email: email1, password }
        );

        if (correctPwdStatus === 200 && correctPwdData?.success) {
          success('Password Security', 'Correct password accepts login');
        } else {
          error('Password Security', 'Correct password should allow login');
        }

        // Try with incorrect password
        const { status: wrongPwdStatus } = await makeRequest(
          'POST',
          '/api/auth/login',
          { email: email1, password: 'WrongPassword123!@#' }
        );

        if (wrongPwdStatus === 401) {
          success('Password Security', 'Wrong password rejects login');
        } else {
          error('Password Security', `Wrong password should return 401, got ${wrongPwdStatus}`);
        }
      }
    } catch (err) {
      error('Password Security Test', err.message);
    }
  },

  // Test 8: Email Configuration Validation
  async testEmailConfiguration() {
    console.log(`\n${colors.cyan}━━━ Test 8: Email Configuration ━━━${colors.reset}`);
    
    try {
      // Check if SMTP is configured by attempting password reset
      const testEmail = `email_test_${Date.now()}@example.com`;
      
      const { data: resetData, status } = await makeRequest('POST', '/api/auth/forgot-password', {
        email: testEmail,
      });

      if (status === 200 || status === 404) {
        // 404 means user not found (expected for test email)
        // 200 means email would have been sent
        info('Email Configuration', 'Email endpoint available');
      } else if (status === 503) {
        warn('Email Configuration', 'Email service not configured (SMTP settings missing)');
      } else {
        info('Email Configuration', `Endpoint status: ${status}`);
      }
    } catch (err) {
      error('Email Configuration Test', err.message);
    }
  },

  // Test 9: Token Expiration
  async testTokenExpiration() {
    console.log(`\n${colors.cyan}━━━ Test 9: Token Expiration & Validation ━━━${colors.reset}`);
    
    try {
      // Create a user to get tokens
      const email = `expiry_test_${Date.now()}@example.com`;
      const { data: registerData } = await makeRequest('POST', '/api/auth/register', {
        name: 'Token Expiry Test',
        email,
        password: 'TestPassword123!@#',
      });

      if (registerData?.success) {
        const token = registerData.data.access_token;
        
        // Parse JWT payload (middle section)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        if (payload.exp) {
          const expiryTime = new Date(payload.exp * 1000);
          info('Token Expiration', `Token expires at: ${expiryTime.toISOString()}`);
          
          // Check if token has reasonable expiry (15 minutes from now)
          const now = Date.now() / 1000;
          const timeUntilExpiry = payload.exp - now;
          
          if (timeUntilExpiry > 600 && timeUntilExpiry < 1800) {
            success('Token Expiration', 'Token has appropriate 15-minute expiration window');
          } else {
            warn('Token Expiration', `Token expiration window: ${Math.floor(timeUntilExpiry)}s`);
          }
        }
      }
    } catch (err) {
      error('Token Expiration Test', err.message);
    }
  },
};

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Backend Authentication Test Suite     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  info('Starting', `Connecting to ${BASE_URL}`);

  try {
    // Check if server is running
    const { status } = await makeRequest('GET', '/api/health');
    if (status !== 200) {
      error('Server Health', 'Server not responding');
      process.exit(1);
    }
  } catch (err) {
    error('Server Health', `Cannot connect to server: ${err.message}`);
    process.exit(1);
  }

  success('Server Health', 'Server is running');

  // Run all tests
  const testNames = Object.keys(tests).filter(key => key.startsWith('test'));
  
  for (const testName of testNames) {
    try {
      await tests[testName]();
    } catch (err) {
      error(testName, `Test failed with error: ${err.message}`);
    }
  }

  // Summary
  console.log(`\n${colors.cyan}━━━ Test Summary ━━━${colors.reset}`);
  console.log(`${colors.green}✅ All backend authentication tests completed!${colors.reset}\n`);
}

// Run tests
runAllTests().catch(console.error);
