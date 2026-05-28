#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
// Use current timestamp for each build to ensure cache invalidation
const buildTime = new Date().getTime();
const deploymentId = Math.random().toString(36).substring(2, 8); // Random 6-char ID
const version = require('../package.json').version || '1.0.0';

console.log('🔧 Generating Service Worker...');
console.log('🏗️  Environment:', isDev ? 'Development' : 'Production');
console.log('📦 Version:', version);
console.log('⏰ Build Time:', new Date(buildTime).toLocaleString());
console.log('🆔 Deployment ID:', deploymentId);

const swTemplate = `// Service Worker for PWA - Auto-generated
// Generated at: ${new Date().toISOString()}
// Deployment ID: ${deploymentId}

// Dynamic cache name with timestamp for development
const VERSION = '${version}';
const BUILD_TIME = ${buildTime};
const DEPLOYMENT_ID = '${deploymentId}';
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const CACHE_NAME = isDev ? \`absensi-lampung-dev-\${BUILD_TIME}\` : \`absensi-lampung-v\${VERSION}-\${DEPLOYMENT_ID}\`;
const OFFLINE_URL = '/offline';

// Files to cache immediately - only existing files
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json'
  // Dynamic logo and favicon will be added if they exist
];

// Add optional static files if they exist
const OPTIONAL_STATIC_FILES = [
  '/logo.png',
  '/logo.svg', 
  '/favicon.ico'
];

// Check for optional files in runtime within service worker
const getStaticCacheUrls = () => {
  const baseUrls = [
    '/',
    '/offline',
    '/manifest.json'
  ];
  
  return baseUrls; // Only cache essential files initially
};

// Install event - cache static files with improved error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event - Cache:', CACHE_NAME);
  console.log('Service Worker: Deployment ID:', DEPLOYMENT_ID);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential static files');
        
        // Cache essential files first
        const essentialUrls = getStaticCacheUrls();
        
        return Promise.allSettled(
          essentialUrls.map(url => {
            return cache.add(url).catch(error => {
              console.warn('Service Worker: Failed to cache essential file:', url, error);
              return null;
            });
          })
        ).then(results => {
          const successful = results.filter(result => result.status === 'fulfilled').length;
          const failed = results.filter(result => result.status === 'rejected').length;
          console.log(\`Service Worker: Cached \${successful}/\${essentialUrls.length} essential files\`);
          
          // Try to cache optional files
          return Promise.allSettled(
            OPTIONAL_STATIC_FILES.map(url => {
              return fetch(url, { method: 'HEAD' })
                .then(response => {
                  if (response.ok) {
                    return cache.add(url);
                  } else {
                    console.log('Service Worker: Optional file not found:', url);
                    return null;
                  }
                })
                .catch(error => {
                  console.log('Service Worker: Optional file not accessible:', url);
                  return null;
                });
            })
          );
        }).then(optionalResults => {
          const optionalSuccessful = optionalResults.filter(result => 
            result.status === 'fulfilled' && result.value !== null
          ).length;
          console.log(\`Service Worker: Cached \${optionalSuccessful}/\${OPTIONAL_STATIC_FILES.length} optional files\`);
          
          return true;
        });
      })
      .catch((error) => {
        console.error('Service Worker: Error opening cache:', error);
        return true; // Don't fail installation
      })
  );
  
  // Force the service worker to take control immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  console.log('Service Worker: New deployment activated:', DEPLOYMENT_ID);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        // Take control of all open clients
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients about the update
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              deploymentId: DEPLOYMENT_ID,
              buildTime: BUILD_TIME,
              message: 'New version available!'
            });
          });
        });
      })
  );
});

// Fetch event - serve files from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip CSS files to prevent MIME type confusion
  if (event.request.url.includes('.css') || 
      event.request.url.includes('/_next/static/css/')) {
    return;
  }

  // Skip Next.js dev files
  if (event.request.url.includes('/_next/webpack-hmr') || 
      event.request.url.includes('/_next/static/webpack/') ||
      event.request.url.includes('/__nextjs_original-stack-frame')) {
    return;
  }
  
  event.respondWith(
    // In development, always try network first for better development experience
    isDev ? 
      fetch(event.request)
        .then((response) => {
          // Don't cache in development for most files except static assets
          if (event.request.url.includes('/logo.') || 
              event.request.url.includes('/favicon.') ||
              event.request.url.includes('/manifest.json')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              // Network failed, try to serve offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              // For other requests, try to find any suitable cached response
              return caches.match('/');
            });
        })
    :
      // Production: Cache first strategy
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Fetch from network
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response before caching
              const responseToCache = response.clone();
              
              // Cache GET requests to same origin
              if (event.request.url.startsWith(self.location.origin)) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            })
            .catch(() => {
              // Network failed, try to serve offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              
              // For other requests, try to find any suitable cached response
              return caches.match('/');
            });
        })
  );
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from Absensi Lampung',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/logo.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/logo.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Absensi Lampung', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync (optional)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      console.log('Performing background sync')
    );
  }
});

console.log('Service Worker: Loaded successfully');
console.log('Environment:', isDev ? 'Development' : 'Production');
console.log('Cache Name:', CACHE_NAME);
console.log('Build Time:', new Date(BUILD_TIME).toLocaleString());
`;

// Write the service worker file
const swPath = path.join(__dirname, '../public/sw.js');
fs.writeFileSync(swPath, swTemplate);

console.log('✅ Service worker generated successfully!');
console.log('📁 Path:', swPath);
console.log('🏗️  Environment:', isDev ? 'Development' : 'Production');
console.log('⏰ Build time:', new Date(buildTime).toLocaleString());