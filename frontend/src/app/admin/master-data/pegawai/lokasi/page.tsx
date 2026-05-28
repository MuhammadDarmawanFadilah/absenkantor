"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";
import { MapPin, User, Building2, Search, Filter, Users, Eye, Shield, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ServerPagination } from "@/components/ServerPagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import PegawaiMap from "@/components/PegawaiMap";

interface PegawaiLocation {
  id: number;
  nip?: string;
  namaLengkap?: string;
  fullName?: string; // Backend compatibility
  email?: string;
  noTelp?: string;
  phoneNumber?: string; // Backend compatibility
  alamat?: string;
  jenisKelamin?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  pendidikan?: string;
  tanggalMasuk?: string;
  role?: string;
  jabatan?: {
    id: number;
    nama: string;
  };
  lokasi?: {
    id: number;
    namaLokasi: string;
  };
  isActive?: boolean;
  status?: string; // Backend compatibility
  createdAt?: string;
  updatedAt?: string;
  // Location data
  latitude?: number;
  longitude?: number;
  provinsi?: string;
  provinsiNama?: string; // Backend compatibility
  kota?: string;
  kotaNama?: string; // Backend compatibility
  kecamatan?: string;
  kecamatanNama?: string; // Backend compatibility
  kelurahan?: string;
  kelurahanNama?: string; // Backend compatibility
  kodePos?: string;
  photoUrl?: string;
  fotoKaryawan?: string; // Backend compatibility
}

