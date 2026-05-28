"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User, GraduationCap } from "lucide-react";
import { useTheme } from "next-themes";
import { imageAPI } from "@/lib/api";

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AlumniLocation {
  biografiId: number;
  namaLengkap: string;
  alumniTahun: string;
  jurusan: string;
  latitude: number;
  longitude: number;
  fotoProfil?: string;
  foto?: string;
  kota: string;
  provinsi: string;
  kecamatan: string;
  kelurahan: string;
  kodePos: string;
  alamat: string;
}

interface AlumniMapProps {
  locations: AlumniLocation[];
  center: [number, number];
  zoom: number;
  onAlumniClick: (biografiId: number) => void;
}

// Component to handle map center changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

// Custom marker component for alumni
function AlumniMarker({ alumni, onAlumniClick }: { alumni: AlumniLocation; onAlumniClick: (biografiId: number) => void }) {
  const { theme } = useTheme();
  const createCustomIcon = (imageUrl?: string) => {
    const iconSize = 50;
    
    console.log('Creating icon for:', alumni.namaLengkap, 'with imageUrl:', imageUrl);
    
    const iconHtml = `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        border-radius: 50%;
        border: 3px solid #3b82f6;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        overflow: hidden;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        ${imageUrl && imageUrl !== '' ? `
          <img src="${imageUrl}" 
               style="
                 width: 100%; 
                 height: 100%; 
                 object-fit: cover; 
                 border-radius: 50%;
                 display: block;
               " 
               alt="${alumni.namaLengkap}"
               onload="console.log('Image loaded successfully:', '${imageUrl}')"
               onerror="console.log('Image failed to load:', '${imageUrl}'); this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: bold;
            font-size: 16px;
            border-radius: 50%;
          ">
            ${alumni.namaLengkap.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        ` : `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: bold;
            font-size: 16px;
            border-radius: 50%;
          ">
            ${alumni.namaLengkap.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        `}
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-alumni-marker',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
      popupAnchor: [0, -iconSize / 2],
    });
  };  const getProfileImage = () => {
    const photoFilename = alumni.fotoProfil || alumni.foto;
    console.log('Alumni photo data:', { 
      biografiId: alumni.biografiId, 
      namaLengkap: alumni.namaLengkap,
      fotoProfil: alumni.fotoProfil, 
      foto: alumni.foto,
      photoFilename,
      fullUrl: photoFilename ? imageAPI.getImageUrl(photoFilename) : 'No photo'
    });
    return photoFilename ? imageAPI.getImageUrl(photoFilename) : undefined;
  };

  return (
    <Marker
      position={[alumni.latitude, alumni.longitude]}
      icon={createCustomIcon(getProfileImage())}
    >
      <Popup className="custom-popup" maxWidth={300}>
        <Card className="border-0 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={getProfileImage()} alt={alumni.namaLengkap} />
                <AvatarFallback className="text-sm">
                  {alumni.namaLengkap.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{alumni.namaLengkap}</h4>
                <p className="text-xs text-muted-foreground">Alumni {alumni.alumniTahun}</p>
                
                {alumni.jurusan && (
                  <div className="flex items-center space-x-1 mt-1">
                    <GraduationCap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{alumni.jurusan}</span>
                  </div>
                )}                <div className="flex items-center space-x-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {alumni.alamat || 
                     `${alumni.kelurahan || ''} ${alumni.kecamatan || ''} ${alumni.kota || ''} ${alumni.provinsi || ''}`.trim().replace(/\s+/g, ', ') ||
                     'Lokasi tidak tersedia'}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={() => onAlumniClick(alumni.biografiId)}
                >
                  <User className="h-3 w-3 mr-1" />
                  Lihat Detail
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Popup>
    </Marker>
  );
}

export default function AlumniMap({ locations, center, zoom, onAlumniClick }: AlumniMapProps) {
  const { theme } = useTheme();
    // Choose tile layer based on theme
  const getTileLayer = () => {
    if (theme === 'dark') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: ''
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: ''
    };
  };

  const tileLayer = getTileLayer();

  return (
    <div className="relative h-[600px] w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-b-lg"
      >
        <TileLayer
          url={tileLayer.url}
          attribution={tileLayer.attribution}
        />
        
        <MapController center={center} zoom={zoom} />
        
        {locations.map((alumni) => (
          <AlumniMarker
            key={alumni.biografiId}
            alumni={alumni}
            onAlumniClick={onAlumniClick}
          />
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0"></div>
              <span className="text-muted-foreground">Lokasi Alumni</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {locations.length} alumni ditemukan
            </div>
          </CardContent>
        </Card>
      </div>
        <style jsx global>{`
        .custom-alumni-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-alumni-marker:hover {
          z-index: 1000 !important;
        }
        
        .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        
        .leaflet-popup-tip {
          background: white;
        }
        
        .dark .leaflet-popup-tip {
          background: hsl(var(--background));
        }
        
        .leaflet-popup-close-button {
          color: hsl(var(--muted-foreground)) !important;
          right: 8px !important;
          top: 8px !important;
          width: 20px !important;
          height: 20px !important;
          font-size: 16px !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--accent)) !important;
        }
        
        /* Hide Leaflet attribution */
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
