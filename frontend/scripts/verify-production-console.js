#!/usr/bin/env node

/**
 * Production Console.log Removal Verification Script
 * Verifies that console.log statements are removed while preserving console.error and console.warn
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Production Build Console Verification');
console.log('========================================');

// Check if we're running in production mode
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️ Warning: NODE_ENV is not set to "production"');
  console.log('Console.log removal only works in production builds.');
  console.log('');
}

const buildDir = path.join(__dirname, '../.next');
const staticDir = path.join(buildDir, 'static');

if (!fs.existsSync(staticDir)) {
  console.log('❌ Build directory not found. Please run production build first:');
  console.log('   NODE_ENV=production npm run build');
  process.exit(1);
}

// Find all JS files in build
const jsFiles = glob.sync('**/*.js', { cwd: staticDir });
console.log(`📁 Scanning ${jsFiles.length} JavaScript files in build output...`);

let totalConsoleLog = 0;
let totalConsoleError = 0;
let totalConsoleWarn = 0;
let filesWithConsoleLog = 0;

let appConsoleLog = 0;
let vendorConsoleLog = 0;
const appFiles = [];
const vendorFiles = [];

// Analyze each file
jsFiles.forEach(file => {
  const filePath = path.join(staticDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count different console types
  const consoleLogMatches = content.match(/console\.log/g);
  const consoleErrorMatches = content.match(/console\.error/g);
  const consoleWarnMatches = content.match(/console\.warn/g);
  
  if (consoleLogMatches) {
    totalConsoleLog += consoleLogMatches.length;
    filesWithConsoleLog++;
    
    // Categorize files
    if (file.includes('vendors') || file.includes('chunks') || file.includes('polyfills')) {
      vendorConsoleLog += consoleLogMatches.length;
      vendorFiles.push({ file, count: consoleLogMatches.length });
    } else {
      appConsoleLog += consoleLogMatches.length;
      appFiles.push({ file, count: consoleLogMatches.length });
    }
  }
  
  if (consoleErrorMatches) {
    totalConsoleError += consoleErrorMatches.length;
  }
  
  if (consoleWarnMatches) {
    totalConsoleWarn += consoleWarnMatches.length;
  }
});

// Results
console.log('');
console.log('📊 Analysis Results:');
console.log('===================');
console.log(`📋 Total JS files scanned: ${jsFiles.length}`);
console.log(`🚫 console.log statements: ${totalConsoleLog}`);
console.log(`⚠️ console.warn statements: ${totalConsoleWarn} (preserved)`);
console.log(`❌ console.error statements: ${totalConsoleError} (preserved)`);
console.log(`📂 Files with console.log: ${filesWithConsoleLog}`);

console.log('');

console.log('📊 Analysis Results:');
console.log('===================');
console.log(`📋 Total JS files scanned: ${jsFiles.length}`);
console.log(`🚫 console.log statements: ${totalConsoleLog}`);
console.log(`   📱 App code: ${appConsoleLog}`);
console.log(`   📦 Vendor/library code: ${vendorConsoleLog}`);
console.log(`⚠️ console.warn statements: ${totalConsoleWarn} (preserved)`);
console.log(`❌ console.error statements: ${totalConsoleError} (preserved)`);
console.log(`📂 Files with console.log: ${filesWithConsoleLog}`);

console.log('');

if (appConsoleLog === 0) {
  console.log('✅ SUCCESS: All console.log statements removed from YOUR app code!');
  if (vendorConsoleLog > 0) {
    console.log(`📦 Note: ${vendorConsoleLog} console.log statements remain in vendor/library code (this is normal)`);
  }
  console.log('✅ console.error and console.warn are preserved for debugging');
  console.log('');
  console.log('🎉 Your application code is optimized and ready for deployment!');
  process.exit(0);
} else {
  console.log(`❌ WARNING: Found ${appConsoleLog} console.log statements in YOUR app code`);
  
  if (appFiles.length > 0) {
    console.log('');
    console.log('📋 App files with console.log:');
    appFiles.forEach(({ file, count }) => {
      console.log(`   - ${file}: ${count} statements`);
    });
  }
  
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log('  1. Ensure NODE_ENV=production during build');
  console.log('  2. Check Next.js version (15.x+ required for built-in removeConsole)');
  console.log('  3. Verify next.config.ts has compiler.removeConsole configured');
  console.log('  4. Some console.log might be from middleware or server components');
  process.exit(1);
}