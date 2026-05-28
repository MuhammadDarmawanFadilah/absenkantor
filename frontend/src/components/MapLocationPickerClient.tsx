"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerClientProps {
  selectedLocation: {lat: number; lng: number} | null;
  currentLocation: {lat: number; lng: number} | null;
  onMapClick: (lat: number, lng: number) => void;
  height?: string; // Add height prop
}

// Custom marker icons
const createCustomIcon = (color: string, isSelected: boolean = false) => {
  const size = isSelected ? 35 : 25;
  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid ${color};
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        width: ${size - 12}px;
        height: ${size - 12}px;
        border-radius: 50%;
        background: ${color};
      "></div>
      ${isSelected ? `
        <div style="
          position: absolute;
          width: ${size + 10}px;
          height: ${size + 10}px;
          border: 2px solid ${color};
          border-radius: 50%;
          top: -8px;
          left: -8px;
          animation: pulse 2s infinite;
          opacity: 0.6;
        "></div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-location-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

// Component to update map view when location changes
function MapController({ location }: { location: {lat: number; lng: number} | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 15, {
        animate: true,
        duration: 1
      });
    }
  }, [map, location]);

  return null;
}

export default function MapLocationPickerClient({
  selectedLocation,
  currentLocation,
  onMapClick,
  height = "700px" // Default height
}: MapLocationPickerClientProps) {
  const { theme } = useTheme();
  const mapRef = useRef<L.Map | null>(null);

  // Choose tile layer based on theme
  const getTileLayer = () => {
    if (theme === 'dark') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    };
  };

  const tileLayer = getTileLayer();

  // Default center (Indonesia - wider view to show more of Indonesia)
  const defaultCenter: [number, number] = selectedLocation 
    ? [selectedLocation.lat, selectedLocation.lng]
    : currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [-2.5, 118.0]; // Center of Indonesia

  const defaultZoom = selectedLocation || currentLocation ? 15 : 5; // Wider zoom to show Indonesia

  return (
    <div className="relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: height, width: '100%' }}
        className="rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          url={tileLayer.url}
          attribution=""
        />
        
        <MapClickHandler onMapClick={onMapClick} />
        <MapController location={selectedLocation || currentLocation} />
        
        {/* Current location marker (blue) */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={createCustomIcon('#3b82f6', false)}
          />
        )}
        
        {/* Selected location marker (red) */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCustomIcon('#ef4444', true)}
          />
        )}
      </MapContainer>
      
      {/* Map Instructions Overlay */}
      <div className="absolute top-2 left-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-lg p-2 shadow-md z-[1000]">
        <p className="text-xs text-muted-foreground font-medium">
          Klik pada peta untuk memilih lokasi
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-lg p-2 shadow-md z-[1000]">
        <div className="space-y-1">
          {currentLocation && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-muted-foreground">Lokasi Saat Ini</span>
            </div>
          )}
          {selectedLocation && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">Lokasi Terpilih</span>
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .custom-location-marker {
          background: transparent !important;
          border: none !important;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
        }
        
        .leaflet-container {
          cursor: crosshair !important;
        }
        
        .leaflet-control-zoom a {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        
        .leaflet-control-zoom a:hover {
          background-color: hsl(var(--accent)) !important;
        }
        
        /* Hide Leaflet attribution */
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
