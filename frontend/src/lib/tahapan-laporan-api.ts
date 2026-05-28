import { config, getApiUrl } from './config';

export interface TahapanLaporan {
  tahapanLaporanId: number;
  nama: string;
  deskripsi?: string;
  templateTahapan?: string;
  urutanTahapan: number;
  jenisFileIzin?: string[];
  status: 'AKTIF' | 'TIDAK_AKTIF';
  jenisLaporanId: number;
  jenisLaporanNama: string;
  createdAt: string;
  updatedAt: string;
}

export interface TahapanLaporanFilterRequest {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  nama?: string;
  status?: string;
  jenisLaporanId?: number;
}

export interface TahapanLaporanPageResponse {
  content: TahapanLaporan[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const tahapanLaporanAPI = {
  async getAllByJenisLaporan(jenisLaporanId: number, filters: TahapanLaporanFilterRequest = {}): Promise<TahapanLaporan[]> {
    const params = new URLSearchParams();
    
    if (filters.nama) params.append('nama', filters.nama);
    if (filters.status) params.append('status', filters.status);

    const url = getApiUrl(`jenis-laporan/${jenisLaporanId}/tahapan?${params.toString()}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getActiveByJenisLaporan(jenisLaporanId: number, filters: TahapanLaporanFilterRequest = {}): Promise<TahapanLaporan[]> {
    const params = new URLSearchParams();
    
    if (filters.nama) params.append('nama', filters.nama);

    const url = getApiUrl(`jenis-laporan/${jenisLaporanId}/tahapan/active?${params.toString()}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getById(id: number): Promise<TahapanLaporan> {
    const url = getApiUrl(`tahapan-laporan/${id}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};
