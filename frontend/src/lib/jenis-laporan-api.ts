import { config, getApiUrl } from './config';

export interface JenisLaporan {
  jenisLaporanId: number;
  nama: string;
  deskripsi?: string;
  urutan: number;
  status: 'AKTIF' | 'TIDAK_AKTIF';
  mediaYangDibolehkan?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JenisLaporanFilterRequest {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  nama?: string;
  status?: string;
}

export interface JenisLaporanPageResponse {
  content: JenisLaporan[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CreateJenisLaporanRequest {
  nama: string;
  deskripsi?: string;
  urutan: number;
  status?: string;
  mediaYangDibolehkan?: string[];
}

export interface UpdateJenisLaporanRequest {
  nama?: string;
  deskripsi?: string;
  urutan?: number;
  status?: string;
  mediaYangDibolehkan?: string[];
}

export const jenisLaporanAPI = {
  async getAll(filters: JenisLaporanFilterRequest = {}): Promise<JenisLaporanPageResponse> {
    const params = new URLSearchParams();
    
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters.nama) params.append('nama', filters.nama);
    if (filters.status) params.append('status', filters.status);

    const url = getApiUrl(`jenis-laporan?${params.toString()}`);
    
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

  async getById(id: number): Promise<JenisLaporan> {
    const url = getApiUrl(`jenis-laporan/${id}`);
    
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

  async create(data: CreateJenisLaporanRequest): Promise<JenisLaporan> {
    const url = getApiUrl('jenis-laporan');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async update(id: number, data: UpdateJenisLaporanRequest): Promise<JenisLaporan> {
    const url = getApiUrl(`jenis-laporan/${id}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async delete(id: number): Promise<void> {
    const url = getApiUrl(`jenis-laporan/${id}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  async toggleStatus(id: number): Promise<JenisLaporan> {
    const url = getApiUrl(`jenis-laporan/${id}/toggle-status`);
    
    const response = await fetch(url, {
      method: 'PATCH',
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
