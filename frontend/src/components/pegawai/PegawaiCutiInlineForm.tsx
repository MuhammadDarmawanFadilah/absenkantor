import { FC, useState, useEffect, useCallback } from 'react';
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
  const [localCutiList, setLocalCutiList] = useState<PegawaiCuti[]>([]);

  // Initialize local state
  useEffect(() => {
    if (cutiList && cutiList.length > 0) {
      setLocalCutiList(cutiList);
    } else {
      // Start with one empty item
      setLocalCutiList([{ 
        jenisCutiId: 0, 
        tahun: new Date().getFullYear(), 
        jumlahHari: 12 
      }]);
    }
  }, []);

  // Update popover states when list changes
  useEffect(() => {
    setJenisCutiOpen(new Array(localCutiList.length).fill(false));
  }, [localCutiList.length]);

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
  }, []);

  // Update parent when local state changes
  const notifyParent = useCallback((newList: PegawaiCuti[]) => {
    const validList = newList.filter(item => item.jenisCutiId > 0);
    console.log('Notifying parent with valid list:', validList);
    onChange(validList);
  }, [onChange]);

  const addCutiItem = () => {
    console.log('Adding new cuti item...');
    const newItem = { 
      jenisCutiId: 0, 
      tahun: new Date().getFullYear(), 
      jumlahHari: 12 
    };
    const newList = [...localCutiList, newItem];
    setLocalCutiList(newList);
    console.log('New cuti item added. List length:', newList.length);
  };

  const removeCutiItem = (index: number) => {
    const newList = localCutiList.filter((_, i) => i !== index);
    setLocalCutiList(newList);
    notifyParent(newList);
  };

  const updateCutiItem = (index: number, field: keyof PegawaiCuti, value: any) => {
    const newList = [...localCutiList];
    newList[index] = { ...newList[index], [field]: value };
    setLocalCutiList(newList);
    notifyParent(newList);
  };

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

      <div className="space-y-4">
        {localCutiList.map((cutiItem, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Cuti #{index + 1}</h4>
              {localCutiList.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCutiItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Jenis Cuti */}
              <div className="space-y-2">
                <Label>Jenis Cuti</Label>
                <Popover 
                  open={jenisCutiOpen[index] || false} 
                  onOpenChange={(open) => {
                    const newStates = [...jenisCutiOpen];
                    newStates[index] = open;
                    setJenisCutiOpen(newStates);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={jenisCutiOpen[index] || false}
                      className="w-full justify-between"
                    >
                      {cutiItem.jenisCutiId > 0
                        ? jenisCutiOptions.find((jenis) => jenis.id === cutiItem.jenisCutiId)?.namaCuti
                        : "Pilih jenis cuti"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
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
                                updateCutiItem(index, 'jenisCutiId', jenis.id);
                                const newStates = [...jenisCutiOpen];
                                newStates[index] = false;
                                setJenisCutiOpen(newStates);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  cutiItem.jenisCutiId === jenis.id ? "opacity-100" : "opacity-0"
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
              </div>
              
              {/* Tahun */}
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input
                  type="number"
                  min="2020"
                  max="2030"
                  value={cutiItem.tahun}
                  onChange={(e) => updateCutiItem(index, 'tahun', parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
              
              {/* Jumlah Hari */}
              <div className="space-y-2">
                <Label>Jumlah Hari</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={cutiItem.jumlahHari}
                  onChange={(e) => updateCutiItem(index, 'jumlahHari', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {localCutiList.length === 0 && (
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
