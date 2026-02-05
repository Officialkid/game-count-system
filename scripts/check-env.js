#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * Checks if all required environment variables are set and valid.
 * Run this before deploying or starting development.
 * 
 * Usage:
 *   node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Required environment variables
const REQUIRED_VARS = {
  // Firebase Client (Public)
  'NEXT_PUBLIC_FIREBASE_API_KEY': {
    description: 'Firebase API Key',
    example: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX',
    pattern: /^AIzaS[a-zA-Z0-9_-]{33,}$/,
    public: true,
  },
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': {
    description: 'Firebase Auth Domain',
    example: 'your-project.firebaseapp.com',
    pattern: /^[\w-]+\.firebaseapp\.com$/,
    public: true,
  },
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': {
    description: 'Firebase Project ID',
    example: 'your-project-id',
    pattern: /^[\w-]+$/,
    public: true,
  },
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': {
    description: 'Firebase Storage Bucket',
    example: 'your-project.appspot.com',
    pattern: /^[\w-]+\.(appspot\.com|firebasestorage\.app)$/,
    public: true,
  },
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': {
    description: 'Firebase Messaging Sender ID',
    example: '123456789012',
    pattern: /^\d{12}$/,
    public: true,
  },
  'NEXT_PUBLIC_FIREBASE_APP_ID': {
    description: 'Firebase App ID',
    example: '1:123456789012:web:abcdef123456',
    pattern: /^1:\d+:web:[a-f0-9]+$/,
    public: true,
  },
  
  // Firebase Admin (Private)
  'FIREBASE_ADMIN_PROJECT_ID': {
    description: 'Firebase Admin Project ID',
    example: 'your-project-id',
    pattern: /^[\w-]+$/,
    public: false,
  },
  'FIREBASE_ADMIN_CLIENT_EMAIL': {
    description: 'Firebase Admin Client Email',
    example: 'firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com',
    pattern: /^firebase-adminsdk-[\w-]+@[\w-]+\.iam\.gserviceaccount\.com$/,
    public: false,
  },
  'FIREBASE_ADMIN_PRIVATE_KEY': {
    description: 'Firebase Admin Private Key',
    example: '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"',
    pattern: /-----BEGIN PRIVATE KEY-----.*-----END PRIVATE KEY-----/s,
    public: false,
  },
  
  // Application
  'NEXT_PUBLIC_APP_URL': {
    description: 'Application Base URL',
    example: 'http://localhost:3000 or https://yourdomain.com',
    pattern: /^https?:\/\/.+$/,
    public: true,
  },
  'ADMIN_CLEANUP_SECRET': {
    description: 'Admin Cleanup Secret Key',
    example: 'random_secret_key_here',
    pattern: /.{16,}/,
    public: false,
  },
};

// Placeholder values that should not be used
const PLACEHOLDER_VALUES = [
  'your_api_key_here',
  'your_project_id',
  'your_sender_id',
  'your_app_id',
  'your_secret_key_here',
  'change_this_to_a_random_secret_key',
  'firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com',
  'YourPrivateKeyHere',
];

/**
 * Print colored message to console
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  print(`\n${'='.repeat(80)}`, 'cyan');
  print(`  ${title}`, 'cyan');
  print('='.repeat(80), 'cyan');
}

/**
 * Check if .env.local file exists
 */
function checkEnvFileExists() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    print('\n❌ .env.local file not found!', 'red');
    print('\nTo fix this:', 'yellow');
    print('  1. Copy .env.example to .env.local:', 'yellow');
    print('     cp .env.example .env.local', 'yellow');
    print('  2. Fill in your actual Firebase credentials', 'yellow');
    print('  3. Run this script again\n', 'yellow');
    return false;
  }
  
  return true;
}

/**
 * Check if a variable is set and valid
 */
