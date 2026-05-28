#!/usr/bin/env node

/**
 * PWA Update Simulation Script
 * Simulates deployment to test PWA update functionality
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 PWA Update Simulation');
console.log('========================');

console.log('');
console.log('This script will:');
console.log('1. Generate a new service worker with unique deployment ID');
console.log('2. Simulate a production build');
console.log('3. Show you the new deployment ID');
console.log('');

// Generate new service worker
console.log('🔧 Generating new service worker...');
try {
  execSync('node scripts/generate-sw.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('❌ Error generating service worker:', error.message);
  process.exit(1);
}

// Read the generated service worker to show deployment ID
const fs = require('fs');
const swPath = path.join(__dirname, '../public/sw.js');

if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  const deploymentMatch = swContent.match(/DEPLOYMENT_ID = '([^']+)'/);
  
  if (deploymentMatch) {
    const deploymentId = deploymentMatch[1];
    
    console.log('');
    console.log('✅ New service worker generated!');
    console.log('🆔 New Deployment ID:', deploymentId);
    console.log('');
    console.log('📋 Testing Instructions:');
    console.log('------------------------');
    console.log('1. Start development server: npm run dev');
    console.log('2. Open browser and note current deployment ID in console');
    console.log('3. Run this script again to generate new deployment ID');
    console.log('4. Check if update notification appears');
    console.log('');
    console.log('🌐 Production Testing:');
    console.log('----------------------');
    console.log('1. Deploy current version to production');
    console.log('2. Open https://absenkantor.my.id in browser');
    console.log('3. Note current deployment ID in browser console');
    console.log('4. Run deployment script again');
    console.log('5. Check for update notification banner');
    console.log('');
    console.log('🔍 Debug Commands (Browser Console):');
    console.log('------------------------------------');
    console.log('• window.checkPWA() - Check current cache status');
    console.log('• window.updatePWA() - Force service worker update');
    console.log('• window.clearPWA() - Clear all PWA cache');
    console.log('');
  } else {
    console.log('⚠️  Could not find deployment ID in generated service worker');
  }
} else {
  console.log('❌ Service worker file not found at:', swPath);
}