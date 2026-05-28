import { getApiUrl } from '@/lib/config';

export interface PegawaiCutiQuota {
  jenisCutiId: number;
  jenisCutiNama: string;
  tahun: number;
  jatahHari: number;
  cutiTerpakai: number;
  sisaCuti: number;
}

export const pegawaiCutiQuotaService = {
  async getPegawaiCutiQuota(pegawaiId: number): Promise<PegawaiCutiQuota[]> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    const response = await fetch(getApiUrl(`pegawai-cuti/pegawai/${pegawaiId}/quota`), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil quota cuti');
    }

    return response.json();
  },

  async getPegawaiCutiQuotaByTahun(pegawaiId: number, tahun: number): Promise<PegawaiCutiQuota[]> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    const response = await fetch(getApiUrl(`pegawai-cuti/pegawai/${pegawaiId}/quota/tahun/${tahun}`), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil quota cuti');
    }

    return response.json();
  }
};
