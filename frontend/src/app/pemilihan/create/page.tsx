'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, MapPin, Users, Calendar, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { wilayahAPI } from '@/lib/wilayah-api'
import { laporanAPI } from '@/lib/laporan-api'
import { pemilihanApi, CreatePemilihanRequest, DetailPemilihanDTO } from '@/lib/pemilihan-api'

interface WilayahOption {
  id: string
  nama: string
}

interface JenisLaporan {
  jenisLaporanId: number
  nama: string
}

interface LaporanWithJenis {
  laporanId: number
  namaLaporan: string
  deskripsi?: string
  status: string
  jenisLaporan: JenisLaporan[]
}

export default function CreatePemilihanPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form data
  const [formData, setFormData] = useState<CreatePemilihanRequest>({
    judulPemilihan: '',
    deskripsi: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    detailLaporan: []
  })

  // Wilayah options
  const [provinsiOptions, setProvinsiOptions] = useState<WilayahOption[]>([])
  const [kotaOptions, setKotaOptions] = useState<WilayahOption[]>([])
  const [kecamatanOptions, setKecamatanOptions] = useState<WilayahOption[]>([])
  const [kelurahanOptions, setKelurahanOptions] = useState<WilayahOption[]>([])
  
  // Laporan data
  const [availableLaporan, setAvailableLaporan] = useState<LaporanWithJenis[]>([])
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanWithJenis[]>([])

  const steps = [
    { id: 1, title: 'Informasi Dasar', icon: FileText },
    { id: 2, title: 'Lokasi Pemilihan', icon: MapPin },
    { id: 3, title: 'Pilih Kandidat', icon: Users },
    { id: 4, title: 'Konfirmasi', icon: Calendar }
  ]

  // Load provinsi on mount
  useEffect(() => {
    loadProvinsi()
    loadAvailableLaporan()
  }, [])

  // Load wilayah data
  const loadProvinsi = async () => {
    try {
      const provinces = await wilayahAPI.getProvinces()
      setProvinsiOptions(provinces.map(p => ({ id: p.code, nama: p.name })))
    } catch (error) {
      toast.error('Gagal memuat data provinsi')
    }
  }

  const loadKota = async (provinsiId: string) => {
    try {
      const regencies = await wilayahAPI.getRegencies(provinsiId)
      setKotaOptions(regencies.map(r => ({ id: r.code, nama: r.name })))
      setKecamatanOptions([])
      setKelurahanOptions([])
    } catch (error) {
      toast.error('Gagal memuat data kota/kabupaten')
    }
  }

  const loadKecamatan = async (kotaId: string) => {
    try {
      const districts = await wilayahAPI.getDistricts(kotaId)
      setKecamatanOptions(districts.map(d => ({ id: d.code, nama: d.name })))
      setKelurahanOptions([])
    } catch (error) {
      toast.error('Gagal memuat data kecamatan')
    }
  }

  const loadKelurahan = async (kecamatanId: string) => {
    try {
      const villages = await wilayahAPI.getVillages(kecamatanId)
      setKelurahanOptions(villages.map(v => ({ id: v.code, nama: v.name })))
    } catch (error) {
      toast.error('Gagal memuat data kelurahan')
    }
  }

  // Load available laporan
  const loadAvailableLaporan = async () => {
    try {
      const response = await laporanAPI.getAll({ 
        page: 0, 
        size: 100,
        sortBy: 'namaLaporan',
        sortDirection: 'asc'
      })
      const laporanData: LaporanWithJenis[] = response.content.map((item: any) => ({
        laporanId: item.laporanId,
        namaLaporan: item.namaLaporan,
        deskripsi: item.deskripsi,
        status: item.status,
        jenisLaporan: [{ // For now, create a single jenis laporan entry
          jenisLaporanId: item.jenisLaporanId || 1,
          nama: item.jenisLaporanNama || 'Umum'
        }]
      }))
      setAvailableLaporan(laporanData)
    } catch (error) {
      toast.error('Gagal memuat data laporan')
    }
  }

  // Handle wilayah changes
  const handleProvinsiChange = (provinsiId: string) => {
    const provinsi = provinsiOptions.find(p => p.id === provinsiId)
    setFormData(prev => ({
      ...prev,
      provinsi: provinsi?.nama || '',
      kota: '',
      kecamatan: '',
      kelurahan: ''
    }))
    if (provinsiId) {
      loadKota(provinsiId)
    }
  }

  const handleKotaChange = (kotaId: string) => {
    const kota = kotaOptions.find(k => k.id === kotaId)
    setFormData(prev => ({
      ...prev,
      kota: kota?.nama || '',
      kecamatan: '',
      kelurahan: ''
    }))
    if (kotaId) {
      loadKecamatan(kotaId)
    }
  }

  const handleKecamatanChange = (kecamatanId: string) => {
    const kecamatan = kecamatanOptions.find(k => k.id === kecamatanId)
    setFormData(prev => ({
      ...prev,
      kecamatan: kecamatan?.nama || '',
      kelurahan: ''
    }))
    if (kecamatanId) {
      loadKelurahan(kecamatanId)
    }
  }

  const handleKelurahanChange = (kelurahanId: string) => {
    const kelurahan = kelurahanOptions.find(k => k.id === kelurahanId)
    setFormData(prev => ({
      ...prev,
      kelurahan: kelurahan?.nama || ''
    }))
  }

  // Handle laporan selection
  const toggleLaporanSelection = (laporan: LaporanWithJenis) => {
    setSelectedLaporan(prev => {
      const isSelected = prev.some(l => l.laporanId === laporan.laporanId)
      if (isSelected) {
        return prev.filter(l => l.laporanId !== laporan.laporanId)
      } else {
        return [...prev, laporan]
      }
    })
  }

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.judulPemilihan.trim() !== ''
      case 2:
        return formData.provinsi !== '' && formData.kota !== ''
      case 3:
        return selectedLaporan.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  // Navigate steps
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    } else {
      toast.error('Mohon lengkapi semua field yang diperlukan')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Get tingkat pemilihan display name
  const getTingkatPemilihanName = () => {
    if (formData.kelurahan) {
      return 'Kelurahan'
    } else if (formData.kecamatan) {
      return 'Kecamatan'
    } else if (formData.kota) {
      if (formData.kota.toLowerCase().includes('kabupaten')) {
        return 'Kabupaten'
      } else {
        return 'Kota'
      }
    }
    return 'Provinsi'
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error('Mohon lengkapi semua data yang diperlukan')
      return
    }

    setLoading(true)
    try {
      // Prepare detail pemilihan
      const detailPemilihan: Omit<DetailPemilihanDTO, 'detailPemilihanId'>[] = selectedLaporan.map((laporan, index) => ({
        laporanId: laporan.laporanId,
        namaCandidat: laporan.namaLaporan,
        urutanTampil: index + 1,
        posisiLayout: index + 1,
        keterangan: `Kandidat ${index + 1}`
      }))

      // Determine tingkat pemilihan based on selected wilayah
      let tingkatPemilihan = 'PROVINSI'
      if (formData.kelurahan) {
        tingkatPemilihan = 'KELURAHAN'
      } else if (formData.kecamatan) {
        tingkatPemilihan = 'KECAMATAN'
      } else if (formData.kota) {
        if (formData.kota.toLowerCase().includes('kabupaten')) {
          tingkatPemilihan = 'KABUPATEN'
        } else {
          tingkatPemilihan = 'KOTA'
        }
      }

      const submitData: CreatePemilihanRequest = {
        ...formData,
        status: 'DRAFT',
        tingkatPemilihan,
        detailLaporan: detailPemilihan
      }

      await pemilihanApi.create(submitData)
      toast.success('Pemilihan berhasil dibuat!')
      router.push('/pemilihan')
    } catch (error) {
      console.error('Error creating pemilihan:', error)
      toast.error('Gagal membuat pemilihan')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="judulPemilihan">Judul Pemilihan *</Label>
        <Input
          id="judulPemilihan"
          value={formData.judulPemilihan}
          onChange={(e) => setFormData(prev => ({ ...prev, judulPemilihan: e.target.value }))}
          placeholder="Masukkan judul pemilihan"
        />
      </div>
      <div>
        <Label htmlFor="deskripsi">Deskripsi</Label>
        <Textarea
          id="deskripsi"
          value={formData.deskripsi}
          onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
          placeholder="Masukkan deskripsi pemilihan"
          rows={4}
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="provinsi">Provinsi *</Label>
        <select
          id="provinsi"
          value={provinsiOptions.find(p => p.nama === formData.provinsi)?.id || ''}
          onChange={(e) => handleProvinsiChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Pilih Provinsi</option>
          {provinsiOptions.map(provinsi => (
            <option key={provinsi.id} value={provinsi.id}>
              {provinsi.nama}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="kota">Kota/Kabupaten *</Label>
        <select
          id="kota"
          value={kotaOptions.find(k => k.nama === formData.kota)?.id || ''}
          onChange={(e) => handleKotaChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!formData.provinsi}
        >
          <option value="">Pilih Kota/Kabupaten</option>
          {kotaOptions.map(kota => (
            <option key={kota.id} value={kota.id}>
              {kota.nama}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="kecamatan">Kecamatan</Label>
        <select
          id="kecamatan"
          value={kecamatanOptions.find(k => k.nama === formData.kecamatan)?.id || ''}
          onChange={(e) => handleKecamatanChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!formData.kota}
        >
          <option value="">Pilih Kecamatan</option>
          {kecamatanOptions.map(kecamatan => (
            <option key={kecamatan.id} value={kecamatan.id}>
              {kecamatan.nama}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="kelurahan">Kelurahan/Desa</Label>
        <select
          id="kelurahan"
          value={kelurahanOptions.find(k => k.nama === formData.kelurahan)?.id || ''}
          onChange={(e) => handleKelurahanChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!formData.kecamatan}
        >
          <option value="">Pilih Kelurahan/Desa</option>
          {kelurahanOptions.map(kelurahan => (
            <option key={kelurahan.id} value={kelurahan.id}>
              {kelurahan.nama}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <Label>Pilih Kandidat (Laporan) *</Label>
        <p className="text-sm text-gray-600 mt-1">
          Pilih laporan yang akan dijadikan kandidat dalam pemilihan
        </p>
      </div>

      {selectedLaporan.length > 0 && (
        <div className="mb-4">
          <Label className="text-sm font-medium">Kandidat Terpilih ({selectedLaporan.length})</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {selectedLaporan.map((laporan, index) => (
              <div key={laporan.laporanId} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <span className="font-medium">#{index + 1} {laporan.namaLaporan}</span>
                  <div className="flex gap-1 mt-1">
                    {laporan.jenisLaporan.slice(0, 2).map((jenis, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {jenis.nama}
                      </Badge>
                    ))}
                    {laporan.jenisLaporan.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{laporan.jenisLaporan.length - 2} lainnya
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLaporanSelection(laporan)}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        {availableLaporan.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Tidak ada laporan tersedia
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {availableLaporan.map((laporan) => {
              const isSelected = selectedLaporan.some(l => l.laporanId === laporan.laporanId)
              return (
                <div
                  key={laporan.laporanId}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => toggleLaporanSelection(laporan)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{laporan.namaLaporan}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {laporan.deskripsi || 'Tidak ada deskripsi'}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {laporan.jenisLaporan.slice(0, 3).map((jenis, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {jenis.nama}
                          </Badge>
                        ))}
                        {laporan.jenisLaporan.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{laporan.jenisLaporan.length - 3} lainnya
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleLaporanSelection(laporan)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Konfirmasi Data Pemilihan</h3>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Judul</p>
              <p className="text-lg font-bold text-blue-800 truncate" title={formData.judulPemilihan}>
                {formData.judulPemilihan || 'Belum diisi'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">Tingkat</p>
              <p className="text-lg font-bold text-green-800">
                {getTingkatPemilihanName()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 font-medium">Wilayah</p>
              <p className="text-lg font-bold text-purple-800 truncate" title={formData.provinsi}>
                {formData.kota || formData.provinsi || 'Belum dipilih'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-orange-600 font-medium">Kandidat</p>
              <p className="text-lg font-bold text-orange-800">
                {selectedLaporan.length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-600 font-medium">Status</p>
              <p className="text-lg font-bold text-red-800">
                Draft
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Judul Pemilihan</Label>
            <p className="font-medium">{formData.judulPemilihan}</p>
          </div>

          {formData.deskripsi && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Deskripsi</Label>
              <p className="text-sm">{formData.deskripsi}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-gray-600">Tingkat Pemilihan</Label>
            <p className="font-medium">{getTingkatPemilihanName()}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-600">Lokasi</Label>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Provinsi:</span>
                  <span className="ml-2">{formData.provinsi || 'Belum dipilih'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Kota/Kabupaten:</span>
                  <span className="ml-2">{formData.kota || 'Belum dipilih'}</span>
                </div>
                {formData.kecamatan && (
                  <div>
                    <span className="font-medium text-gray-700">Kecamatan:</span>
                    <span className="ml-2">{formData.kecamatan}</span>
                  </div>
                )}
                {formData.kelurahan && (
                  <div>
                    <span className="font-medium text-gray-700">Kelurahan:</span>
                    <span className="ml-2">{formData.kelurahan}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Alamat lengkap: {[formData.kelurahan, formData.kecamatan, formData.kota, formData.provinsi]
                  .filter(Boolean)
                  .join(', ') || 'Belum ada data lokasi'}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-600">Kandidat Terpilih</Label>
            <div className="mt-2 space-y-2">
              {selectedLaporan.map((laporan, index) => (
                <div key={laporan.laporanId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{laporan.namaLaporan}</p>
                    <div className="flex gap-1 mt-1">
                      {laporan.jenisLaporan.slice(0, 2).map((jenis, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {jenis.nama}
                        </Badge>
                      ))}
                      {laporan.jenisLaporan.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{laporan.jenisLaporan.length - 2} lainnya
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold">Buat Pemilihan Baru</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-gray-300 bg-white text-gray-400'}
                `}>
                  <StepIcon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    Step {step.id}
                  </p>
                  <p className={`text-xs ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Sebelumnya
        </Button>

        {currentStep < 4 ? (
          <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
            Selanjutnya
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Buat Pemilihan'}
          </Button>
        )}
      </div>
    </div>
  )
}
