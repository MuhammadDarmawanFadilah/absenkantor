#!/usr/bin/env node

/**
 * PWA Update Testing Script
 * Tests PWA update functionality and cache invalidation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 PWA Update Test Script');
console.log('=========================');

// Check if service worker exists
const swPath = path.join(__dirname, '../public/sw.js');
if (!fs.existsSync(swPath)) {
    console.log('❌ Service worker not found at:', swPath);
    console.log('💡 Run: npm run generate-sw first');
    process.exit(1);
}

// Read service worker content
const swContent = fs.readFileSync(swPath, 'utf8');

// Extract information
const versionMatch = swContent.match(/const VERSION = '([^']+)'/);
const buildTimeMatch = swContent.match(/const BUILD_TIME = (\d+)/);
const deploymentIdMatch = swContent.match(/const DEPLOYMENT_ID = '([^']+)'/);
const cacheNameMatch = swContent.match(/CACHE_NAME = .*?absensi-lampung-v([^`]+)`/);

const version = versionMatch ? versionMatch[1] : 'unknown';
const buildTime = buildTimeMatch ? parseInt(buildTimeMatch[1]) : 0;
const deploymentId = deploymentIdMatch ? deploymentIdMatch[1] : 'unknown';

console.log('📊 Current Service Worker Status:');
console.log('--------------------------------');
console.log(`📦 Version: ${version}`);
console.log(`🆔 Deployment ID: ${deploymentId}`);
console.log(`⏰ Build Time: ${new Date(buildTime).toLocaleString()}`);
console.log(`📅 Age: ${Math.round((Date.now() - buildTime) / 1000)} seconds`);

// Check cache strategy
if (swContent.includes('skipWaiting()')) {
    console.log('✅ Skip Waiting: Enabled (immediate activation)');
} else {
    console.log('⚠️  Skip Waiting: Disabled');
}

if (swContent.includes('clients.claim()')) {
    console.log('✅ Claims Clients: Enabled (immediate control)');
} else {
    console.log('⚠️  Claims Clients: Disabled');
}

if (swContent.includes('SW_UPDATED')) {
    console.log('✅ Update Notification: Enabled');
} else {
    console.log('⚠️  Update Notification: Disabled');
}

// Check cache invalidation strategy
console.log('');
console.log('🔄 Cache Invalidation Strategy:');
console.log('-------------------------------');

if (swContent.includes('caches.delete(cache)')) {
    console.log('✅ Old Cache Cleanup: Enabled');
} else {
    console.log('⚠️  Old Cache Cleanup: Disabled');
}

const cacheNamePattern = swContent.match(/CACHE_NAME = (.+)/);
if (cacheNamePattern) {
    console.log(`📝 Cache Pattern: ${cacheNamePattern[1].trim()}`);
    
    if (cacheNamePattern[1].includes('DEPLOYMENT_ID')) {
        console.log('✅ Deployment-based Cache: Enabled (guarantees invalidation)');
    } else if (cacheNamePattern[1].includes('BUILD_TIME')) {
        console.log('✅ Time-based Cache: Enabled');
    } else {
        console.log('⚠️  Static Cache: May not invalidate properly');
    }
}

// Test cache name generation
console.log('');
console.log('🧪 Cache Name Test:');
console.log('-------------------');

const isDev = false; // Simulate production
const testCacheName = isDev ? 
    `absensi-lampung-dev-${buildTime}` : 
    `absensi-lampung-v${version}-${deploymentId}`;

console.log(`🏗️  Generated Cache Name: ${testCacheName}`);

// Recommendations
console.log('');
console.log('💡 Recommendations:');
console.log('-------------------');

const age = (Date.now() - buildTime) / 1000;
if (age > 300) { // More than 5 minutes old
    console.log('⚠️  Service worker is old. Consider regenerating for deployment.');
    console.log('   Run: npm run generate-sw');
}

if (!swContent.includes('DEPLOYMENT_ID')) {
    console.log('⚠️  Consider adding deployment ID for better cache invalidation');
}

if (!swContent.includes('postMessage')) {
    console.log('⚠️  Consider adding client messaging for update notifications');
}

// Test URLs
console.log('');
console.log('🌐 Test URLs (replace with your domain):');
console.log('----------------------------------------');
console.log('• Service Worker: https://absenkantor.my.id/sw.js');
console.log('• Manifest: https://absenkantor.my.id/manifest.json');
console.log('• Cache Test: Open DevTools > Application > Storage > Cache Storage');
console.log('• Update Test: Deploy new version and check for update banner');

console.log('');
console.log('🔧 Manual Testing Steps:');
console.log('------------------------');
console.log('1. Deploy application using ./redeploy-frontend-absenkantor.sh');
console.log('2. Open https://absenkantor.my.id in browser');
console.log('3. Install PWA if not already installed');
console.log('4. Note current deployment ID in console');
console.log('5. Deploy again (new deployment ID will be generated)');
console.log('6. Check for update notification banner');
console.log('7. Verify new deployment ID in DevTools console');

console.log('');
console.log('✅ PWA Update Test Complete!');