export default function PegawaiLokasiPage() {
  const router = useRouter();
  const [pegawaiList, setPegawaiList] = useState<PegawaiLocation[]>([]);
  const [allPegawaiLocations, setAllPegawaiLocations] = useState<PegawaiLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.548926, 118.0148634]);
  const [mapZoom, setMapZoom] = useState(5);

  // Filter states
  const [namaFilter, setNamaFilter] = useState("");
  const [provinsiFilter, setProvinsiFilter] = useState("");
  const [kotaFilter, setKotaFilter] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [selectedJabatan, setSelectedJabatan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);

  // Applied filters (only used when search button is pressed)
  const [appliedNamaFilter, setAppliedNamaFilter] = useState("");
  const [appliedProvinsiFilter, setAppliedProvinsiFilter] = useState("");
  const [appliedKotaFilter, setAppliedKotaFilter] = useState("");
  const [appliedKecamatanFilter, setAppliedKecamatanFilter] = useState("");
  const [appliedSelectedJabatan, setAppliedSelectedJabatan] = useState<string>("all");
  const [appliedSelectedStatus, setAppliedSelectedStatus] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('namaLengkap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { toast } = useToast();
  const { token } = useAuth();

  // Helper function to normalize pegawai data
  const normalizePegawaiData = (pegawai: any): PegawaiLocation => ({
    id: pegawai.id,
    nip: pegawai.nip || '',
    namaLengkap: pegawai.namaLengkap || pegawai.fullName || 'Nama tidak tersedia',
    fullName: pegawai.fullName || pegawai.namaLengkap || 'Nama tidak tersedia',
    email: pegawai.email || '',
    noTelp: pegawai.noTelp || pegawai.phoneNumber || '',
    phoneNumber: pegawai.phoneNumber || pegawai.noTelp || '',
    alamat: pegawai.alamat || '',
    jenisKelamin: pegawai.jenisKelamin || '',
    tanggalLahir: pegawai.tanggalLahir || '',
    tempatLahir: pegawai.tempatLahir || '',
    pendidikan: pegawai.pendidikan || '',
    tanggalMasuk: pegawai.tanggalMasuk || '',
    role: pegawai.role || '',
    jabatan: pegawai.jabatan,
    lokasi: pegawai.lokasi,
    isActive: pegawai.isActive,
    status: pegawai.status || (pegawai.isActive ? 'AKTIF' : 'TIDAK_AKTIF'),
    createdAt: pegawai.createdAt || '',
    updatedAt: pegawai.updatedAt || '',
    latitude: pegawai.latitude,
    longitude: pegawai.longitude,
    provinsi: pegawai.provinsi || '',
    provinsiNama: pegawai.provinsiNama || pegawai.provinsi || '',
    kota: pegawai.kota || '',
    kotaNama: pegawai.kotaNama || pegawai.kota || '',
    kecamatan: pegawai.kecamatan || '',
    kecamatanNama: pegawai.kecamatanNama || pegawai.kecamatan || '',
    kelurahan: pegawai.kelurahan || '',
    kelurahanNama: pegawai.kelurahanNama || pegawai.kelurahan || '',
    kodePos: pegawai.kodePos || '',
    photoUrl: pegawai.photoUrl || pegawai.fotoKaryawan,
    fotoKaryawan: pegawai.fotoKaryawan || pegawai.photoUrl
  });

  // Helper function to get authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  useEffect(() => {
    fetchPegawaiLocations();
    fetchAllPegawaiLocations();
  }, [currentPage, pageSize, appliedNamaFilter, appliedProvinsiFilter, appliedKotaFilter, appliedKecamatanFilter, appliedSelectedJabatan, appliedSelectedStatus, sortBy, sortDir]);

  const fetchAllPegawaiLocations = async () => {
    try {
      const params = new URLSearchParams();
      if (appliedNamaFilter) params.append('nama', appliedNamaFilter);
      if (appliedProvinsiFilter) params.append('provinsi', appliedProvinsiFilter);
      if (appliedKotaFilter) params.append('kota', appliedKotaFilter);
      if (appliedKecamatanFilter) params.append('kecamatan', appliedKecamatanFilter);
      if (appliedSelectedJabatan && appliedSelectedJabatan !== "all") params.append('jabatan', appliedSelectedJabatan);
      if (appliedSelectedStatus && appliedSelectedStatus !== "all") params.append('status', appliedSelectedStatus);

      const response = await fetch(getApiUrl(`/api/pegawai/map-locations?${params.toString()}`), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedData = data.map(normalizePegawaiData);
        setAllPegawaiLocations(normalizedData);
        
        // Auto-center map if results are filtered
        if (normalizedData.length > 0 && (appliedProvinsiFilter || appliedKotaFilter || appliedKecamatanFilter)) {
          const validLocations = normalizedData.filter((loc: PegawaiLocation) => loc.latitude != null && loc.longitude != null);
          if (validLocations.length > 0) {
            const avgLat = validLocations.reduce((sum: number, loc: PegawaiLocation) => sum + (loc.latitude || 0), 0) / validLocations.length;
            const avgLng = validLocations.reduce((sum: number, loc: PegawaiLocation) => sum + (loc.longitude || 0), 0) / validLocations.length;
            setMapCenter([avgLat, avgLng]);
            setMapZoom(appliedKecamatanFilter ? 12 : appliedKotaFilter ? 10 : appliedProvinsiFilter ? 8 : 5);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching all pegawai locations:', error);
    }
  };

  const fetchPegawaiLocations = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      params.append('sortBy', sortBy);
      params.append('sortDirection', sortDir);
      params.append('hasLocation', 'true'); // Only get pegawai with location data

      if (appliedNamaFilter) params.append('nama', appliedNamaFilter);
      if (appliedProvinsiFilter) params.append('provinsi', appliedProvinsiFilter);
      if (appliedKotaFilter) params.append('kota', appliedKotaFilter);
      if (appliedKecamatanFilter) params.append('kecamatan', appliedKecamatanFilter);
      if (appliedSelectedJabatan && appliedSelectedJabatan !== "all") params.append('jabatan', appliedSelectedJabatan);
      if (appliedSelectedStatus && appliedSelectedStatus !== "all") params.append('status', appliedSelectedStatus);

      const response = await fetch(getApiUrl(`/api/pegawai?${params.toString()}`), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only pegawai with location data and normalize
        const pegawaiWithLocation = (data.pegawai || data)
          .filter((p: any) => p.latitude && p.longitude && p.alamat)
          .map(normalizePegawaiData);
        setPegawaiList(pegawaiWithLocation);
        setTotalPages(data.totalPages || 0);
        setTotalElements(pegawaiWithLocation.length);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal memuat data lokasi pegawai",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching pegawai locations:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data lokasi pegawai",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedNamaFilter(namaFilter);
    setAppliedProvinsiFilter(provinsiFilter);
    setAppliedKotaFilter(kotaFilter);
    setAppliedKecamatanFilter(kecamatanFilter);
    setAppliedSelectedJabatan(selectedJabatan);
    setAppliedSelectedStatus(selectedStatus);
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setNamaFilter("");
    setProvinsiFilter("");
    setKotaFilter("");
    setKecamatanFilter("");
    setSelectedJabatan("all");
    setSelectedStatus("all");
    setAppliedNamaFilter("");
    setAppliedProvinsiFilter("");
    setAppliedKotaFilter("");
    setAppliedKecamatanFilter("");
    setAppliedSelectedJabatan("all");
    setAppliedSelectedStatus("all");
    setCurrentPage(0);
  };

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const handlePegawaiClick = (pegawaiId: number) => {
    router.push(`/admin/master-data/pegawai/${pegawaiId}`);
  };

  // Get unique provinces and cities for statistics
  const uniqueProvinces = new Set(allPegawaiLocations.map(p => p.provinsiNama || p.provinsi)).size;
  const uniqueCities = new Set(allPegawaiLocations.map(p => p.kotaNama || p.kota)).size;

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "VERIFICATOR"]}>
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Lokasi Pegawai"
          description="Peta dan daftar lokasi pegawai yang memiliki data alamat lengkap"
          icon={MapPin}
          primaryAction={{
            label: "Kembali ke Master Data Pegawai",
            onClick: () => router.push('/admin/master-data/pegawai'),
            icon: ArrowLeft
          }}
          stats={[
            {
              label: "Total Pegawai Terlokasi",
              value: allPegawaiLocations.length,
              variant: "secondary"
            },
            {
              label: "Provinsi Tersebar",
              value: uniqueProvinces,
              variant: "default"
            },
            {
              label: "Kota/Kabupaten",
              value: uniqueCities,
              variant: "outline"
            }
          ]}
        />

        <div className="container mx-auto p-6 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">Total Lokasi</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : allPegawaiLocations.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-muted-foreground">Pegawai Aktif</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : allPegawaiLocations.filter(p => p.isActive || p.status === 'AKTIF').length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-muted-foreground">Total Provinsi</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : uniqueProvinces}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Filter Section */}
          {showFilters && (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Filter Pencarian Lokasi Pegawai
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Sembunyikan Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Nama
                    </label>
                    <Input
                      placeholder="Cari berdasarkan nama..."
                      value={namaFilter}
                      onChange={(e) => setNamaFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Provinsi
                    </label>
                    <Input
                      placeholder="Cari berdasarkan provinsi..."
                      value={provinsiFilter}
                      onChange={(e) => setProvinsiFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Kota
                    </label>
                    <Input
                      placeholder="Cari berdasarkan kota..."
                      value={kotaFilter}
                      onChange={(e) => setKotaFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Kecamatan
                    </label>
                    <Input
                      placeholder="Cari berdasarkan kecamatan..."
                      value={kecamatanFilter}
                      onChange={(e) => setKecamatanFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Status and Jabatan Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Jabatan
                    </label>
                    <select
                      value={selectedJabatan}
                      onChange={(e) => setSelectedJabatan(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Semua Jabatan</option>
                      <option value="Koordinator">Koordinator</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Surveyor">Surveyor</option>
                      <option value="Admin TPS">Admin TPS</option>
                      <option value="Petugas Lapangan">Petugas Lapangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Semua Status</option>
                      <option value="AKTIF">Aktif</option>
                      <option value="TIDAK_AKTIF">Tidak Aktif</option>
                      <option value="SUSPEND">Suspend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Items per Halaman
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value={25}>25 per halaman</option>
                      <option value={50}>50 per halaman</option>
                      <option value={100}>100 per halaman</option>
                      <option value={1000}>1000 per halaman</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {pegawaiList.length} dari {totalElements} pegawai terlokasi
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleResetFilters}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Reset Filter
                    </Button>
                    <Button
                      onClick={handleApplyFilters}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Cari
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Filter Button when filters are hidden */}
          {!showFilters && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Tampilkan Filter
              </Button>
            </div>
          )}

          {/* Map */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Peta Lokasi Pegawai</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <Skeleton className="h-[600px] w-full" />
                    <p className="mt-4 text-muted-foreground">Memuat peta...</p>
                  </div>
                </div>
              ) : (
                <PegawaiMap
                  locations={allPegawaiLocations as any}
                  center={mapCenter}
                  zoom={mapZoom}
                  onPegawaiClick={handlePegawaiClick}
                />
              )}
            </CardContent>
          </Card>

          {/* Pegawai Locations Table */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                      <TableHead className="w-[200px]">
                        <SortableHeader
                          sortKey="namaLengkap"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Informasi Pegawai
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <SortableHeader
                          sortKey="jabatan"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Jabatan
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[250px]">
                        <SortableHeader
                          sortKey="provinsi"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Lokasi Lengkap
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-[120px]">Koordinat</TableHead>
                      <TableHead className="w-[100px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : pegawaiList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <MapPin className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Tidak ada pegawai dengan data lokasi yang ditemukan
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pegawaiList.map((pegawai) => (
                        <TableRow key={pegawai.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                                {(pegawai.photoUrl || pegawai.fotoKaryawan) ? (
                                  <img 
                                    src={
                                      (pegawai.photoUrl || pegawai.fotoKaryawan)?.startsWith('http') 
                                        ? (pegawai.photoUrl || pegawai.fotoKaryawan)
                                        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/upload/photos/${pegawai.photoUrl || pegawai.fotoKaryawan}`
                                    }
                                    alt={`Foto ${pegawai.namaLengkap || pegawai.fullName}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      const name = pegawai.namaLengkap || pegawai.fullName || '';
                                      if (parent && name && name.length > 0) {
                                        parent.innerHTML = `<span class="text-lg">${name.charAt(0).toUpperCase()}</span>`;
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-lg">
                                    {(pegawai.namaLengkap && pegawai.namaLengkap.length > 0) ? pegawai.namaLengkap.charAt(0).toUpperCase() : 
                                     (pegawai.fullName && pegawai.fullName.length > 0) ? pegawai.fullName.charAt(0).toUpperCase() : '?'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{pegawai.namaLengkap || pegawai.fullName || 'Nama tidak tersedia'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{pegawai.nip || 'NIP tidak tersedia'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 font-medium">
                              <Shield className="h-3 w-3 mr-1" />
                              {pegawai.jabatan?.nama || 'Tidak ada jabatan'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              className={
                                (pegawai.isActive || pegawai.status === 'AKTIF')
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                              }
                            >
                              {(pegawai.isActive || pegawai.status === 'AKTIF') ? '� AKTIF' : '� TIDAK AKTIF'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1 text-sm">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {pegawai.kotaNama || pegawai.kota}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {pegawai.kecamatanNama || pegawai.kecamatan}
                              </div>
                              <div className="text-gray-500 dark:text-gray-500">
                                {pegawai.kelurahanNama || pegawai.kelurahan}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                {pegawai.provinsiNama || pegawai.provinsi}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-xs space-y-1">
                              <div className="font-mono text-gray-700 dark:text-gray-300">
                                {pegawai.latitude?.toFixed(6) || 'N/A'}
                              </div>
                              <div className="font-mono text-gray-700 dark:text-gray-300">
                                {pegawai.longitude?.toFixed(6) || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/master-data/pegawai/${pegawai.id}`)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <ServerPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
