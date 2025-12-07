#!/usr/bin/env node

/**
 * Production Environment Check Script
 * Validates that all required environment variables are set
 * Run this before deploying to production
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Required environment variables for production
const REQUIRED_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NODE_ENV',
];

// Recommended environment variables
const RECOMMENDED_VARS = [
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'SENTRY_DSN',
];

// Check if .env.production exists
const envPath = path.join(process.cwd(), '.env.production');
const envExamplePath = path.join(process.cwd(), '.env.production.example');

function checkEnvFile() {
  if (!fs.existsSync(envPath)) {
    log('❌ .env.production file not found!', 'red');
    log(`   Please copy .env.production.example to .env.production`, 'yellow');
    log(`   Command: cp .env.production.example .env.production`, 'yellow');
    return false;
  }
  log('✅ .env.production file exists', 'green');
  return true;
}

function loadEnvFile() {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value.trim();
      }
    }
  });
  
  return envVars;
}

function checkRequiredVars(envVars) {
  let allPresent = true;
  
  log('\n📋 Checking Required Variables:', 'blue');
  REQUIRED_VARS.forEach(varName => {
    const value = envVars[varName];
    if (!value || value === '') {
      log(`   ❌ ${varName} - MISSING`, 'red');
      allPresent = false;
    } else if (varName === 'NEXTAUTH_SECRET' && value.length < 32) {
      log(`   ⚠️  ${varName} - TOO SHORT (min 32 chars)`, 'yellow');
    } else if (varName === 'NEXTAUTH_URL' && !value.startsWith('https://')) {
      log(`   ⚠️  ${varName} - Should use HTTPS in production`, 'yellow');
    } else {
      log(`   ✅ ${varName}`, 'green');
    }
  });
  
  return allPresent;
}

function checkRecommendedVars(envVars) {
  log('\n💡 Checking Recommended Variables:', 'blue');
  RECOMMENDED_VARS.forEach(varName => {
    const value = envVars[varName];
    if (!value || value === '') {
      log(`   ⚠️  ${varName} - Not set (recommended)`, 'yellow');
    } else {
      log(`   ✅ ${varName}`, 'green');
    }
  });
}

function checkSecurity(envVars) {
  log('\n🔐 Security Checks:', 'blue');
  
  // Check NEXTAUTH_SECRET strength
  if (envVars.NEXTAUTH_SECRET) {
    if (envVars.NEXTAUTH_SECRET.length < 32) {
      log('   ⚠️  NEXTAUTH_SECRET is too short (min 32 chars)', 'yellow');
    } else if (envVars.NEXTAUTH_SECRET.includes('change-this') || 
               envVars.NEXTAUTH_SECRET.includes('example')) {
      log('   ⚠️  NEXTAUTH_SECRET appears to be a default value', 'yellow');
    } else {
      log('   ✅ NEXTAUTH_SECRET is strong', 'green');
    }
  }
  
  // Check NEXTAUTH_URL
  if (envVars.NEXTAUTH_URL) {
    if (!envVars.NEXTAUTH_URL.startsWith('https://')) {
      log('   ⚠️  NEXTAUTH_URL should use HTTPS in production', 'yellow');
    } else {
      log('   ✅ NEXTAUTH_URL uses HTTPS', 'green');
    }
  }
  
  // Check NODE_ENV
  if (envVars.NODE_ENV !== 'production') {
    log('   ⚠️  NODE_ENV is not set to "production"', 'yellow');
  } else {
    log('   ✅ NODE_ENV is set to production', 'green');
  }
}

function main() {
  log('\n🚀 Production Environment Check\n', 'blue');
  
  // Check if .env.production exists
  if (!checkEnvFile()) {
    process.exit(1);
  }
  
  // Load environment variables
  const envVars = loadEnvFile();
  
  // Check required variables
  const allRequiredPresent = checkRequiredVars(envVars);
  
  // Check recommended variables
  checkRecommendedVars(envVars);
  
  // Security checks
  checkSecurity(envVars);
  
  // Summary
  log('\n📊 Summary:', 'blue');
  if (allRequiredPresent) {
    log('✅ All required variables are set', 'green');
    log('   You can proceed with production deployment', 'green');
    log('\n⚠️  Remember to:', 'yellow');
    log('   - Never commit .env.production to Git', 'yellow');
    log('   - Use a secrets manager in production', 'yellow');
    log('   - Enable HTTPS', 'yellow');
    log('   - Setup automated backups', 'yellow');
    process.exit(0);
  } else {
    log('❌ Some required variables are missing', 'red');
    log('   Please fix the issues above before deploying', 'red');
    process.exit(1);
  }
}

main();

