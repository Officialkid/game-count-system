#!/usr/bin/env node
/**
 * Final Appwrite Cleanup Script
 * Searches for and reports any remaining Appwrite references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Files that should be deleted or fixed
const problematicFiles = [
  'lib/api-client.ts',
  'lib/hooks/useEventStream.ts',
  'lib/hooks/useAuthDiagnostics.ts',
  'app/settings/page.tsx',
  'app/recap/page.tsx',
  'app/events/page.tsx',
  'app/debug/appwrite/page.tsx',
  'app/dashboard/page.tsx',
  'app/admin/audit-logs/page.tsx',
  'app/api/health/route.ts',
  'scripts/test-appwrite-import.mjs',
  'scripts/deploy-appwrite.sh'
];

log('\n' + '='.repeat(60), 'cyan');
log('🧹 FINAL APPWRITE CLEANUP REPORT', 'cyan');
log('='.repeat(60), 'cyan');

log('\n📋 Files with Appwrite imports:', 'yellow');

let foundIssues = 0;

for (const file of problematicFiles) {
  const fullPath = path.join(process.cwd(), file);
  
  if (fs.existsSync(fullPath)) {
    foundIssues++;
    log(`  ❌ ${file}`, 'red');
  } else {
    log(`  ✅ ${file} (not found / deleted)`, 'green');
  }
}

log('\n📊 Summary:', 'cyan');
log(`  Found: ${foundIssues} files with Appwrite references`, foundIssues > 0 ? 'red' : 'green');

if (foundIssues > 0) {
  log('\n⚠️  ACTION REQUIRED:', 'yellow');
  log('  These files need to be either:', 'yellow');
  log('    1. Updated to use new PostgreSQL backend', 'yellow');
  log('    2. Deleted if no longer needed', 'yellow');
  
  log('\n💡 Recommendation:', 'cyan');
  log('  Most of these files are UI pages that depend on old Appwrite services.', 'cyan');
  log('  They should be updated to use the new REST API endpoints instead.', 'cyan');
  
  process.exit(1);
} else {
  log('\n🎉 All clear! No Appwrite references found in code.', 'green');
  process.exit(0);
}
