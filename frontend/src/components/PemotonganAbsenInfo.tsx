import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, AlertCircle } from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface PemotonganAbsen {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string;
  persentase: number;
  isActive: boolean;
}

interface PemotonganAbsenInfoProps {
  tunjanganKinerja: string;
}

const PemotonganAbsenInfo: React.FC<PemotonganAbsenInfoProps> = ({ tunjanganKinerja }) => {
  const [pemotonganAbsenList, setPemotonganAbsenList] = useState<PemotonganAbsen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPemotonganAbsen = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(getApiUrl('pemotongan-absen'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Gagal mengambil data pemotongan absen');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setPemotonganAbsenList(result.data);
        } else {
          throw new Error(result.message || 'Data tidak ditemukan');
        }
      } catch (err: any) {
        console.error('Error fetching pemotongan absen:', err);
        setError(err.message || 'Gagal memuat data pemotongan absen');
      } finally {
        setLoading(false);
      }
    };

    fetchPemotonganAbsen();
  }, []);

  const calculatePemotongan = (persentase: number): string => {
    const tunjanganValue = parseInt(tunjanganKinerja?.replace(/\D/g, '') || '0');
    if (tunjanganValue === 0) return '0';
    
    const potongan = (tunjanganValue * persentase) / 100;
    return potongan.toLocaleString('id-ID');
  };

  const tunjanganValue = parseInt(tunjanganKinerja?.replace(/\D/g, '') || '0');

  if (tunjanganValue === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Informasi Pemotongan Absen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
            <p>Masukkan nilai Tunjangan Kinerja terlebih dahulu</p>
            <p className="text-sm">untuk melihat perhitungan pemotongan absen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Informasi Pemotongan Absen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-muted-foreground">Memuat data pemotongan absen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Informasi Pemotongan Absen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-orange-600" />
          Informasi Pemotongan Absen
        </CardTitle>
        <div className="text-sm text-muted-foreground mt-2">
          Berdasarkan Tunjangan Kinerja: <span className="font-semibold text-primary">Rp {tunjanganValue.toLocaleString('id-ID')}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pemotonganAbsenList.map((item) => (
            <div 
              key={item.id} 
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {item.kode}
                </span>
                <span className="text-xs text-orange-600 font-semibold">
                  {item.persentase}%
                </span>
              </div>
              
              <h4 className="font-medium text-sm mb-1">{item.nama}</h4>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {item.deskripsi}
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                <div className="text-xs text-red-600 mb-1">Potongan:</div>
                <div className="font-semibold text-red-700">
                  Rp {calculatePemotongan(item.persentase)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {pemotonganAbsenList.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Tidak ada data pemotongan absen</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PemotonganAbsenInfo;
