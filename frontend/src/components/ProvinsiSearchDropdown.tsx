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

interface WilayahProvinsi {
  kode: string;
  nama: string;
}

interface ProvinsiSearchDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onProvinsiKodeChange?: (kode: string) => void; // Add this prop
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProvinsiSearchDropdown({
  value,
  onValueChange,
  onProvinsiKodeChange,
  placeholder = "Pilih provinsi...",
  disabled = false,
  className
}: ProvinsiSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [provinsiList, setProvinsiList] = useState<WilayahProvinsi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProvinsi();
  }, []);

  const loadProvinsi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi?page=0&size=1000&sortBy=nama&sortDir=asc`);
      if (response.ok) {
        const result = await response.json();
        setProvinsiList(result.content || []);
      } else {
        setError('Gagal memuat data provinsi');
      }
    } catch (error) {
      console.error('Error loading provinsi:', error);
      setError('Gagal memuat data provinsi');
    } finally {
      setLoading(false);
    }
  };

  const filteredProvinsi = provinsiList.filter(provinsi =>
    provinsi.nama.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedProvinsi = provinsiList.find(provinsi => provinsi.nama === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10 px-3 py-2 text-sm border border-gray-300 bg-white hover:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500", className)}
          disabled={disabled || loading}
        >
          {selectedProvinsi ? (
            <span className="truncate">{selectedProvinsi.nama}</span>
          ) : (
            <span className="text-muted-foreground">
              {loading ? "Memuat provinsi..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Cari provinsi..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {loading ? "Memuat data..." : "Tidak ada provinsi ditemukan."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredProvinsi.map((provinsi) => (
              <CommandItem
                key={provinsi.kode}
                value={provinsi.nama}
                onSelect={(currentValue) => {
                  const selectedProvinsi = provinsiList.find(p => p.nama === currentValue);
                  onValueChange(currentValue === value ? "" : currentValue);
                  if (onProvinsiKodeChange && selectedProvinsi) {
                    onProvinsiKodeChange(currentValue === value ? "" : selectedProvinsi.kode);
                  }
                  setOpen(false);
                  setSearchValue('');
                }}
                className="flex items-center gap-2 p-3"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === provinsi.nama ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-sm">{provinsi.nama}</span>
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
