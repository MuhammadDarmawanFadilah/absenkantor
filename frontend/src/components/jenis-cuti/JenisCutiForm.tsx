import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/config';

interface JenisCuti {
  id: number;
  namaCuti: string;
  deskripsi?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const jenisCutiSchema = z.object({
  namaCuti: z.string().min(1, 'Nama jenis cuti wajib diisi'),
  deskripsi: z.string().optional(),
  isActive: z.boolean()
});

type JenisCutiFormValues = z.infer<typeof jenisCutiSchema>;

interface JenisCutiFormProps {
  jenisCuti?: JenisCuti | null;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const JenisCutiForm: FC<JenisCutiFormProps> = ({ jenisCuti, onSuccess, trigger }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JenisCutiFormValues>({
    resolver: zodResolver(jenisCutiSchema),
    defaultValues: {
      namaCuti: jenisCuti?.namaCuti || '',
      deskripsi: jenisCuti?.deskripsi || '',
      isActive: jenisCuti?.isActive ?? true
    }
  });

  const onSubmit = async (values: JenisCutiFormValues) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Token tidak ditemukan');
        return;
      }

      const url = jenisCuti 
        ? getApiUrl(`jenis-cuti/${jenisCuti.id}`)
        : getApiUrl('jenis-cuti');
      
      const method = jenisCuti ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan data');
      }

      toast.success(jenisCuti ? 'Jenis cuti berhasil diupdate' : 'Jenis cuti berhasil ditambahkan');
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jenis Cuti
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {jenisCuti ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="namaCuti"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Jenis Cuti</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Cuti Tahunan"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Keterangan tambahan (opsional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Aktif</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Jenis cuti ini dapat digunakan
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : (jenisCuti ? 'Update' : 'Simpan')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default JenisCutiForm;
