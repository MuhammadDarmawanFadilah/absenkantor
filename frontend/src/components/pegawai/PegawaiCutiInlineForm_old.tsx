import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
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
  }))
});

type PegawaiCutiFormValues = z.infer<typeof pegawaiCutiSchema>;

interface PegawaiCutiInlineFormProps {
  cutiList: PegawaiCuti[];
  onChange: (cutiList: PegawaiCuti[]) => void;
}

const PegawaiCutiInlineForm: FC<PegawaiCutiInlineFormProps> = ({ 
  cutiList,
  onChange
}) => {
  const [jenisCutiOptions, setJenisCutiOptions] = useState<JenisCuti[]>([]);
  const [jenisCutiOpen, setJenisCutiOpen] = useState<boolean[]>([]);
  const isUpdatingFromParent = useRef(false);
  const [isFormReady, setIsFormReady] = useState(false);

  const form = useForm<PegawaiCutiFormValues>({
    resolver: zodResolver(pegawaiCutiSchema),
    defaultValues: {
      cutiList: cutiList.length > 0 
        ? cutiList 
        : [{ jenisCutiId: 0, tahun: new Date().getFullYear(), jumlahHari: 12 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'cutiList'
  });

  // Update form when cutiList prop changes, but avoid infinite loops
  useEffect(() => {
    if (cutiList && cutiList.length > 0 && !isUpdatingFromParent.current) {
      isUpdatingFromParent.current = true;
      form.reset({
        cutiList: cutiList
      });
      // Reset the flag after form updates
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 100);
    }
  }, [cutiList, form]);

  // Initialize with default item if no fields exist
  useEffect(() => {
    if (fields.length === 0 && isFormReady) {
      append({ 
        jenisCutiId: 0, 
        tahun: new Date().getFullYear(), 
        jumlahHari: 12 
      });
    }
  }, [fields.length, append, isFormReady]);

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

  useEffect(() => {
    fetchJenisCuti();
    setIsFormReady(true);
  }, []);

  useEffect(() => {
    setJenisCutiOpen(new Array(fields.length).fill(false));
  }, [fields.length]);

  // Memoize the onChange callback to prevent unnecessary re-renders
  const handleFormChange = useCallback((value: any) => {
    console.log('Form change detected:', value);
    console.log('isUpdatingFromParent:', isUpdatingFromParent.current);
    // Only update if we're not currently updating from parent
    if (!isUpdatingFromParent.current && value.cutiList) {
      const filteredCutiList = value.cutiList.filter((item: any) => 
        item && item.jenisCutiId && item.jenisCutiId > 0
      ) as PegawaiCuti[];
      console.log('Sending filtered cuti list to parent:', filteredCutiList);
      onChange(filteredCutiList);
    }
  }, [onChange]);

  // Watch form changes and notify parent
  useEffect(() => {
    const subscription = form.watch(handleFormChange);
    return () => subscription.unsubscribe();
  }, [form, handleFormChange]);

  const addCutiItem = useCallback(() => {
    console.log('Adding new cuti item...');
    console.log('Current fields before append:', fields.length);
    append({ 
      jenisCutiId: 0, 
      tahun: new Date().getFullYear(), 
      jumlahHari: 12 
    });
    console.log('Append called successfully');
  }, [append, fields.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Konfigurasi Jenis Cuti</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCutiItem}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Jenis Cuti
        </Button>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-gray-50 dark:bg-gray-900">
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
      </Form>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Belum ada jenis cuti dikonfigurasi</p>
          <Button
            type="button"
            variant="outline"
            onClick={addCutiItem}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jenis Cuti Pertama
          </Button>
        </div>
      )}
    </div>
  );
};

export default PegawaiCutiInlineForm;
