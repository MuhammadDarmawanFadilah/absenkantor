import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/config';

export interface Jabatan {
  id: number;
  nama: string;
  deskripsi?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface UseJabatanReturn {
  jabatanList: Jabatan[];
  loading: boolean;
  error: string | null;
  refreshJabatan: () => void;
  searchJabatan: (query: string) => Promise<Jabatan[]>;
}

export function useJabatan(): UseJabatanReturn {
  const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  });

  const loadJabatan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        getApiUrl('admin/master-data/jabatan?size=1000&sortBy=sortOrder&sortDir=asc'),
        {
          headers: getAuthHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setJabatanList(data.content || []);
      } else {
        setError('Gagal memuat data jabatan');
      }
    } catch (err) {
      console.error('Error loading jabatan:', err);
      setError('Terjadi kesalahan saat memuat data jabatan');
    } finally {
      setLoading(false);
    }
  };

  const refreshJabatan = () => {
    loadJabatan();
  };

  const searchJabatan = async (query: string): Promise<Jabatan[]> => {
    try {
      const response = await fetch(
        getApiUrl(`admin/master-data/jabatan?search=${encodeURIComponent(query)}&size=50&sortBy=sortOrder&sortDir=asc`),
        {
          headers: getAuthHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.content || [];
      } else {
        throw new Error('Gagal mencari jabatan');
      }
    } catch (err) {
      console.error('Error searching jabatan:', err);
      return [];
    }
  };

  useEffect(() => {
    loadJabatan();
  }, []);

  return {
    jabatanList,
    loading,
    error,
    refreshJabatan,
    searchJabatan
  };
}