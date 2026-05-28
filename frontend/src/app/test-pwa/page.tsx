"use client";

import PWAInstallButton from "@/components/PWAInstallButton";

const TestPWAPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">PWA Install Test Page</h1>
      <p className="mb-4">
        This page is for testing the PWA installation button. If the app is
        installable, the button should appear below.
      </p>
      <PWAInstallButton />
    </div>
  );
};

export default TestPWAPage;
