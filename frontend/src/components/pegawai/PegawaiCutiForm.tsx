import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

interface JenisCuti {
  id: number;
  namaCuti: string;
  deskripsi?: string;
  isActive: boolean;
}

interface PegawaiCuti {
  jenisCutiId: number;
  tahun: number;
  jumlahHari: number;
}

const pegawaiCutiSchema = z.object({
  cutiList: z.array(z.object({
    jenisCutiId: z.number().min(1, 'Jenis cuti harus dipilih'),
    tahun: z.number().min(2020, 'Tahun minimal 2020').max(2030, 'Tahun maksimal 2030'),
    jumlahHari: z.number().min(1, 'Jumlah hari minimal 1').max(365, 'Jumlah hari maksimal 365')
  })).min(1, 'Minimal satu jenis cuti harus diisi')
});

type PegawaiCutiFormValues = z.infer<typeof pegawaiCutiSchema>;

interface PegawaiCutiFormProps {
  pegawaiId: number;
  currentCutiList?: PegawaiCuti[];
  onSuccess: (cutiList: PegawaiCuti[]) => void;
  trigger?: React.ReactNode;
}

const PegawaiCutiForm: FC<PegawaiCutiFormProps> = ({ 
  pegawaiId, 
  currentCutiList = [], 
  onSuccess, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jenisCutiOptions, setJenisCutiOptions] = useState<JenisCuti[]>([]);
  const [jenisCutiOpen, setJenisCutiOpen] = useState<boolean[]>([]);

  const form = useForm<PegawaiCutiFormValues>({
    resolver: zodResolver(pegawaiCutiSchema),
    defaultValues: {
      cutiList: currentCutiList.length > 0 
        ? currentCutiList 
        : [{ jenisCutiId: 0, tahun: new Date().getFullYear(), jumlahHari: 12 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'cutiList'
  });

  const fetchJenisCuti = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/jenis-cuti'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content && Array.isArray(data.content)) {
          setJenisCutiOptions(data.content.filter((item: JenisCuti) => item.isActive));
        } else if (Array.isArray(data)) {
          setJenisCutiOptions(data.filter((item: JenisCuti) => item.isActive));
        }
      }
    } catch (error) {
      console.error('Error fetching jenis cuti:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchJenisCuti();
      setJenisCutiOpen(new Array(fields.length).fill(false));
    }
  };

  useEffect(() => {
    setJenisCutiOpen(new Array(fields.length).fill(false));
  }, [fields.length]);

  const onSubmit = async (values: PegawaiCutiFormValues) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Token tidak ditemukan');
        return;
      }

      const requestData = values.cutiList.map(item => ({
        pegawaiId,
        jenisCutiId: item.jenisCutiId,
        tahun: item.tahun,
        jatahHari: item.jumlahHari
      }));

      const response = await fetch(getApiUrl(`api/pegawai-cuti/pegawai/${pegawaiId}/batch`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan data cuti pegawai');
      }

      toast.success('Data cuti pegawai berhasil disimpan');
      setOpen(false);
      form.reset();
      onSuccess(values.cutiList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const addCutiItem = () => {
    append({ 
      jenisCutiId: 0, 
      tahun: new Date().getFullYear(), 
      jumlahHari: 12 
    });
  };

  const getJenisCutiName = (id: number) => {
    const jenis = jenisCutiOptions.find(item => item.id === id);
    return jenis ? jenis.namaCuti : 'Pilih jenis cuti';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Kelola Cuti
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kelola Cuti Pegawai</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Cuti #{index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`cutiList.${index}.jenisCutiId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis Cuti</FormLabel>
                          <Popover 
                            open={jenisCutiOpen[index] || false} 
                            onOpenChange={(open) => {
                              const newStates = [...jenisCutiOpen];
                              newStates[index] = open;
                              setJenisCutiOpen(newStates);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={jenisCutiOpen[index] || false}
                                  className="w-full justify-between"
                                >
                                  {field.value
                                    ? jenisCutiOptions.find((jenis) => jenis.id === field.value)?.namaCuti
                                    : "Pilih jenis cuti"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Cari jenis cuti..." />
                                <CommandEmpty>Tidak ada jenis cuti ditemukan.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto">
                                  {jenisCutiOptions.length === 0 ? (
                                    <CommandItem disabled>Memuat data jenis cuti...</CommandItem>
                                  ) : (
                                    jenisCutiOptions.map((jenis) => (
                                      <CommandItem
                                        key={jenis.id}
                                        value={jenis.namaCuti}
                                        onSelect={() => {
                                          field.onChange(jenis.id);
                                          const newStates = [...jenisCutiOpen];
                                          newStates[index] = false;
                                          setJenisCutiOpen(newStates);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === jenis.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {jenis.namaCuti}
                                        {jenis.deskripsi && (
                                          <span className="ml-2 text-xs text-muted-foreground">
                                            - {jenis.deskripsi}
                                          </span>
                                        )}
                                      </CommandItem>
                                    ))
                                  )}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`cutiList.${index}.tahun`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="2020"
                              max="2030"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`cutiList.${index}.jumlahHari`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jumlah Hari</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={addCutiItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jenis Cuti
            </Button>
            
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
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PegawaiCutiForm;
