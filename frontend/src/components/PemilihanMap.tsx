"use client";

import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

interface PemilihanLocation {
  id?: number;
  pemilihanId?: number;
  namaPemilihan?: string;
  judulPemilihan?: string;
  tingkatPemilihan: string;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  provinsiNama: string;
  kotaNama: string;
  kecamatanNama: string;
  kelurahanNama: string;
  alamatLengkap: string;
  latitude: number;
  longitude: number;
  jumlahTps?: number;
  jumlahPemilih?: number;
  totalLaporan?: number;
  totalPegawai?: number;
  totalJenisLaporan?: number;
  totalTahapan?: number;
}

interface PemilihanMapProps {
  locations: PemilihanLocation[];
  center: [number, number];
  zoom: number;
  onPemilihanClick: (pemilihanId: number) => void;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

const PemilihanMap: React.FC<PemilihanMapProps> = ({ locations, center, zoom, onPemilihanClick }) => {
  const mapRef = useRef<L.Map>(null);

  // Process locations to handle duplicate coordinates
  const processedLocations = locations.map((location, index) => {
    const locationId = location.id || location.pemilihanId || index;
    const locationName = location.judulPemilihan || location.namaPemilihan || `Location ${locationId}`;
    
    // Find other locations with the same coordinates
    const duplicates = locations.filter(loc => 
      loc.latitude === location.latitude && 
      loc.longitude === location.longitude &&
      (loc.id || loc.pemilihanId) !== locationId
    );

    if (duplicates.length > 0) {
      // Calculate offset for this location based on its index among duplicates
      const duplicateIndex = locations.filter(loc => 
        loc.latitude === location.latitude && 
        loc.longitude === location.longitude &&
        (loc.id || loc.pemilihanId || 0) <= locationId
      ).length - 1;

      // Create small offset (about 100-200 meters)
      const offsetDistance = 0.001; // roughly 100 meters
      const angle = (duplicateIndex * 90) * (Math.PI / 180); // 90 degrees apart
      
      const latOffset = Math.sin(angle) * offsetDistance;
      const lngOffset = Math.cos(angle) * offsetDistance;

      console.log(`Applying offset to ${locationName} (ID: ${locationId}):`, {
        original: { lat: location.latitude, lng: location.longitude },
        offset: { lat: location.latitude + latOffset, lng: location.longitude + lngOffset },
        duplicateIndex,
        totalDuplicates: duplicates.length + 1
      });

      return {
        ...location,
        id: locationId,
        latitude: location.latitude + latOffset,
        longitude: location.longitude + lngOffset,
        originalLatitude: location.latitude,
        originalLongitude: location.longitude,
        namaPemilihan: locationName
      };
    }

    return {
      ...location,
      id: locationId,
      namaPemilihan: locationName
    };
  });

  console.log('Total processed locations:', processedLocations.length);
  processedLocations.forEach(loc => {
    console.log(`Location: ${loc.namaPemilihan} (ID: ${loc.id}) at [${loc.latitude}, ${loc.longitude}]`);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return '#22c55e';
      case 'SELESAI': return '#3b82f6';
      case 'DRAFT': return '#f59e0b';
      case 'DIBATALKAN': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTingkatColor = (tingkat: string) => {
    switch (tingkat?.toUpperCase()) {
      case 'PROVINSI': return '#8b5cf6';
      case 'KOTA': return '#06b6d4';
      case 'KABUPATEN': return '#06b6d4';
      case 'KECAMATAN': return '#10b981';
      case 'KELURAHAN': return '#f59e0b';
      case 'DESA': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getTingkatIcon = (tingkat: string) => {
    switch (tingkat?.toUpperCase()) {
      case 'PROVINSI': return '🏛️';
      case 'KOTA': return '🏙️';
      case 'KABUPATEN': return '🏙️';
      case 'KECAMATAN': return '🏘️';
      case 'KELURAHAN': return '🏠';
      case 'DESA': return '🏠';
      default: return '📍';
    }
  };

  const createCustomIcon = (pemilihan: PemilihanLocation) => {
    const statusColor = getStatusColor(pemilihan.status);
    const tingkatColor = getTingkatColor(pemilihan.tingkatPemilihan);
    const tingkatIcon = getTingkatIcon(pemilihan.tingkatPemilihan);
    
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, ${statusColor}, ${tingkatColor});
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 4px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        ">
          ${tingkatIcon}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTingkat = (tingkat: string) => {
    const tingkatMap: { [key: string]: string } = {
      'provinsi': 'Provinsi',
      'kota': 'Kota/Kabupaten',
      'kecamatan': 'Kecamatan',
      'kelurahan': 'Kelurahan/Desa'
    };
    return tingkatMap[tingkat] || tingkat;
  };

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden">
      <style jsx global>{`
        .custom-popup .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 6px;
          overflow: hidden;
          min-width: 280px !important;
          max-width: 280px !important;
          width: 280px !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
        }
        .custom-div-icon:hover {
          transform: scale(1.1);
        }
      `}</style>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapController center={center} zoom={zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {processedLocations.map((pemilihan) => {
          const locationId = pemilihan.id || pemilihan.pemilihanId || 0;
          console.log('Rendering marker for pemilihan:', locationId, 'at:', pemilihan.latitude, pemilihan.longitude, 'name:', pemilihan.namaPemilihan);
          return (
            <Marker
              key={locationId}
              position={[pemilihan.latitude, pemilihan.longitude]}
              icon={createCustomIcon(pemilihan)}
            >
              <Popup className="custom-popup">
                <div className="p-3 w-[280px]">
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{pemilihan.namaPemilihan}</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600 font-medium">Tingkat</div>
                        <div className="text-gray-800 font-semibold">
                          {formatTingkat(pemilihan.tingkatPemilihan) || '-'}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600 font-medium">Status</div>
                        <div className="text-gray-800 font-semibold">
                          {pemilihan.status === 'AKTIF' ? 'Aktif' : 
                           pemilihan.status === 'TIDAK_AKTIF' ? 'Tidak Aktif' : 
                           pemilihan.status === 'DRAFT' ? 'Draft' : pemilihan.status}
                        </div>
                      </div>
                    </div>

                    {(pemilihan.provinsiNama || pemilihan.kotaNama || pemilihan.kecamatanNama || pemilihan.kelurahanNama) && (
                      <div className="bg-blue-50 p-2 rounded text-xs">
                        <div className="text-blue-700 font-medium mb-1">Wilayah</div>
                        <div className="text-blue-800 font-semibold text-xs leading-snug">
                          {[pemilihan.kelurahanNama, pemilihan.kecamatanNama, pemilihan.kotaNama, pemilihan.provinsiNama]
                            .filter(Boolean)
                            .join(', ')
                          }
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-green-700 font-medium">Laporan</div>
                        <div className="text-green-800 font-semibold">
                          {pemilihan.totalLaporan || 0}
                        </div>
                      </div>
                      
                      {(pemilihan.tanggalMulai || pemilihan.tanggalSelesai) && (
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="text-orange-700 font-medium">Periode</div>
                          <div className="text-orange-800 font-semibold text-xs">
                            {pemilihan.tanggalMulai && formatDate(pemilihan.tanggalMulai)}
                            {pemilihan.tanggalMulai && pemilihan.tanggalSelesai && ' - '}
                            {pemilihan.tanggalSelesai && formatDate(pemilihan.tanggalSelesai)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onPemilihanClick(locationId)}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded font-medium transition-colors duration-200"
                  >
                    Lihat Detail
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default PemilihanMap;
