"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, X, Check } from "lucide-react";
import { toast } from "sonner";

interface MapLocationPickerProps {
  latitude?: number | string;
  longitude?: number | string;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  className?: string;
  height?: string; // Add height prop
}

// Dynamically import the map component to avoid SSR issues
const DynamicMapLocationPickerClient = dynamic(() => import('./MapLocationPickerClient').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="h-[700px] w-full">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  ),
});

export default function MapLocationPicker({
  latitude,
  longitude,
  onLocationChange,
  className = "",
  height = "700px" // Default height
}: MapLocationPickerProps) {
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);  // Initialize selected location from props
  useEffect(() => {
    if (latitude && longitude) {
      if (typeof latitude === 'number' && typeof longitude === 'number' &&
          !isNaN(latitude) && !isNaN(longitude)) {
        setSelectedLocation({ lat: latitude, lng: longitude });
      } else if (typeof latitude === 'string' && typeof longitude === 'string' &&
                 latitude.trim() !== '' && longitude.trim() !== '') {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedLocation({ lat, lng });
        }
      }
    }
  }, [latitude, longitude]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setCurrentLocation(location);
        setSelectedLocation(location);
        onLocationChange(latitude, longitude);
        toast.success("Lokasi berhasil ditemukan!");
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Gagal mendapatkan lokasi";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak. Mohon izinkan akses lokasi di browser Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia";
            break;
          case error.TIMEOUT:
            errorMessage = "Timeout saat mengambil lokasi";
            break;
        }
        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [onLocationChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    onLocationChange(lat, lng);
    toast.success("Lokasi berhasil dipilih!");
  }, [onLocationChange]);

  const clearLocation = useCallback(() => {
    setSelectedLocation(null);
    onLocationChange(null, null);
    toast.info("Lokasi dihapus");
  }, [onLocationChange]);

  const formatCoordinate = (value: number) => {
    return value.toFixed(6);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Lokasi Sekarang
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Klik pada peta untuk menentukan lokasi Anda atau gunakan lokasi saat ini
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              {isGettingLocation ? "Mencari..." : "Gunakan Lokasi Saat Ini"}
            </Button>
            
            {selectedLocation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearLocation}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
                Hapus Lokasi
              </Button>
            )}
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Check className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Lokasi Terpilih:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Lat: {formatCoordinate(selectedLocation.lat)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Lng: {formatCoordinate(selectedLocation.lng)}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Map Component */}
          <div className="border rounded-lg overflow-hidden">
            <DynamicMapLocationPickerClient
              selectedLocation={selectedLocation}
              currentLocation={currentLocation}
              onMapClick={handleMapClick}
              height={height}
            />
          </div>

          {/* Helper Text */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">
              Cara menggunakan:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Klik tombol "Gunakan Lokasi Saat Ini" untuk deteksi otomatis</li>
              <li>• Atau klik langsung pada peta untuk memilih lokasi</li>
              <li>• Drag peta untuk menjelajahi area lain</li>
              <li>• Zoom in/out untuk presisi yang lebih baik</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
