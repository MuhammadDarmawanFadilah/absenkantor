'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/config';
import JenisCutiForm from '@/components/jenis-cuti/JenisCutiForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface JenisCuti {
  id: number;
  namaCuti: string;
  deskripsi?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DaftarCutiPage = () => {
  const [jenisCutiList, setJenisCutiList] = useState<JenisCuti[]>([]);
  const [filteredData, setFilteredData] = useState<JenisCuti[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJenisCuti = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Token tidak ditemukan');
        return;
      }

      const response = await fetch(getApiUrl('jenis-cuti?page=0&size=100'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', errorText);
        throw new Error('Gagal mengambil data');
      }

      const data = await response.json();
      console.log('Fetched jenis cuti data:', data);
      
      // Handle paginated response
      const dataArray = data.content ? data.content : (Array.isArray(data) ? data : []);
      console.log('Data array:', dataArray);
      setJenisCutiList(dataArray);
      setFilteredData(dataArray);
    } catch (error) {
      console.error('Fetch jenis cuti error:', error);
      toast.error('Gagal memuat data jenis cuti');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJenisCuti();
  }, []);

  useEffect(() => {
    if (!Array.isArray(jenisCutiList)) {
      console.log('jenisCutiList is not an array:', jenisCutiList);
      return;
    }
    
    const filtered = jenisCutiList.filter(item =>
      item.namaCuti?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
    setFilteredData(filtered);
  }, [searchTerm, jenisCutiList]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Token tidak ditemukan');
        return;
      }

      setIsLoading(true);
      const response = await fetch(getApiUrl(`jenis-cuti/${id}/toggle-status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Toggle status error:', errorData);
        throw new Error('Gagal mengubah status');
      }

      toast.success(
        currentStatus 
          ? 'Jenis cuti berhasil dinonaktifkan' 
          : 'Jenis cuti berhasil diaktifkan'
      );
      await fetchJenisCuti(); // Add await to ensure refresh completes
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Gagal mengubah status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Token tidak ditemukan');
        return;
      }

      setIsLoading(true);
      const response = await fetch(getApiUrl(`jenis-cuti/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete error:', errorData);
        throw new Error('Gagal menghapus data');
      }

      toast.success('Jenis cuti berhasil dihapus dan disembunyikan dari sistem');
      await fetchJenisCuti(); // Add await to ensure refresh completes
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus jenis cuti');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daftar Cuti</h1>
        <p className="text-muted-foreground">
          Kelola jenis-jenis cuti yang tersedia dalam sistem
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Jenis Cuti</CardTitle>
            <JenisCutiForm onSuccess={fetchJenisCuti} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari jenis cuti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Jenis</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Diupdate</TableHead>
                  <TableHead className="w-[70px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(filteredData) || filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchTerm ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada jenis cuti'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.namaCuti}
                      </TableCell>
                      <TableCell>
                        {item.deskripsi || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? '✅ Aktif' : '❌ Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <JenisCutiForm
                              jenisCuti={item}
                              onSuccess={fetchJenisCuti}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(item.id, item.isActive)}
                            >
                              {item.isActive ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  Aktifkan
                                </>
                              )}
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus jenis cuti "{item.namaCuti}"? 
                                    Data akan disembunyikan dari sistem tetapi tetap tersimpan untuk keperluan historis.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(item.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Total: {Array.isArray(filteredData) ? filteredData.length : 0} jenis cuti
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DaftarCutiPage;
