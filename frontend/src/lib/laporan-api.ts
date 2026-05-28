// Laporan API Types and Functions
export interface Laporan {
  laporanId: number;
  namaLaporan: string;  // Changed from 'nama' to match backend 'namaLaporan'
  deskripsi: string;
  status: 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT';
  jenisLaporanId: number;
  jenisLaporanNama: string;
  createdAt: string;
  updatedAt: string;
  tahapanList?: TahapanLaporanDetail[];
  detailLaporanList?: DetailLaporanDTO[];
}

export interface DetailLaporanDTO {
  detailLaporanId: number;
  laporanId: number;
  konten: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tahapanLaporanId: number;
  tahapanNama: string;
  tahapanDeskripsi: string;
  templateTahapan: string;
  urutanTahapan: number;
  jenisLaporanId: number;
  jenisLaporanNama: string;
  jenisFileIzin: string[];
}

export interface TahapanLaporanDetail {
  tahapanLaporanId: number;
  nama: string;
  deskripsi: string;
  templateTahapan: string;
  urutanTahapan: number;
  status: string;
  jenisFileIzin: string[];
  jenisLaporanId: number;
  jenisLaporanNama: string;
}

export interface LaporanRequest {
  nama: string;
  deskripsi: string;
  status: 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT';
  jenisLaporanId: number;
}

export interface LaporanWizardRequest {
  namaLaporan: string;
  deskripsi: string;
  jenisLaporanIds: number[];
}

export interface LaporanFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: string;
  namaLaporan?: string;  // Changed from 'nama' to match backend
  status?: string;
  jenisLaporanNama?: string;
}

export interface LaporanPageResponse {
  content: Laporan[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

class LaporanAPI {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Get all laporan with pagination and filters
  async getAll(filterRequest: LaporanFilterRequest): Promise<LaporanPageResponse> {
    // Convert "ALL" status to empty string for backend
    const backendRequest = {
      ...filterRequest,
      status: filterRequest.status === 'ALL' ? '' : filterRequest.status
    };
    
    const response = await fetch(`${API_BASE_URL}/api/laporan/search`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(backendRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil data laporan');
    }
    return response.json();
  }

  // Get laporan by ID
  async getById(id: number): Promise<Laporan> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/${id}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Laporan tidak ditemukan');
    }
    return response.json();
  }

  // Get laporan by pemilihan ID
  async getByPemilihanId(pemilihanId: number): Promise<Laporan[]> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/pemilihan/${pemilihanId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil laporan untuk pemilihan ini');
    }
    return response.json();
  }

  // Get laporan with tahapan details
  async getWithTahapan(id: number): Promise<Laporan> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/${id}/with-tahapan`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Laporan tidak ditemukan');
    }
    return response.json();
  }

  // Create new laporan
  async create(laporanRequest: LaporanRequest): Promise<Laporan> {
    const response = await fetch(`${API_BASE_URL}/api/laporan`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(laporanRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal membuat laporan');
    }
    return response.json();
  }

  // Create laporan with wizard (multiple jenis laporan)
  async createWizard(wizardRequest: LaporanWizardRequest): Promise<Laporan> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/wizard`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(wizardRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal membuat laporan');
    }
    return response.json();
  }

  // Update laporan
  async update(id: number, laporanRequest: LaporanRequest): Promise<Laporan> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(laporanRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengupdate laporan');
    }
    return response.json();
  }

  // Update laporan with wizard (multiple jenis laporan)
  async updateWizard(id: number, wizardRequest: LaporanWizardRequest): Promise<Laporan> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/${id}/wizard`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(wizardRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengupdate laporan');
    }
    return response.json();
  }

  // Delete laporan (soft delete)
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal menghapus laporan');
    }
  }

  // Hard delete laporan
  async hardDelete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/${id}/hard`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal menghapus laporan secara permanen');
    }
  }

  // Get statistics
  async getStats(): Promise<{
    total: number;
    draft: number;
    dalamProses: number;
    selesai: number;
    ditolak: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/laporan/stats`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil statistik');
    }
    return response.json();
  }
}

export const laporanAPI = new LaporanAPI();
