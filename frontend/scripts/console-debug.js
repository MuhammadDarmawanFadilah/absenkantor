#!/usr/bin/env node

/**
 * Debug script to analyze console.log removal behavior
 */

const fs = require('fs');
const path = require('path');

// Test if SWC compiler is working
function checkBuildConfig() {
  console.log('🔧 Checking build configuration...');
  
  const candidates = ['../next.config.js', '../next.config.mjs', '../next.config.ts'];
  const nextConfigPath = candidates.map((p) => path.join(__dirname, p)).find((p) => fs.existsSync(p));
  if (nextConfigPath) {
    const config = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (config.includes('removeConsole')) {
      console.log(`✅ removeConsole found in ${path.basename(nextConfigPath)}`);
      
      // Check if it's enabled for production
      if (config.includes('NODE_ENV === "production"')) {
        console.log('✅ Console removal configured for production');
      } else {
        console.log('⚠️ Console removal may not be properly configured for production');
      }
    } else {
      console.log(`❌ removeConsole not found in ${path.basename(nextConfigPath)}`);
    }
  }
}

// Check environment variables
function checkEnvironment() {
  console.log('\n🌍 Environment check:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('NEXT_PHASE:', process.env.NEXT_PHASE || 'not set');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ NODE_ENV is not set to "production" - console removal may not be active');
  } else {
    console.log('✅ NODE_ENV is set to production');
  }
}

// Check specific source file vs build output
function compareBuildOutput() {
  console.log('\n🔍 Comparing source vs build output...');
  
  // Find a source file with console.log
  const sourceFile = path.join(__dirname, '../src/app/layout.tsx');
  if (fs.existsSync(sourceFile)) {
    const sourceContent = fs.readFileSync(sourceFile, 'utf8');
    const consoleLogsInSource = (sourceContent.match(/console\.log/g) || []).length;
    
    console.log(`📄 Source file (layout.tsx) has ${consoleLogsInSource} console.log statements`);
    
    // Check corresponding build file
    const buildFiles = [
      path.join(__dirname, '../.next/static/chunks/app/layout-*.js'),
      path.join(__dirname, '../.next/static/chunks/app/page-*.js')
    ];
    
    // Use glob to find actual files
    const glob = require('glob');
    const foundFiles = glob.sync('../.next/static/chunks/app/layout-*.js', { cwd: __dirname });
    
    if (foundFiles.length > 0) {
      const buildFile = path.join(__dirname, foundFiles[0]);
      if (fs.existsSync(buildFile)) {
        const buildContent = fs.readFileSync(buildFile, 'utf8');
        const consoleLogsInBuild = (buildContent.match(/console\.log/g) || []).length;
        
        console.log(`🏗️ Build file has ${consoleLogsInBuild} console.log statements`);
        
        if (consoleLogsInSource > 0 && consoleLogsInBuild === 0) {
          console.log('✅ Console.log statements successfully removed from build!');
        } else if (consoleLogsInSource > 0 && consoleLogsInBuild > 0) {
          console.log('❌ Console.log statements NOT removed from build');
        }
      }
    } else {
      console.log('⚠️ Could not find build file to compare');
    }
  }
}

// Check if we're in the right build mode
function checkBuildMode() {
  console.log('\n🏗️ Build mode analysis:');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const buildScript = packageJson.scripts?.build;
    
    console.log('Build script:', buildScript);
    
    if (buildScript?.includes('next build')) {
      console.log('✅ Using standard Next.js build');
    } else {
      console.log('⚠️ Non-standard build script detected');
    }
  }
}

// Main execution
console.log('🧪 Console.log Removal Debug Analysis');
console.log('=====================================');

checkBuildConfig();
checkEnvironment();
checkBuildMode();
compareBuildOutput();

console.log('\n📋 Recommendations:');
console.log('1. Ensure NODE_ENV=production during build');
console.log('2. Use: npm run build (not npm run dev)');
console.log('3. Check that Next.js compiler.removeConsole is properly configured');
console.log('4. Consider that console.error and console.warn should remain (by design)');