function validateVariable(varName, config) {
  const value = process.env[varName];
  const errors = [];
  const warnings = [];
  
  // Check if variable is set
  if (!value) {
    errors.push(`${varName} is not set`);
    return { valid: false, errors, warnings };
  }
  
  // Check if using placeholder value
  const isPlaceholder = PLACEHOLDER_VALUES.some(placeholder => 
    value.toLowerCase().includes(placeholder.toLowerCase())
  );
  
  if (isPlaceholder) {
    warnings.push(`${varName} appears to be using a placeholder value`);
  }
  
  // Check if value matches expected pattern
  if (config.pattern && !config.pattern.test(value)) {
    errors.push(`${varName} format is invalid`);
  }
  
  // Check private key specifically
  if (varName === 'FIREBASE_ADMIN_PRIVATE_KEY') {
    if (!value.includes('\\n') && !value.includes('\n')) {
      warnings.push('FIREBASE_ADMIN_PRIVATE_KEY may not be properly formatted (missing newline characters)');
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      // Good - properly quoted
    } else if (value.includes('\n')) {
      warnings.push('FIREBASE_ADMIN_PRIVATE_KEY should be wrapped in quotes in .env.local');
    }
  }
  
  // Check if too short (potential security issue)
  if (varName === 'ADMIN_CLEANUP_SECRET' && value.length < 32) {
    warnings.push(`${varName} is short (${value.length} chars). Recommend 32+ characters for security`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all environment variables
 */
function validateAllVariables() {
  printHeader('ENVIRONMENT VARIABLES VALIDATION');
  
  let allValid = true;
  let totalErrors = 0;
  let totalWarnings = 0;
  
  const categories = {
    'Firebase Client (Public)': Object.keys(REQUIRED_VARS).filter(k => REQUIRED_VARS[k].public && k.startsWith('NEXT_PUBLIC_FIREBASE')),
    'Firebase Admin (Private)': Object.keys(REQUIRED_VARS).filter(k => !REQUIRED_VARS[k].public && k.startsWith('FIREBASE')),
    'Application': Object.keys(REQUIRED_VARS).filter(k => !k.startsWith('FIREBASE')),
  };
  
  Object.entries(categories).forEach(([category, vars]) => {
    print(`\n📋 ${category}`, 'bold');
    
    vars.forEach(varName => {
      const config = REQUIRED_VARS[varName];
      const result = validateVariable(varName, config);
      
      if (result.valid) {
        if (result.warnings.length > 0) {
          print(`  ⚠️  ${varName}`, 'yellow');
          result.warnings.forEach(warning => {
            print(`      ${warning}`, 'yellow');
            totalWarnings++;
          });
        } else {
          print(`  ✅ ${varName}`, 'green');
        }
      } else {
        print(`  ❌ ${varName}`, 'red');
        result.errors.forEach(error => {
          print(`      ${error}`, 'red');
          totalErrors++;
        });
        allValid = false;
      }
    });
  });
  
  return { allValid, totalErrors, totalWarnings };
}

/**
 * Print summary
 */
function printSummary(result) {
  printHeader('VALIDATION SUMMARY');
  
  if (result.allValid && result.totalWarnings === 0) {
    print('\n✅ All environment variables are properly configured!', 'green');
    print('   You can safely run: npm run dev', 'green');
  } else if (result.allValid) {
    print(`\n⚠️  Configuration valid with ${result.totalWarnings} warning(s)`, 'yellow');
    print('   Review warnings above before deploying to production', 'yellow');
    print('   You can run: npm run dev', 'yellow');
  } else {
    print(`\n❌ Configuration invalid with ${result.totalErrors} error(s)`, 'red');
    print('   Fix errors above before running the application', 'red');
  }
  
  print('\n📚 For help, see: ENV_SETUP_GUIDE.md\n', 'cyan');
}

/**
 * Provide helpful tips
 */
function printTips() {
  printHeader('HELPFUL TIPS');
  
  print('\n💡 Getting Firebase Credentials:', 'cyan');
  print('   1. Go to https://console.firebase.google.com', 'white');
  print('   2. Select your project', 'white');
  print('   3. Click ⚙️  → Project settings', 'white');
  print('   4. For client config: Scroll to "Your apps" → Web app', 'white');
  print('   5. For admin config: Service accounts tab → Generate new private key', 'white');
  
  print('\n💡 Common Issues:', 'cyan');
  print('   - Restart dev server after changing .env.local', 'white');
  print('   - Clear .next cache if variables not updating: rm -rf .next', 'white');
  print('   - Wrap FIREBASE_ADMIN_PRIVATE_KEY in double quotes', 'white');
  print('   - Keep \\n characters in private key (don\'t replace with actual newlines)', 'white');
  
  print('\n💡 Security:', 'cyan');
  print('   - Never commit .env.local to Git', 'white');
  print('   - Use different Firebase projects for dev/prod', 'white');
  print('   - Rotate secrets every 90 days', 'white');
  print('   - Generate strong random values for ADMIN_CLEANUP_SECRET\n', 'white');
}

/**
 * Test Firebase connection (optional)
 */
function testFirebaseConnection() {
  printHeader('FIREBASE CONNECTION TEST (Optional)');
  print('\n⏩ Skipping connection test (requires Firebase SDK)', 'yellow');
  print('   To test connection, run: npm run dev', 'yellow');
  print('   Then check browser console for Firebase initialization', 'yellow');
}

/**
 * Main function
 */
function main() {
  try {
    // Print header
    print('\n🔍 Game Count System - Environment Variables Checker', 'bold');
    
    // Check if .env.local exists
    if (!checkEnvFileExists()) {
      process.exit(1);
    }
    
    // Load environment variables from .env.local
    require('dotenv').config({ path: '.env.local' });
    
    // Validate all variables
    const result = validateAllVariables();
    
    // Print summary
    printSummary(result);
    
    // Print helpful tips if there are errors or warnings
    if (!result.allValid || result.totalWarnings > 0) {
      printTips();
    }
    
    // Test connection (optional)
    if (result.allValid && process.argv.includes('--test-connection')) {
      testFirebaseConnection();
    }
    
    // Exit with appropriate code
    process.exit(result.allValid ? 0 : 1);
    
  } catch (error) {
    print(`\n❌ Unexpected error: ${error.message}`, 'red');
    print('   Stack trace:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  // Check if dotenv is installed
  try {
    require('dotenv');
  } catch (error) {
    console.error('\n❌ Error: dotenv package not found');
    console.error('   Install it with: npm install dotenv');
    process.exit(1);
  }
  
  main();
}

module.exports = { validateAllVariables, REQUIRED_VARS };
