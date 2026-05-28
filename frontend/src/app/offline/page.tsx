"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tidak Ada Koneksi Internet
        </h1>
        
        <p className="text-gray-600 mb-6">
          Silahkan nyalakan internet Anda untuk mengakses aplikasi ini. 
          Anda tidak bisa absensi tanpa internet.
        </p>
        
        <Button 
          onClick={() => window.location.reload()} 
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Coba Lagi
        </Button>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tips:</strong> Pastikan WiFi atau data seluler Anda aktif, 
            kemudian refresh halaman ini.
          </p>
        </div>
      </div>
    </div>
  );
}
