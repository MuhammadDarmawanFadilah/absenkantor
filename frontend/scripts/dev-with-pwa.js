#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting development server with PWA auto-update...');

// Generate initial service worker
const generateSW = require('./generate-sw.js');

// Start Next.js dev server
const nextDev = spawn('pnpm', ['next', 'dev', '--turbopack'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

// Watch for file changes and regenerate service worker
const chokidar = require('fs').watch ? require('fs').watch : null;

if (chokidar) {
  const watchPaths = [
    path.join(__dirname, '../src'),
    path.join(__dirname, '../public'),
    path.join(__dirname, '../package.json')
  ];

  let timeout = null;
  
  watchPaths.forEach(watchPath => {
    if (fs.existsSync(watchPath)) {
      fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.js'))) {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            console.log('🔄 File changed, regenerating service worker...');
            try {
              require('./generate-sw.js');
              console.log('✅ Service worker updated!');
            } catch (error) {
              console.error('❌ Error regenerating service worker:', error);
            }
          }, 1000); // Debounce for 1 second
        }
      });
    }
  });
  
  console.log('👀 Watching for file changes...');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  nextDev.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextDev.kill();
  process.exit(0);
});