import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { getApiUrl } from '@/lib/config';

interface WilayahKota {
  kode: string;
  nama: string;
  provinsiKode: string;
  provinsiNama: string;
}

interface KotaSearchDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  provinsiFilter?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKotaKodeChange?: (kode: string) => void; // Add this to pass kode to parent
}

export function KotaSearchDropdown({
  value,
  onValueChange,
  provinsiFilter,
  placeholder = "Pilih kota/kabupaten...",
  disabled = false,
  className,
  onKotaKodeChange
}: KotaSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [kotaList, setKotaList] = useState<WilayahKota[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provinsiKode, setProvinsiKode] = useState<string>('');

  // Get provinsi kode when provinsiFilter changes
  useEffect(() => {
    if (provinsiFilter) {
      getProvinsiKode(provinsiFilter);
    } else {
      setKotaList([]);
      setProvinsiKode('');
    }
  }, [provinsiFilter]);

  // Load kota when provinsiKode changes
  useEffect(() => {
    if (provinsiKode) {
      loadKota();
    }
  }, [provinsiKode]);

  const getProvinsiKode = async (provinsiNama: string) => {
    try {
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi?page=0&size=1000&search=${encodeURIComponent(provinsiNama)}`);
      if (response.ok) {
        const result = await response.json();
        const provinsi = result.content?.find((p: any) => p.nama === provinsiNama);
        if (provinsi) {
          setProvinsiKode(provinsi.kode);
        }
      }
    } catch (error) {
      console.error('Error getting provinsi kode:', error);
    }
  };

  const loadKota = async () => {
    if (!provinsiKode) return;
    
    setLoading(true);
    setError(null);
    try {
      const url = `${getApiUrl('/admin/wilayah')}/kota?page=0&size=1000&sortBy=nama&sortDir=asc&provinsiKode=${encodeURIComponent(provinsiKode)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setKotaList(result.content || []);
      } else {
        setError('Gagal memuat data kota/kabupaten');
      }
    } catch (error) {
      console.error('Error loading kota:', error);
      setError('Gagal memuat data kota/kabupaten');
    } finally {
      setLoading(false);
    }
  };

  const filteredKota = kotaList.filter(kota =>
    kota.nama.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedKota = kotaList.find(kota => kota.nama === value);
  const isDisabledState = disabled || !provinsiFilter;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10 px-3 py-2 text-sm border border-gray-300 bg-white hover:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500", className)}
          disabled={isDisabledState || loading}
        >
          {selectedKota ? (
            <span className="truncate">{selectedKota.nama}</span>
          ) : (
            <span className="text-muted-foreground">
              {!provinsiFilter ? "Pilih provinsi terlebih dahulu" : 
               loading ? "Memuat kota/kabupaten..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Cari kota/kabupaten..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {loading ? "Memuat data..." : 
             !provinsiFilter ? "Pilih provinsi terlebih dahulu" :
             "Tidak ada kota/kabupaten ditemukan."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredKota.map((kota) => (
              <CommandItem
                key={kota.kode}
                value={kota.nama}
                onSelect={(currentValue) => {
                  const selectedKota = kotaList.find(k => k.nama === currentValue);
                  onValueChange(currentValue === value ? "" : currentValue);
                  if (onKotaKodeChange && selectedKota) {
                    onKotaKodeChange(currentValue === value ? "" : selectedKota.kode);
                  }
                  setOpen(false);
                  setSearchValue('');
                }}
                className="flex items-center gap-2 p-3"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === kota.nama ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-sm">{kota.nama}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
        {error && (
          <div className="p-3 text-sm text-destructive border-t">
            {error}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
