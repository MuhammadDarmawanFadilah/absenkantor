import { ApiResponse } from '@/types/api'

export interface PemilihanDTO {
  pemilihanId?: number
  judulPemilihan: string
  deskripsi?: string
  status: string
  tingkatPemilihan?: string
  provinsi: string
  provinsiNama?: string
  kota: string
  kotaNama?: string
  kecamatan?: string
  kecamatanNama?: string
  kelurahan?: string
  kelurahanNama?: string
  rt?: string
  rw?: string
  latitude?: number
  longitude?: number
  alamatLokasi?: string
  wilayahTingkat?: string
  tanggalPembuatan?: string
  tanggalAktif?: string
  tanggalBerakhir?: string
  tanggalMulai?: string
  tanggalSelesai?: string
  createdAt?: string
  updatedAt?: string
  detailLaporan?: DetailPemilihanDTO[]
  totalLaporan?: number
  alamatLengkap?: string
}

export interface DetailPemilihanDTO {
  detailPemilihanId?: number
  laporanId: number
  namaCandidat: string
  partai?: string
  fotoPath?: string
  urutanTampil: number
  posisiLayout: number
  keterangan?: string
  jenisLaporan?: string
  status?: string
}

export interface DetailLaporanDto {
  laporanId: number
}

export interface CreatePemilihanRequest {
  judulPemilihan: string
  deskripsi?: string
  status?: string
  provinsi: string
  kota: string
  kecamatan?: string
  kelurahan?: string
  tingkatPemilihan?: string
  rt?: string
  rw?: string
  alamatLokasi?: string
  latitude?: number
  longitude?: number
  tanggalAktif?: string
  tanggalBerakhir?: string
  detailLaporan?: DetailLaporanDto[]
}

export interface PemilihanWilayahRequest {
  provinsi: string
  kota?: string
  kecamatan?: string
  kelurahan?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export const pemilihanApi = {
  // Get all pemilihan
  getAll: async (): Promise<ApiResponse<PemilihanDTO[]>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan`)
    if (!response.ok) {
      throw new Error('Failed to fetch pemilihan data')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Get pemilihan by ID
  getById: async (id: number): Promise<ApiResponse<PemilihanDTO>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/${id}`)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pemilihan not found')
      }
      throw new Error('Failed to fetch pemilihan data')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Get pemilihan by status
  getByStatus: async (status: string): Promise<ApiResponse<PemilihanDTO[]>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/status/${status}`)
    if (!response.ok) {
      throw new Error('Failed to fetch pemilihan data by status')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Get pemilihan by wilayah
  getByWilayah: async (params: PemilihanWilayahRequest): Promise<ApiResponse<PemilihanDTO[]>> => {
    const searchParams = new URLSearchParams({ provinsi: params.provinsi })
    if (params.kota) searchParams.append('kota', params.kota)
    if (params.kecamatan) searchParams.append('kecamatan', params.kecamatan)
    if (params.kelurahan) searchParams.append('kelurahan', params.kelurahan)

    const response = await fetch(`${BASE_URL}/api/pemilihan/wilayah?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch pemilihan data by wilayah')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Get active pemilihan
  getActive: async (): Promise<ApiResponse<PemilihanDTO[]>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/active`)
    if (!response.ok) {
      throw new Error('Failed to fetch active pemilihan data')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Create pemilihan
  create: async (data: CreatePemilihanRequest): Promise<ApiResponse<PemilihanDTO>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create pemilihan')
    }

    const result = await response.json()
    return { data: result, success: true }
  },

  // Update pemilihan
  update: async (id: number, data: CreatePemilihanRequest): Promise<ApiResponse<PemilihanDTO>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pemilihan not found')
      }
      throw new Error('Failed to update pemilihan')
    }

    const result = await response.json()
    return { data: result, success: true }
  },

  // Delete pemilihan
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pemilihan not found')
      }
      throw new Error('Failed to delete pemilihan')
    }

    return { data: undefined, success: true }
  },

  // Get active provinsi
  getActiveProvinsi: async (): Promise<ApiResponse<string[]>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/provinsi`)
    if (!response.ok) {
      throw new Error('Failed to fetch active provinsi')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Get active kota by provinsi
  getActiveKotaByProvinsi: async (provinsi: string): Promise<ApiResponse<string[]>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/kota?provinsi=${encodeURIComponent(provinsi)}`)
    if (!response.ok) {
      throw new Error('Failed to fetch active kota')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Search pemilihan
  search: async (keyword: string): Promise<ApiResponse<PemilihanDTO[]>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/search?keyword=${encodeURIComponent(keyword)}`)
    if (!response.ok) {
      throw new Error('Failed to search pemilihan')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Search pemilihan with pagination
  searchPaged: async (params: {
    keyword?: string
    tingkat?: string
    status?: string
    provinsiId?: string
    kotaId?: string
    kecamatanId?: string
    pegawaiId?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<any>> => {
    const searchParams = new URLSearchParams()
    
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.tingkat) searchParams.append('tingkat', params.tingkat)
    if (params.status) searchParams.append('status', params.status)
    if (params.provinsiId) searchParams.append('provinsiId', params.provinsiId)
    if (params.kotaId) searchParams.append('kotaId', params.kotaId)
    if (params.kecamatanId) searchParams.append('kecamatanId', params.kecamatanId)
    if (params.pegawaiId) searchParams.append('pegawaiId', params.pegawaiId)
    if (params.page !== undefined) searchParams.append('page', params.page.toString())
    if (params.size !== undefined) searchParams.append('size', params.size.toString())
    
    const response = await fetch(`${BASE_URL}/api/pemilihan/search-paged?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to search pemilihan with pagination')
    }
    const data = await response.json()
    return { data, success: true }
  },

  // Update expired pemilihan
  updateExpired: async (): Promise<ApiResponse<void>> => {
    const response = await fetch(`${BASE_URL}/api/pemilihan/update-expired`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to update expired pemilihan')
    }

    return { data: undefined, success: true }
  },
}
