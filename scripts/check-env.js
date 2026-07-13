#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * Validates the Prisma/Neon environment contract used by the app.
 *
 * Usage:
 *   node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const REQUIRED_VARS = {
  DATABASE_URL: {
    description: 'Primary Prisma runtime connection string',
    pattern: /^postgres(ql)?:\/\/.+/i,
  },
  NEXT_PUBLIC_APP_URL: {
    description: 'Public application URL',
    pattern: /^https?:\/\/.+$/i,
  },
  NEXT_PUBLIC_BASE_URL: {
    description: 'Public base URL',
    pattern: /^https?:\/\/.+$/i,
  },
  NEXT_PUBLIC_API_BASE_URL: {
    description: 'Public API base URL',
    pattern: /^https?:\/\/.+$/i,
  },
  CRON_SECRET: {
    description: 'Cleanup cron secret',
    pattern: /^.{16,}$/,
  },
  ADMIN_CLEANUP_SECRET: {
    description: 'Admin cleanup secret',
    pattern: /^.{16,}$/,
  },
};

const OPTIONAL_VARS = {
  APP_URL: {
    description: 'Server-side application URL',
    pattern: /^https?:\/\/.+$/i,
  },
  NEXT_PUBLIC_URL: {
    description: 'Legacy-compatible public URL',
    pattern: /^https?:\/\/.+$/i,
  },
  DIRECT_DATABASE_URL: {
    description: 'Direct connection string for migrations/admin tooling',
    pattern: /^postgres(ql)?:\/\/.+/i,
  },
};

const PLACEHOLDERS = [
  'replace_with_a_long_random_secret',
  'postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME',
];

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  print(`\n${'='.repeat(80)}`, 'cyan');
  print(`  ${title}`, 'cyan');
  print('='.repeat(80), 'cyan');
}

function checkEnvFileExists() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    return true;
  }

  print('\n.env.local file not found.', 'red');
  print('Copy .env.example or .env.local.example to .env.local and fill in real values.\n', 'yellow');
  return false;
}

function loadEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hasPlaceholder(value) {
  return PLACEHOLDERS.some((placeholder) => value.includes(placeholder));
}

function validateVariable(varName, config, required = true) {
  const value = process.env[varName];
  const errors = [];
  const warnings = [];

  if (!value) {
    if (required) {
      errors.push(`${varName} is not set`);
    }
    return { valid: !required, errors, warnings };
  }

  if (config.pattern && !config.pattern.test(value)) {
    errors.push(`${varName} format is invalid`);
  }

  if (hasPlaceholder(value)) {
    warnings.push(`${varName} appears to still use a template placeholder`);
  }

  if ((varName === 'CRON_SECRET' || varName === 'ADMIN_CLEANUP_SECRET') && value.length < 32) {
    warnings.push(`${varName} is valid but shorter than the recommended 32 characters`);
  }

  if ((varName === 'DATABASE_URL' || varName === 'DIRECT_DATABASE_URL') && !/neon\.tech/i.test(value)) {
    warnings.push(`${varName} does not look like a Neon connection string`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateGroup(title, vars, required = true) {
  print(`\n${title}`, 'bold');

  let allValid = true;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const [varName, config] of Object.entries(vars)) {
    const result = validateVariable(varName, config, required);

    if (result.valid) {
      if (result.warnings.length > 0) {
        print(`  WARN ${varName}`, 'yellow');
        for (const warning of result.warnings) {
          print(`      ${warning}`, 'yellow');
          totalWarnings++;
        }
      } else if (process.env[varName]) {
        print(`  OK   ${varName}`, 'green');
      } else {
        print(`  SKIP ${varName}`, 'yellow');
      }
    } else {
      print(`  ERR  ${varName}`, 'red');
      for (const error of result.errors) {
        print(`      ${error}`, 'red');
        totalErrors++;
      }
      allValid = false;
    }
  }

  return { allValid, totalErrors, totalWarnings };
}

function printSummary(result) {
  printHeader('VALIDATION SUMMARY');

  if (result.allValid && result.totalWarnings === 0) {
    print('\nEnvironment configuration looks good for local Prisma/Neon development.', 'green');
  } else if (result.allValid) {
    print(`\nEnvironment is valid with ${result.totalWarnings} warning(s).`, 'yellow');
  } else {
    print(`\nEnvironment is invalid with ${result.totalErrors} error(s).`, 'red');
  }

  print('\nExpected local app URL: http://localhost:3002', 'cyan');
  print('Expected production app URL: https://game-count-system.vercel.app', 'cyan');
}

function main() {
  try {
    print('\nGame Count System - Environment Checker', 'bold');

    if (!checkEnvFileExists()) {
      process.exit(1);
    }

    const rootEnvPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(rootEnvPath)) {
      loadEnvFile(rootEnvPath);
    }
    loadEnvFile(path.join(process.cwd(), '.env.local'));

    printHeader('REQUIRED VARIABLES');
    const requiredResults = validateGroup('Required', REQUIRED_VARS, true);

    printHeader('OPTIONAL VARIABLES');
    const optionalResults = validateGroup('Optional', OPTIONAL_VARS, false);

    const result = {
      allValid: requiredResults.allValid && optionalResults.allValid,
      totalErrors: requiredResults.totalErrors + optionalResults.totalErrors,
      totalWarnings: requiredResults.totalWarnings + optionalResults.totalWarnings,
    };

    printSummary(result);
    process.exit(result.allValid ? 0 : 1);
  } catch (error) {
    print(`\nUnexpected error: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateVariable, REQUIRED_VARS, OPTIONAL_VARS };
