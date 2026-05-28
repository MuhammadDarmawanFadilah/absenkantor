import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientSidebarWrapper from "@/components/ClientSidebarWrapper";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import NetworkInitializer from "@/components/NetworkInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Absensi Lampung",
    template: "%s | Absensi Lampung"
  },
  description: "Aplikasi Absensi Online Pemerintah Provinsi Lampung - Sistem manajemen kehadiran pegawai yang modern dan efisien",
  manifest: "/manifest.json",
  keywords: ["absensi", "lampung", "pemerintah", "kehadiran", "pegawai"],
  authors: [{ name: "Pemerintah Provinsi Lampung" }],
  creator: "Pemerintah Provinsi Lampung",
  publisher: "Pemerintah Provinsi Lampung",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Absensi Lampung",
  },
};

export const viewport: Viewport = {
  themeColor: "#f69435",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Absensi Lampung" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Absensi Lampung" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#f69435" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#f69435" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="mask-icon" href="/logo.svg" color="#f69435" />
        <link rel="shortcut icon" href="/logo.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {process.env.NODE_ENV === 'development' && (
          <>
            <script src="/network-filter.js" defer></script>
            <script src="/pwa-utils.js" defer></script>
          </>
        )}
        <script dangerouslySetInnerHTML={{
          __html: `
            let updateAvailable = false;
            
            // Listen for service worker messages
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                  console.log('🔄 PWA Update Available:', event.data);
                  updateAvailable = true;
                  
                  // Show update notification
                  if (${process.env.NODE_ENV !== 'development'}) {
                    const showUpdate = () => {
                      const updateBanner = document.createElement('div');
                      updateBanner.id = 'pwa-update-banner';
                      updateBanner.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        background: linear-gradient(135deg, #f69435, #f76b35);
                        color: white;
                        padding: 12px 20px;
                        text-align: center;
                        z-index: 9999;
                        font-family: system-ui, -apple-system, sans-serif;
                        font-size: 14px;
                        font-weight: 500;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        cursor: pointer;
                        transition: all 0.3s ease;
                      \`;
                      updateBanner.innerHTML = \`
                        🔄 <strong>Versi Baru Tersedia!</strong> Klik untuk memperbarui aplikasi
                      \`;
                      updateBanner.onclick = () => {
                        window.location.reload();
                      };
                      
                      // Remove existing banner if any
                      const existing = document.getElementById('pwa-update-banner');
                      if (existing) existing.remove();
                      
                      document.body.appendChild(updateBanner);
                      
                      // Auto-hide after 10 seconds
                      setTimeout(() => {
                        if (updateBanner.parentNode) {
                          updateBanner.style.transform = 'translateY(-100%)';
                          setTimeout(() => updateBanner.remove(), 300);
                        }
                      }, 10000);
                    };
                    
                    // Show after a short delay to ensure page is loaded
                    setTimeout(showUpdate, 1000);
                  } else {
                    // Auto-refresh in development
                    console.log('🔄 Auto-refreshing in development mode...');
                    setTimeout(() => window.location.reload(), 1000);
                  }
                }
              });
            }
            
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered with scope: ', registration.scope);
                    
                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker installed
                            console.log('New service worker available');
                            if (${process.env.NODE_ENV === 'development'}) {
                              // Auto-refresh in development after short delay
                              setTimeout(() => window.location.reload(), 2000);
                            }
                            // In production, the message listener will handle the update notification
                          }
                        });
                      }
                    });

                    // Check for updates periodically
                    const checkInterval = ${process.env.NODE_ENV === 'development'} ? 5000 : 60000; // 5s dev, 1min prod
                    setInterval(() => {
                      registration.update();
                    }, checkInterval);
                    
                    // Initial update check
                    registration.update();
                  })
                  .catch(function(error) {
                    console.log('SW registration failed: ', error);
                  });
              });
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
      >        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>            
            {process.env.NODE_ENV === 'development' && <NetworkInitializer />}
            <SidebarProvider defaultOpen={defaultOpen}>
              <ClientSidebarWrapper />              
              <main className="flex-1 min-h-screen bg-background">
                <Navbar />
                <div className="w-full">{children}</div>
              </main>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
