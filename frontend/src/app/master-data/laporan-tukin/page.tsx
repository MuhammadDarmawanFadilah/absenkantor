'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Users, TrendingDown, TrendingUp, User, Eye, Download } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface LaporanTukin {
  id: number
  bulan: number
  tahun: number
  status: string
  createdAt: string
  totalPegawai: number
  totalTukin: number
}

interface PegawaiSummary {
  id: number
  nama: string
  nip: string
  jabatan: string
  totalHadir: number
  totalAbsen: number
  totalTukin: number
  persentasePemotongan: number
}

interface DetailPegawai {
  id: number
  nama: string
  nip: string
  jabatan: string
  historiAbsensi: HistoriAbsensi[]
  totalTukin: number
  totalPemotongan: number
  netTukin: number
}

interface HistoriAbsensi {
  tanggal: string
  status: string
  jamMasuk: string
  jamPulang: string
  nominalPemotongan: number
  persentasePemotongan: number
  detailPemotongan: string
  keterangan: string
}

export default function LaporanTukinPage() {
  const [laporanList, setLaporanList] = useState<LaporanTukin[]>([])
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanTukin | null>(null)
  const [pegawaiList, setPegawaiList] = useState<PegawaiSummary[]>([])
  const [selectedPegawai, setSelectedPegawai] = useState<number | null>(null)
  const [detailPegawai, setDetailPegawai] = useState<DetailPegawai | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const [showOnlyDeductions, setShowOnlyDeductions] = useState(false)
  
  // Form untuk generate laporan baru
  const [generateForm, setGenerateForm] = useState({
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear()
  })

  const bulanNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  useEffect(() => {
    fetchLaporanList()
  }, [])

  const fetchLaporanList = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/master-data/laporan-tukin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (data.success) {
        setLaporanList(data.data.content || [])
      }
    } catch (error) {
      console.error('Error fetching laporan list:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateLaporan = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/master-data/laporan-tukin/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateForm)
      })
      
      const data = await response.json()
      if (data.success) {
        await fetchLaporanList()
        setActiveTab("list")
      }
    } catch (error) {
      console.error('Error generating laporan:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewLaporan = async (laporan: LaporanTukin) => {
    try {
      setLoading(true)
      setSelectedLaporan(laporan)
      
      const token = localStorage.getItem('authToken')
      
      // Fetch pegawai list untuk sub menu
      const pegawaiResponse = await fetch(`/api/admin/master-data/laporan-tukin/${laporan.id}/pegawai`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      const pegawaiData = await pegawaiResponse.json()
      if (pegawaiData.success) {
        setPegawaiList(pegawaiData.data || [])
      }
      
      // Fetch summary untuk tab "All"
      const summaryResponse = await fetch(`/api/admin/master-data/laporan-tukin/${laporan.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      const summaryData = await summaryResponse.json()
      if (summaryData.success) {
        // Transform data untuk tampilan summary
        const transformed = summaryData.data.detailPegawaiTukin?.map((item: any) => ({
          id: item.pegawai.id,
          nama: item.pegawai.nama,
          nip: item.pegawai.nip,
          jabatan: item.pegawai.jabatan?.nama || '-',
          totalHadir: item.historiAbsensi?.filter((h: any) => h.status === 'HADIR').length || 0,
          totalAbsen: item.historiAbsensi?.filter((h: any) => h.status !== 'HADIR').length || 0,
          totalTukin: item.totalTukin || 0,
          persentasePemotongan: item.totalPemotongan ? (item.totalPemotongan / item.totalTukin) * 100 : 0
        })) || []
        
        setPegawaiList(transformed)
      }
      
      setActiveTab("detail")
    } catch (error) {
      console.error('Error viewing laporan:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewPegawaiDetail = async (pegawaiId: number) => {
    if (!selectedLaporan) return
    
    try {
      setLoading(true)
      setSelectedPegawai(pegawaiId)
      
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/master-data/laporan-tukin/${selectedLaporan.id}/rincian?pegawaiId=${pegawaiId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        const detail = data.data[0]
        setDetailPegawai({
          id: detail.pegawai.id,
          nama: detail.pegawai.nama,
          nip: detail.pegawai.nip,
          jabatan: detail.pegawai.jabatan?.nama || '-',
          historiAbsensi: detail.historiAbsensi || [],
          totalTukin: detail.totalTukin || 0,
          totalPemotongan: detail.totalPemotongan || 0,
          netTukin: (detail.totalTukin || 0) - (detail.totalPemotongan || 0)
        })
      }
    } catch (error) {
      console.error('Error fetching pegawai detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'HADIR': { variant: 'default' as const, label: 'Hadir', color: 'bg-green-100 text-green-800' },
      'ALPHA': { variant: 'destructive' as const, label: 'Alpha', color: 'bg-red-100 text-red-800' },
      'IZIN': { variant: 'secondary' as const, label: 'Izin', color: 'bg-blue-100 text-blue-800' },
      'SAKIT': { variant: 'outline' as const, label: 'Sakit', color: 'bg-yellow-100 text-yellow-800' },
      'CUTI': { variant: 'outline' as const, label: 'Cuti', color: 'bg-purple-100 text-purple-800' },
      'TERLAMBAT': { variant: 'secondary' as const, label: 'Terlambat', color: 'bg-orange-100 text-orange-800' },
      'TERLAMBAT (DIKOMPENSASI LEMBUR)': { variant: 'default' as const, label: 'Terlambat (Dikompensasi)', color: 'bg-blue-100 text-blue-800' },
      'PULANG CEPAT': { variant: 'secondary' as const, label: 'Pulang Cepat', color: 'bg-orange-100 text-orange-800' },
      'TERLAMBAT + PULANG CEPAT': { variant: 'destructive' as const, label: 'Terlambat + Pulang Cepat', color: 'bg-red-100 text-red-800' },
      'TIDAK PULANG': { variant: 'destructive' as const, label: 'Tidak Pulang', color: 'bg-red-100 text-red-800' },
      'TIDAK MASUK': { variant: 'destructive' as const, label: 'Tidak Masuk', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Tukin</h1>
          <p className="text-muted-foreground">
            Kelola laporan tunjangan kinerja pegawai
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Daftar Laporan</TabsTrigger>
          <TabsTrigger value="generate">Generate Laporan</TabsTrigger>
          {selectedLaporan && <TabsTrigger value="detail">Rincian Detail</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daftar Laporan Tukin
              </CardTitle>
              <CardDescription>
                Daftar laporan tunjangan kinerja yang telah dibuat
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : laporanList.length > 0 ? (
                <div className="space-y-3">
                  {laporanList.map((laporan) => (
                    <div key={laporan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {bulanNames[laporan.bulan - 1]} {laporan.tahun}
                          </span>
                          <Badge variant={laporan.status === 'FINAL' ? 'default' : 'secondary'}>
                            {laporan.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {laporan.totalPegawai} pegawai • Total: {formatCurrency(laporan.totalTukin)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewLaporan(laporan)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {/* TODO: Download PDF */}}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada laporan tukin
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Laporan Baru</CardTitle>
              <CardDescription>
                Buat laporan tunjangan kinerja untuk periode tertentu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulan">Bulan</Label>
                  <Select
                    value={generateForm.bulan.toString()}
                    onValueChange={(value) => setGenerateForm(prev => ({ ...prev, bulan: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bulanNames.map((nama, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tahun">Tahun</Label>
                  <Input
                    id="tahun"
                    type="number"
                    value={generateForm.tahun}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, tahun: parseInt(e.target.value) || new Date().getFullYear() }))}
                  />
                </div>
              </div>
              <Button onClick={generateLaporan} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Laporan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedLaporan && (
          <TabsContent value="detail" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rincian Detail Per Pegawai
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>{bulanNames[selectedLaporan.bulan - 1]} {selectedLaporan.tahun}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-600">{pegawaiList.length} pegawai</span>
                    <span className="text-green-600">
                      {pegawaiList.reduce((sum, p) => sum + p.totalHadir, 0)} hari hadir
                    </span>
                    <span className="text-red-600">
                      {pegawaiList.reduce((sum, p) => sum + p.totalAbsen, 0)} hari pemotongan
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">Semua Pegawai</TabsTrigger>
                    <TabsTrigger value="individual">Per Pegawai</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    <div className="grid gap-4">
                      {pegawaiList.map((pegawai) => (
                        <div key={pegawai.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{pegawai.nama}</h4>
                              <p className="text-sm text-muted-foreground">
                                {pegawai.nip} • {pegawai.jabatan}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewPegawaiDetail(pegawai.id)}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Hadir</div>
                              <div className="font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                {pegawai.totalHadir} hari
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Absen</div>
                              <div className="font-medium flex items-center gap-1">
                                <TrendingDown className="h-3 w-3 text-red-500" />
                                {pegawai.totalAbsen} hari
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Total Tukin</div>
                              <div className="font-medium">{formatCurrency(pegawai.totalTukin)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Pemotongan</div>
                              <div className="font-medium text-red-600 flex flex-col">
                                <span>{pegawai.persentasePemotongan.toFixed(1)}%</span>
                                {pegawai.totalAbsen > 0 && (
                                  <span className="text-xs text-red-500">
                                    {pegawai.totalAbsen} hari ada pemotongan
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="individual" className="space-y-4">
                    <div className="space-y-4">
                      <Select
                        value={selectedPegawai?.toString() || ""}
                        onValueChange={(value) => viewPegawaiDetail(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pegawai..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pegawaiList.map((pegawai) => (
                            <SelectItem key={pegawai.id} value={pegawai.id.toString()}>
                              {pegawai.nama} - {pegawai.nip}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {detailPegawai && (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>{detailPegawai.nama}</CardTitle>
                              <CardDescription>
                                {detailPegawai.nip} • {detailPegawai.jabatan}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(detailPegawai.totalTukin)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Total Tukin</div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                  <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(detailPegawai.totalPemotongan)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Total Pemotongan</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(detailPegawai.netTukin)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Net Tukin</div>
                                </div>
                              </div>

                              {/* Additional statistics */}
                              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-600">
                                    {detailPegawai.historiAbsensi.filter(h => h.nominalPemotongan === 0).length}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Hari Normal</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-red-600">
                                    {detailPegawai.historiAbsensi.filter(h => h.nominalPemotongan > 0).length}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Hari Ada Pemotongan</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-orange-600">
                                    {detailPegawai.historiAbsensi.filter(h => h.status?.includes('TERLAMBAT')).length}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Hari Terlambat</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-purple-600">
                                    {((detailPegawai.totalPemotongan / detailPegawai.totalTukin) * 100).toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">% Pemotongan</div>
                                </div>
                              </div>

                              {/* Breakdown by deduction type */}
                              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h5 className="font-medium mb-3 text-blue-800">Rincian Pemotongan per Kategori</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div className="text-center p-2 bg-white rounded">
                                    <div className="font-semibold text-red-600">
                                      {detailPegawai.historiAbsensi.filter(h => h.status === 'ALPHA').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Alpha</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded">
                                    <div className="font-semibold text-orange-600">
                                      {detailPegawai.historiAbsensi.filter(h => h.status?.includes('TERLAMBAT')).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Terlambat</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded">
                                    <div className="font-semibold text-purple-600">
                                      {detailPegawai.historiAbsensi.filter(h => h.status?.includes('PULANG CEPAT')).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Pulang Cepat</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded">
                                    <div className="font-semibold text-pink-600">
                                      {detailPegawai.historiAbsensi.filter(h => h.status?.includes('TIDAK')).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Tidak Hadir</div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Rincian Harian</h4>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="showDeductions"
                                      checked={showOnlyDeductions}
                                      onChange={(e) => setShowOnlyDeductions(e.target.checked)}
                                      className="rounded border-gray-300"
                                    />
                                    <label htmlFor="showDeductions" className="text-sm text-muted-foreground">
                                      Tampilkan hanya hari dengan pemotongan
                                    </label>
                                  </div>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                  {showOnlyDeductions && (
                                    <div className="p-3 bg-yellow-50 border-b text-sm text-yellow-800">
                                      Menampilkan {detailPegawai.historiAbsensi.filter(h => h.nominalPemotongan > 0).length} dari {detailPegawai.historiAbsensi.length} hari dengan pemotongan
                                    </div>
                                  )}
                                  <div className="grid grid-cols-6 gap-2 p-3 bg-muted text-sm font-medium">
                                    <div>Tanggal</div>
                                    <div>Status</div>
                                    <div>Jam Masuk</div>
                                    <div>Jam Pulang</div>
                                    <div>Pemotongan</div>
                                    <div>Keterangan</div>
                                  </div>
                                  {detailPegawai.historiAbsensi
                                    .filter(item => !showOnlyDeductions || item.nominalPemotongan > 0)
                                    .map((item, index) => (
                                    <div key={index} className={`grid grid-cols-6 gap-2 p-3 border-t text-sm ${item.nominalPemotongan > 0 ? 'bg-red-50' : ''}`}>
                                      <div>{format(new Date(item.tanggal), 'dd MMM', { locale: id })}</div>
                                      <div>{getStatusBadge(item.status)}</div>
                                      <div className="font-mono text-sm">{item.jamMasuk || '-'}</div>
                                      <div className="font-mono text-sm">{item.jamPulang || '-'}</div>
                                      <div className="space-y-1">
                                        {item.nominalPemotongan > 0 ? (
                                          <div className="space-y-1">
                                            <div className="text-red-600 font-medium">
                                              {formatCurrency(item.nominalPemotongan)}
                                            </div>
                                            <div className="text-xs text-red-500">
                                              ({item.persentasePemotongan.toFixed(1)}%)
                                            </div>
                                            {item.detailPemotongan && (
                                              <div className="text-xs text-muted-foreground bg-red-50 p-1 rounded">
                                                {item.detailPemotongan}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-muted-foreground">-</div>
                                        )}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {item.keterangan || '-'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
