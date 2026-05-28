import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertCircle, TrendingDown } from "lucide-react";
import { getApiUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

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

  const formatCurrency = (value: number): string => {
    return Math.round(value).toLocaleString('id-ID');
  };

  const calculatePemotongan = (persentase: number): string => {
    const tunjanganValue = parseInt(tunjanganKinerja?.replace(/\D/g, '') || '0');
    if (tunjanganValue === 0) return '0';
    
    const potongan = (tunjanganValue * persentase) / 100;
    return formatCurrency(potongan);
  };

  const tunjanganValue = parseInt(tunjanganKinerja?.replace(/\D/g, '') || '0');

  if (tunjanganValue === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            Informasi Pemotongan Absen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Tunjangan Kinerja Diperlukan</h3>
            <p className="text-sm text-muted-foreground">
              Masukkan nilai Tunjangan Kinerja terlebih dahulu untuk melihat perhitungan pemotongan absen
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Informasi Pemotongan Absen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Memuat data pemotongan absen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Informasi Pemotongan Absen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Informasi Pemotongan Absen
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Berdasarkan Tunjangan Kinerja:</span>
          <Badge variant="secondary" className="font-mono">
            Rp {formatCurrency(tunjanganValue)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {pemotonganAbsenList.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Tidak ada data pemotongan absen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pemotonganAbsenList.map((item) => (
              <Card 
                key={item.id} 
                className={cn(
                  "transition-all duration-200 hover:shadow-md border-l-4 border-l-orange-500 dark:border-l-orange-400",
                  "bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="font-mono text-xs px-2 py-1"
                      >
                        {item.kode}
                      </Badge>
                      <Badge 
                        className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                      >
                        {item.persentase}%
                      </Badge>
                    </div>
                    <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </div>
                  
                  <h4 className="font-semibold text-sm mb-2 text-foreground">
                    {item.nama}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {item.deskripsi}
                  </p>
                  
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Potongan:
                      </span>
                      <div className="text-right">
                        <div className="font-bold text-red-700 dark:text-red-300 text-sm">
                          Rp {calculatePemotongan(item.persentase)}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">
                          per hari absen
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { PemotonganAbsenInfo };
