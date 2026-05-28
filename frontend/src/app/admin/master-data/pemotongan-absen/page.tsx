"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Percent, Save, X, RotateCcw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getApiUrl } from '@/lib/config';
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PemotonganAbsen {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string;
  persentase: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PemotonganAbsenFormData {
  nama: string;
  deskripsi: string;
  persentase: string;
}

const PemotonganAbsenPage = () => {
  const [pemotonganAbsens, setPemotonganAbsens] = useState<PemotonganAbsen[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<PemotonganAbsenFormData>({
    nama: '',
    deskripsi: '',
    persentase: ''
  });

  const fetchPemotonganAbsens = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('pemotongan-absen'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Gagal mengambil data pemotongan absen');

      const result = await response.json();
      setPemotonganAbsens(result.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      deskripsi: '',
      persentase: ''
    });
    setEditingId(null);
  };

  const handleEdit = (pemotonganAbsen: PemotonganAbsen) => {
    setFormData({
      nama: pemotonganAbsen.nama,
      deskripsi: pemotonganAbsen.deskripsi,
      persentase: pemotonganAbsen.persentase.toString()
    });
    setEditingId(pemotonganAbsen.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi frontend
    if (!formData.nama || formData.nama.length < 5) {
      toast.error('Nama minimal 5 karakter');
      return;
    }
    
    if (!formData.deskripsi || formData.deskripsi.length < 10) {
      toast.error('Deskripsi minimal 10 karakter');
      return;
    }
    
    const persentase = parseFloat(formData.persentase);
    if (isNaN(persentase) || persentase < 0 || persentase > 100) {
      toast.error('Persentase harus antara 0% - 100%');
      return;
    }
    
    setLoading(true);

    try {
      const requestData = {
        nama: formData.nama,
        deskripsi: formData.deskripsi,
        persentase: parseFloat(formData.persentase)
      };

      const response = await fetch(getApiUrl(`pemotongan-absen/${editingId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      setShowForm(false);
      resetForm();
      fetchPemotonganAbsens();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('pemotongan-absen/reset-to-default'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      setShowResetDialog(false);
      fetchPemotonganAbsens();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPemotonganAbsens();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Data Pemotongan Absen</h1>
          <p className="text-muted-foreground">Kelola pengaturan pemotongan gaji berdasarkan absensi</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
          disabled={loading}
        >
          <RotateCcw className="h-4 w-4" />
          Reset ke Default
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Setting Pemotongan Absen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Persentase</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : pemotonganAbsens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Tidak ada data pemotongan absen
                    </TableCell>
                  </TableRow>
                ) : (
                  pemotonganAbsens.map((pemotonganAbsen) => (
                    <TableRow key={pemotonganAbsen.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {pemotonganAbsen.kode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {pemotonganAbsen.nama}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={pemotonganAbsen.deskripsi}>
                        {pemotonganAbsen.deskripsi}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Percent className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-blue-600">
                            {pemotonganAbsen.persentase}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={pemotonganAbsen.isActive ? "default" : "secondary"}
                          className={pemotonganAbsen.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {pemotonganAbsen.isActive ? "✅ Aktif" : "❌ Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pemotonganAbsen)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Edit Setting Pemotongan Absen
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Setting *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama setting (minimal 5 karakter)"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.nama.length}/100 karakter (min: 5)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi *</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi (minimal 10 karakter)"
                  rows={3}
                  className="resize-none"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.deskripsi.length}/200 karakter (min: 10)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="persentase">Persentase Pemotongan *</Label>
                <div className="relative">
                  <Input
                    id="persentase"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.persentase}
                    onChange={(e) => setFormData({ ...formData, persentase: e.target.value })}
                    placeholder="0.00"
                    className="pr-8"
                    required
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">
                  Masukkan persentase antara 0% - 100%
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <AlertDialogTitle>Reset ke Pengaturan Default</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                  Apakah Anda yakin ingin mereset semua data pemotongan absen ke pengaturan default? 
                  Semua perubahan yang telah dibuat akan hilang dan tidak dapat dikembalikan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Data Default yang akan diterapkan:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>• Terlambat Masuk 1-30 menit: 0%</div>
              <div>• Terlambat Masuk 31-60 menit: 0.5%</div>
              <div>• Terlambat Masuk 61-90 menit: 1.25%</div>
              <div>• Terlambat Masuk {'>'}90 menit: 2.5%</div>
              <div>• Pulang Cepat 1-30 menit: 0.5%</div>
              <div>• Pulang Cepat 31-60 menit: 1.25%</div>
              <div>• Pulang Cepat {'>'}61 menit: 2.5%</div>
              <div>• Lupa Absen Masuk: 2.5%</div>
              <div>• Lupa Absen Pulang: 2.5%</div>
              <div>• Tidak Absen: 5%</div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetToDefault}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Mereset...' : 'Ya, Reset ke Default'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PemotonganAbsenPage;
