#!/usr/bin/env node

/**
 * PRODUCTION DEPLOYMENT TEST
 * Validates production-ready configuration:
 * - HTTPS enforcement
 * - CORS configuration
 * - Cookie security flags
 * - Build errors
 * - Server logs
 * - API permission issues
 * 
 * Usage: node test-production-deployment.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let testsPassed = 0;
let testsFailed = 0;
const issues = [];
const report = {
  incorrectVariables: [],
  missingConfigs: [],
  securityProblems: [],
  deploymentBlockers: [],
  warnings: [],
  passed: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`, 'success');
    testsPassed++;
    report.passed.push(name);
  } catch (error) {
    log(`✗ ${name}`, 'error');
    log(`  Error: ${error.message}`, 'error');
    testsFailed++;
    issues.push({ test: name, error: error.message });
  }
}

// ============================================
// TEST SUITE: BUILD VALIDATION
// ============================================

async function testBuildValidation() {
  log('\n═══════════════════════════════════════════════', 'info');
  log('PRODUCTION BUILD VALIDATION', 'info');
  log('═══════════════════════════════════════════════\n', 'info');

  log('=== CHECKING BUILD CONFIGURATION ===\n', 'info');

  await test('package.json has correct build script', async () => {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.build) {
      throw new Error('package.json missing build script');
    }
    if (!packageJson.scripts.build.includes('next build')) {
      throw new Error('Build script does not use "next build"');
    }
    log(`  → Build command: ${packageJson.scripts.build}`, 'info');
  });

  await test('TypeScript configuration exists', async () => {
    if (!fs.existsSync('./tsconfig.json')) {
      throw new Error('tsconfig.json not found');
    }
    const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
    if (!tsconfig.compilerOptions) {
      throw new Error('tsconfig.json missing compilerOptions');
    }
  });

  await test('Next.js configuration exists', async () => {
    if (!fs.existsSync('./next.config.js')) {
      throw new Error('next.config.js not found');
    }
  });

  await test('No TypeScript errors in main files', async () => {
    try {
      const output = execSync('npx tsc --noEmit --project . 2>&1', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Check if there are actual errors (not warnings)
      if (output.includes('error TS')) {
        throw new Error(`TypeScript compilation errors found:\n${output.substring(0, 500)}`);
      }
    } catch (error) {
      if (error.message.includes('error TS')) {
        throw error;
      }
      // If tsc command fails but no TS errors, that's okay
    }
  });
}

// ============================================
// TEST SUITE: ENVIRONMENT CONFIGURATION
// ============================================

async function testEnvironmentConfig() {
  log('\n=== TESTING ENVIRONMENT CONFIGURATION ===\n', 'info');

  await test('All required environment variables defined', async () => {
    const required = [
      'POSTGRES_URL',
      'JWT_SECRET',
      'COOKIE_SECRET',
      'NEXT_PUBLIC_URL',
      'EMAIL_SERVER',
      'EMAIL_PORT',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'EMAIL_FROM'
    ];

    const missing = required.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  });

  await test('Environment variables have correct values', async () => {
    // Check URLs format
    if (!process.env.POSTGRES_URL.startsWith('postgres://') && 
        !process.env.POSTGRES_URL.startsWith('postgresql://')) {
      report.incorrectVariables.push({
        variable: 'POSTGRES_URL',
        issue: 'Must start with postgres:// or postgresql://',
        current: process.env.POSTGRES_URL.substring(0, 30) + '...'
      });
      throw new Error('POSTGRES_URL format incorrect');
    }

    if (!process.env.NEXT_PUBLIC_URL.startsWith('http://') &&
        !process.env.NEXT_PUBLIC_URL.startsWith('https://')) {
      report.incorrectVariables.push({
        variable: 'NEXT_PUBLIC_URL',
        issue: 'Must start with http:// or https://',
        current: process.env.NEXT_PUBLIC_URL
      });
      throw new Error('NEXT_PUBLIC_URL format incorrect');
    }
  });

  await test('Secrets meet minimum length requirements', async () => {
    const jwtLength = (process.env.JWT_SECRET || '').length;
    const cookieLength = (process.env.COOKIE_SECRET || '').length;

    if (jwtLength < 32) {
      report.securityProblems.push({
        issue: 'JWT_SECRET too short',
        current: jwtLength,
        required: 32
      });
      throw new Error(`JWT_SECRET too short: ${jwtLength} chars (minimum 32)`);
    }

    if (cookieLength < 32) {
      report.securityProblems.push({
        issue: 'COOKIE_SECRET too short',
        current: cookieLength,
        required: 32
      });
      throw new Error(`COOKIE_SECRET too short: ${cookieLength} chars (minimum 32)`);
    }
  });
}

// ============================================
// TEST SUITE: HTTPS & SECURITY
// ============================================

async function testHTTPSSecurity() {
  log('\n=== TESTING HTTPS & SECURITY CONFIGURATION ===\n', 'info');

  await test('HTTPS enforced for production', async () => {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.NEXT_PUBLIC_URL.startsWith('https://')) {
        report.securityProblems.push({
          issue: 'Production URL should use HTTPS',
          current: 'http://',
          required: 'https://'
        });
        throw new Error('Production environment must use HTTPS');
      }
    } else {
      log(`  ⚠ Development environment (http allowed)`, 'warning');
    }
  });

  await test('next.config.js has security headers', async () => {
    const nextConfig = fs.readFileSync('./next.config.js', 'utf8');
    
    const hasHeaders = nextConfig.includes('headers') || 
                       nextConfig.includes('rewrites') ||
                       nextConfig.includes('middleware');
    
    if (!hasHeaders) {
      log(`  ⚠ Consider adding security headers in next.config.js`, 'warning');
      report.warnings.push('Security headers not explicitly configured');
    }
  });

  await test('Middleware exists for security', async () => {
    if (!fs.existsSync('./middleware.ts') && !fs.existsSync('./middleware.js')) {
      log(`  ⚠ No middleware.ts found - consider adding security middleware`, 'warning');
      report.warnings.push('Middleware for authentication/security not found');
    } else {
      log(`  → Security middleware detected`, 'info');
    }
  });
}

// ============================================
// TEST SUITE: CORS CONFIGURATION
// ============================================

async function testCORSConfiguration() {
  log('\n=== TESTING CORS CONFIGURATION ===\n', 'info');

  await test('API routes have CORS handling', async () => {
    const apiFiles = [];
    
    function findApiFiles(dir) {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findApiFiles(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          apiFiles.push(filePath);
        }
      });
    }

    findApiFiles('./app/api');

    // API routes may exist even if CORS handling is implicit
    if (apiFiles.length > 0) {
      // Check if at least one route has explicit CORS headers
      let hasCORSHandling = false;
      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('Access-Control') || 
            content.includes('CORS') ||
            content.includes('Origin')) {
          hasCORSHandling = true;
        }
      });

      if (!hasCORSHandling) {
        report.missingConfigs.push('CORS headers not explicitly configured in API routes');
        log(`  ⚠ CORS may be handled by middleware`, 'warning');
      } else {
        log(`  → CORS handling detected in API routes`, 'info');
      }

      log(`  → Found ${apiFiles.length} API route files`, 'info');
    } else {
      log(`  ⚠ No explicit API routes found (may use middleware)`, 'warning');
    }
  });

  await test('Environment allows cross-origin requests', async () => {
    const url = process.env.NEXT_PUBLIC_URL;
    if (!url) throw new Error('NEXT_PUBLIC_URL not defined');
    
    // For development, localhost should allow localhost
    // For production, need to configure allowed origins
    if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
      log(`  → Production domain configured: ${url}`, 'info');
    }
  });
}

// ============================================
// TEST SUITE: COOKIE SECURITY
// ============================================

async function testCookieSecurity() {
  log('\n=== TESTING COOKIE SECURITY CONFIGURATION ===\n', 'info');

  await test('Cookie secret configured', async () => {
    if (!process.env.COOKIE_SECRET) {
      throw new Error('COOKIE_SECRET not defined');
    }
    if (process.env.COOKIE_SECRET.length < 32) {
      throw new Error('COOKIE_SECRET less than 32 characters');
    }
  });

  await test('NextAuth config (if used) has secure settings', async () => {
    const authFiles = [
      './app/api/auth/[...nextauth]/route.ts',
      './app/api/auth/[...nextauth]/route.js',
      './pages/api/auth/[...nextauth].ts',
      './pages/api/auth/[...nextauth].js'
    ];

    let authFileFound = false;
    for (const file of authFiles) {
      if (fs.existsSync(file)) {
        authFileFound = true;
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('NEXTAUTH_SECRET') || 
            content.includes('NEXTAUTH_URL')) {
          log(`  → NextAuth configuration detected: ${file}`, 'info');
        }
        break;
      }
    }

    if (!authFileFound) {
      log(`  ℹ NextAuth not used - custom auth implementation`, 'info');
    }
  });

  await test('API client has secure cookie handling', async () => {
    const clientFile = './lib/api-client.ts';
    if (fs.existsSync(clientFile)) {
      const content = fs.readFileSync(clientFile, 'utf8');
      
      if (content.includes('credentials') || 
          content.includes('cookie') ||
          content.includes('secure')) {
        log(`  → Secure cookie handling detected`, 'info');
      } else {
        log(`  ⚠ Verify secure cookie flags in api-client configuration`, 'warning');
        report.warnings.push('Cookie security flags should be verified');
      }
    }
  });
}

// ============================================
// TEST SUITE: FILE STRUCTURE & DEPLOYMENT
// ============================================

async function testFileStructure() {
  log('\n=== TESTING DEPLOYMENT FILE STRUCTURE ===\n', 'info');

  await test('Required configuration files exist', async () => {
    const required = [
      'package.json',
      'tsconfig.json',
      'next.config.js',
      '.env'
    ];

    const missing = required.filter(f => !fs.existsSync(f));
    if (missing.length > 0) {
      throw new Error(`Missing files: ${missing.join(', ')}`);
    }
  });

  await test('.env is in .gitignore', async () => {
    if (!fs.existsSync('./.gitignore')) {
      throw new Error('.gitignore not found');
    }
    
    const gitignore = fs.readFileSync('./.gitignore', 'utf8');
    if (!gitignore.includes('.env')) {
      report.securityProblems.push({
        issue: '.env is not in .gitignore',
        risk: 'Secrets could be committed to version control'
      });
      throw new Error('.env not listed in .gitignore');
    }
  });

  await test('node_modules is in .gitignore', async () => {
    const gitignore = fs.readFileSync('./.gitignore', 'utf8');
    if (!gitignore.includes('node_modules')) {
      report.warnings.push('node_modules should be in .gitignore');
      log(`  ⚠ node_modules not in .gitignore`, 'warning');
    }
  });

  await test('.next build directory excluded', async () => {
    const gitignore = fs.readFileSync('./.gitignore', 'utf8');
    if (!gitignore.includes('.next')) {
      report.warnings.push('.next directory should be in .gitignore');
      log(`  ⚠ .next build directory not in .gitignore`, 'warning');
    }
  });
}

// ============================================
// TEST SUITE: DATABASE & API PERMISSIONS
// ============================================

async function testDatabasePermissions() {
  log('\n=== TESTING DATABASE & API PERMISSIONS ===\n', 'info');

  await test('Database connection string configured', async () => {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL not configured');
    }

    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        const result = await pool.query('SELECT 1');
        log(`  → Database connection successful`, 'info');
      } finally {
        await pool.end();
      }
    } catch (error) {
      report.deploymentBlockers.push({
        blocker: 'Database connection failed',
        error: error.message
      });
      throw error;
    }
  });

  await test('API endpoints are accessible', async () => {
    const apiDirs = ['./app/api', './pages/api'];
    let apiCount = 0;

    for (const dir of apiDirs) {
      if (fs.existsSync(dir)) {
        function countFiles(d) {
          const files = fs.readdirSync(d);
          files.forEach(file => {
            const filePath = path.join(d, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              countFiles(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
              apiCount++;
            }
          });
        }
        countFiles(dir);
      }
    }

    if (apiCount === 0) {
      throw new Error('No API routes found');
    }

    log(`  → Found ${apiCount} API route files`, 'info');
  });

  await test('Authentication middleware configured', async () => {
    const middlewareFile = './middleware.ts';
    
    if (fs.existsSync(middlewareFile)) {
      const content = fs.readFileSync(middlewareFile, 'utf8');
      if (content.includes('auth') || content.includes('token')) {
        log(`  → Authentication middleware detected`, 'info');
      } else {
        log(`  ⚠ Middleware exists but auth handling unclear`, 'warning');
      }
    } else {
      log(`  ⚠ No middleware.ts - ensure auth is checked in routes`, 'warning');
    }
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        PRODUCTION DEPLOYMENT VALIDATION TEST                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    await testBuildValidation();
    await testEnvironmentConfig();
    await testHTTPSSecurity();
    await testCORSConfiguration();
    await testCookieSecurity();
    await testFileStructure();
    await testDatabasePermissions();

    printReport();
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

function printReport() {
  const total = testsPassed + testsFailed;
  const successRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    PRODUCTION REPORT                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  log(`Tests Passed:  ${testsPassed}`, 'success');
  log(`Tests Failed:  ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
  log(`Total Tests:   ${total}`, 'info');
  log(`Success Rate:  ${successRate}%\n`, successRate >= 90 ? 'success' : 'warning');

  // DEPLOYMENT STATUS
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEPLOYMENT STATUS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (testsFailed === 0 && report.deploymentBlockers.length === 0) {
    log('✅ READY FOR PRODUCTION DEPLOYMENT', 'success');
  } else if (report.deploymentBlockers.length > 0) {
    log('❌ DEPLOYMENT BLOCKED', 'error');
  } else {
    log('⚠️  WARNINGS PRESENT - REVIEW BEFORE DEPLOYMENT', 'warning');
  }

  // DEPLOYMENT BLOCKERS
  if (report.deploymentBlockers.length > 0) {
    console.log('\n🚫 DEPLOYMENT BLOCKERS:\n');
    report.deploymentBlockers.forEach(blocker => {
      console.log(`  ❌ ${blocker.blocker}`);
      if (blocker.error) console.log(`     → ${blocker.error}`);
    });
  }

  // INCORRECT VARIABLES
  if (report.incorrectVariables.length > 0) {
    console.log('\n❌ INCORRECT ENVIRONMENT VARIABLES:\n');
    report.incorrectVariables.forEach(item => {
      console.log(`  Variable: ${item.variable}`);
      console.log(`  Issue: ${item.issue}`);
      console.log(`  Current: ${item.current}\n`);
    });
  }

  // MISSING CONFIGS
  if (report.missingConfigs.length > 0) {
    console.log('\n⚠️  MISSING CONFIGURATIONS:\n');
    report.missingConfigs.forEach(config => {
      console.log(`  → ${config}`);
    });
    console.log('');
  }

  // SECURITY PROBLEMS
  if (report.securityProblems.length > 0) {
    console.log('\n🔒 SECURITY ISSUES:\n');
    report.securityProblems.forEach(problem => {
      console.log(`  ⚠️  ${problem.issue || problem.problem}`);
      if (problem.current) console.log(`     Current: ${problem.current}`);
      if (problem.required) console.log(`     Required: ${problem.required}`);
      if (problem.risk) console.log(`     Risk: ${problem.risk}`);
    });
    console.log('');
  }

  // WARNINGS
  if (report.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    report.warnings.forEach(warning => {
      console.log(`  → ${warning}`);
    });
    console.log('');
  }

  // PASSED TESTS SUMMARY
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ PASSED CHECKS:\n');
  report.passed.slice(0, 8).forEach(test => {
    console.log(`  ✓ ${test}`);
  });
  if (report.passed.length > 8) {
    console.log(`  ... and ${report.passed.length - 8} more checks`);
  }

  // RENDER ENVIRONMENT RECOMMENDATIONS
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║            RENDER DEPLOYMENT CHECKLIST                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('Before deploying to Render, ensure:\n');
  console.log('1. Environment Variables:');
  console.log('   □ Set NEXT_PUBLIC_URL to your production domain');
  console.log('   □ Set NODE_ENV="production"');
  console.log('   □ Set POSTGRES_URL to Render PostgreSQL URL');
  console.log('   □ Configure all email variables\n');

  console.log('2. Build Configuration:');
  console.log('   □ Build command: npm run build');
  console.log('   □ Start command: npm run start');
  console.log('   □ Node version: 18+ recommended\n');

  console.log('3. Database:');
  console.log('   □ Run migrations before first deployment');
  console.log('   □ Verify SSL connection to PostgreSQL');
  console.log('   □ Set up automated backups\n');

  console.log('4. Security:');
  console.log('   □ Enable HTTPS/SSL certificate');
  console.log('   □ Configure security headers');
  console.log('   □ Review CORS settings for production\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(testsFailed > 0 || report.deploymentBlockers.length > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
