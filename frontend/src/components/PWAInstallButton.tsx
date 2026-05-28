"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Check PWA support
    const checkPWASupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
      
      // More lenient PWA support - just need service worker and manifest
      setIsSupported(hasServiceWorker && hasManifest);
      
      console.log('PWA Support Check:', {
        serviceWorker: hasServiceWorker,
        manifest: hasManifest,
        manifestElement: document.querySelector('link[rel="manifest"]'),
        userAgent: navigator.userAgent
      });
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
      console.log('PWA: Install check - isStandalone:', isStandalone);
      return isStandalone;
    };

    checkPWASupport();
    const installed = checkIfInstalled();

    // Only add event listeners if not installed and PWA is supported
    if (!installed && isSupported) {
      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
        console.log('PWA: beforeinstallprompt event fired');
        
        // Validate the event has required methods
        if (typeof e.prompt !== 'function') {
          console.log('PWA: Invalid beforeinstallprompt event - missing prompt method');
          return;
        }

        // Prevent browser from showing default prompt
        e.preventDefault();
        
        // Save event for later use
        setDeferredPrompt(e);
        
        // Set timeout to clear the prompt if it becomes stale
        setTimeout(() => {
          setDeferredPrompt(prevPrompt => {
            if (prevPrompt === e) {
              console.log('PWA: Clearing stale deferred prompt');
              return null;
            }
            return prevPrompt;
          });
        }, 300000); // Clear after 5 minutes
      };

      const handleAppInstalled = () => {
        console.log('PWA: App was installed');
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      // Type assertion for event listeners
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.addEventListener('appinstalled', handleAppInstalled);

      // More aggressive installation criteria checking
      const checkInstallCriteria = () => {
        // Force service worker registration if not already done
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            if (registrations.length === 0) {
              console.log('PWA: No service worker found, may affect installability');
            } else {
              console.log('PWA: Service worker registered, checking install criteria');
              // Dispatch a custom event to potentially trigger beforeinstallprompt
              setTimeout(() => {
                const event = new CustomEvent('pwa-check-install');
                window.dispatchEvent(event);
              }, 1000);
            }
          });
        }
      };

      // Check install criteria after a delay to allow page to fully load
      setTimeout(checkInstallCriteria, 2000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    console.log('PWA: Install button component mounted', {
      isInstalled: installed,
      isSupported,
      deviceType,
      userAgent: navigator.userAgent
    });
  }, [isSupported]);

  const handleInstallClick = async () => {
    console.log('PWA: Install button clicked', { hasDeferredPrompt: !!deferredPrompt });
    
    if (deferredPrompt) {
      try {
        // Validate prompt is still valid
        if (typeof deferredPrompt.prompt !== 'function') {
          console.log('PWA: Deferred prompt is invalid, clearing and showing manual instructions');
          setDeferredPrompt(null);
          setShowManualDialog(true);
          return;
        }

        // Show install prompt immediately
        console.log('PWA: Showing native install prompt');
        await deferredPrompt.prompt();
        
        // Wait for user response
        const choiceResult = await deferredPrompt.userChoice;
        console.log('PWA: User choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA: User accepted the install prompt');
          setIsInstalled(true);
        } else {
          console.log('PWA: User dismissed the install prompt');
        }
        
        // Prompt can only be used once
        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error('PWA: Error during native installation:', error);
        // Clear invalid prompt and fall through to manual instructions
        setDeferredPrompt(null);
      }
    }

    // Check if we can trigger install through other means
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent);
    const isEdge = /Edge|Edg/i.test(navigator.userAgent);
    
    if ((isChrome || isEdge) && !deferredPrompt) {
      // Try to trigger the browser's install mechanism
      try {
        // Force check for install criteria
        setTimeout(() => {
          console.log('PWA: Attempting to trigger browser install detection');
          // This helps trigger the beforeinstallprompt event in some cases
          window.dispatchEvent(new Event('beforeinstallprompt'));
        }, 100);
        
        // Show instructions after a brief delay
        setTimeout(() => {
          setShowManualDialog(true);
        }, 200);
      } catch (error) {
        console.error('PWA: Error triggering install detection:', error);
        setShowManualDialog(true);
      }
    } else {
      // For other browsers or as fallback, show manual instructions
      console.log('PWA: No native prompt available, showing manual instructions');
      setShowManualDialog(true);
    }
  };

  const getManualInstructions = () => {
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isFirefox = /Firefox/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    const isEdge = /Edge|Edg/i.test(navigator.userAgent);

    if (deviceType === 'mobile') {
      if (isChrome || isEdge) {
        return {
          title: "Install Absensi Lampung",
          steps: [
            "1. Klik menu tiga titik (⋮) di pojok kanan atas browser",
            "2. Pilih 'Install app' atau 'Add to Home screen'",
            "3. Ketuk 'Install' untuk menambahkan ke layar utama"
          ]
        };
      } else if (isFirefox) {
        return {
          title: "Install Absensi Lampung",
          steps: [
            "1. Klik ikon 'Home' di address bar",
            "2. Pilih 'Add to Home Screen'",
            "3. Ketuk 'Add' untuk install aplikasi"
          ]
        };
      } else if (isSafari) {
        return {
          title: "Install Absensi Lampung",
          steps: [
            "1. Ketuk tombol 'Share' (ikon persegi dengan panah ke atas)",
            "2. Scroll ke bawah dan pilih 'Add to Home Screen'",
            "3. Ketuk 'Add' untuk install aplikasi"
          ]
        };
      }
    } else {
      if (isChrome || isEdge) {
        return {
          title: "Install Absensi Lampung",
          steps: [
            "1. Klik menu tiga titik (⋮) di pojok kanan atas browser",
            "2. Pilih 'Install Absensi Lampung...'",
            "3. Klik 'Install' pada dialog yang muncul"
          ]
        };
      } else if (isFirefox) {
        return {
          title: "Install Absensi Lampung",
          steps: [
            "1. Klik ikon '+' di address bar (jika tersedia)",
            "2. Atau bookmark halaman ini untuk akses cepat",
            "3. Firefox akan mengingat aplikasi ini"
          ]
        };
      }
    }

    return {
      title: "Install Absensi Lampung",
      steps: [
        "1. Bookmark halaman ini untuk akses cepat",
        "2. Atau tambahkan shortcut ke desktop/home screen",
        "3. Browser Anda mendukung penggunaan aplikasi web ini"
      ]
    };
  };

  // Don't show button if app is already installed
  if (isInstalled) {
    console.log('PWA: Button hidden - app is installed');
    return null;
  }

  // Don't show button if PWA is not supported
  if (!isSupported) {
    console.log('PWA: Button hidden - PWA not supported');
    return null;
  }

  const instructions = getManualInstructions();

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleInstallClick}
        className="flex"
        title="Install Aplikasi"
      >
        <Download className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Install App</span>
      </Button>

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deviceType === 'mobile' ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
              {instructions.title}
            </DialogTitle>
            <DialogDescription>
              Ikuti langkah-langkah berikut untuk menginstall aplikasi:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {instructions.steps.map((step, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowManualDialog(false)}>
              Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PWAInstallButton;
