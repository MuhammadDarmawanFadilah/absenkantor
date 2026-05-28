// PWA Cache Utility Functions
// Add this to your browser console to manually manage PWA cache

window.PWAUtils = {
  // Clear all PWA caches
  async clearAllCaches() {
    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cache => caches.delete(cache));
      await Promise.all(deletePromises);
      console.log('✅ All PWA caches cleared:', cacheNames);
      return cacheNames;
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      throw error;
    }
  },

  // Unregister all service workers
  async unregisterAllServiceWorkers() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const unregisterPromises = registrations.map(reg => reg.unregister());
        await Promise.all(unregisterPromises);
        console.log('✅ All service workers unregistered:', registrations.length);
        return registrations;
      }
    } catch (error) {
      console.error('❌ Error unregistering service workers:', error);
      throw error;
    }
  },

  // Full PWA reset (clear cache + unregister SW + reload)
  async fullReset() {
    try {
      await this.clearAllCaches();
      await this.unregisterAllServiceWorkers();
      console.log('🔄 Reloading page...');
      window.location.reload();
    } catch (error) {
      console.error('❌ Error during full reset:', error);
      throw error;
    }
  },

  // Check current cache status
  async checkCacheStatus() {
    try {
      const cacheNames = await caches.keys();
      console.log('📋 Current caches:', cacheNames);
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        console.log(`📦 Cache "${cacheName}" contains ${keys.length} items:`, keys.map(k => k.url));
      }
      
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🔧 Service worker registrations:', registrations.length);
        registrations.forEach((reg, index) => {
          console.log(`  SW ${index + 1}:`, reg.scope, reg.active?.state);
        });
      }
      
      return { cacheNames, registrations: await navigator.serviceWorker.getRegistrations() };
    } catch (error) {
      console.error('❌ Error checking cache status:', error);
      throw error;
    }
  },

  // Force service worker update
  async forceUpdate() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update();
          console.log('🔄 Updated service worker:', registration.scope);
        }
      }
    } catch (error) {
      console.error('❌ Error updating service worker:', error);
      throw error;
    }
  }
};

// Add helpful shortcuts
window.clearPWA = () => window.PWAUtils.fullReset();
window.checkPWA = () => window.PWAUtils.checkCacheStatus();
window.updatePWA = () => window.PWAUtils.forceUpdate();

console.log('🛠️  PWA Utils loaded! Available commands:');
console.log('- window.clearPWA() - Full PWA reset');
console.log('- window.checkPWA() - Check cache status');
console.log('- window.updatePWA() - Force SW update');
console.log('- window.PWAUtils - All utility functions');