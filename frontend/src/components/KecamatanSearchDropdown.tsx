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

interface WilayahKecamatan {
  kode: string;
  nama: string;
  kotaKode: string;
  kotaNama: string;
  provinsiNama: string;
}

interface KecamatanSearchDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onKecamatanKodeChange?: (kode: string) => void; // Add this prop
  kotaKode?: string; // Changed from kotaFilter to kotaKode
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function KecamatanSearchDropdown({
  value,
  onValueChange,
  onKecamatanKodeChange,
  kotaKode,
  placeholder = "Pilih kecamatan...",
  disabled = false,
  className
}: KecamatanSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [kecamatanList, setKecamatanList] = useState<WilayahKecamatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (kotaKode) {
      loadKecamatan();
    } else {
      setKecamatanList([]);
    }
  }, [kotaKode]);

  const loadKecamatan = async () => {
    if (!kotaKode) return;
    
    setLoading(true);
    setError(null);
    try {
      const url = `${getApiUrl('/admin/wilayah')}/kecamatan?page=0&size=1000&sortBy=nama&sortDir=asc&kotaKode=${encodeURIComponent(kotaKode)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setKecamatanList(result.content || []);
      } else {
        setError('Gagal memuat data kecamatan');
      }
    } catch (error) {
      console.error('Error loading kecamatan:', error);
      setError('Gagal memuat data kecamatan');
    } finally {
      setLoading(false);
    }
  };

  const filteredKecamatan = kecamatanList.filter(kecamatan =>
    kecamatan.nama.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedKecamatan = kecamatanList.find(kecamatan => kecamatan.nama === value);
  const isDisabledState = disabled || !kotaKode;

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
          {selectedKecamatan ? (
            <span className="truncate">{selectedKecamatan.nama}</span>
          ) : (
            <span className="text-muted-foreground">
              {!kotaKode ? "Pilih kota/kabupaten terlebih dahulu" : 
               loading ? "Memuat kecamatan..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Cari kecamatan..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {loading ? "Memuat data..." : 
             !kotaKode ? "Pilih kota/kabupaten terlebih dahulu" :
             "Tidak ada kecamatan ditemukan."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredKecamatan.map((kecamatan) => (
              <CommandItem
                key={kecamatan.kode}
                value={kecamatan.nama}
                onSelect={(currentValue) => {
                  const selectedKecamatan = kecamatanList.find(k => k.nama === currentValue);
                  onValueChange(currentValue === value ? "" : currentValue);
                  if (onKecamatanKodeChange && selectedKecamatan) {
                    onKecamatanKodeChange(currentValue === value ? "" : selectedKecamatan.kode);
                  }
                  setOpen(false);
                  setSearchValue('');
                }}
                className="flex items-center gap-2 p-3"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === kecamatan.nama ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-sm">{kecamatan.nama}</span>
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
