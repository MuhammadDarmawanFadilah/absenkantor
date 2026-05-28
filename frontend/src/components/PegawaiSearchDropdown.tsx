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

interface PegawaiDTO {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  nip?: string;
  jabatan?: string;
  namaJabatan?: string;
  status: string;
}

interface PegawaiSearchDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onPegawaiIdChange?: (pegawaiId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
}

export function PegawaiSearchDropdown({
  value,
  onValueChange,
  onPegawaiIdChange,
  placeholder = "Pilih pegawai...",
  disabled = false,
  className,
  includeAllOption = true
}: PegawaiSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [pegawaiList, setPegawaiList] = useState<PegawaiDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPegawai();
  }, []);

  const loadPegawai = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl('/pegawai')}/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPegawaiList(data || []);
      } else {
        setError('Gagal memuat data pegawai');
      }
    } catch (error) {
      console.error('Error loading pegawai:', error);
      setError('Gagal memuat data pegawai');
    } finally {
      setLoading(false);
    }
  };

  const filteredPegawai = pegawaiList.filter(pegawai => {
    const searchLower = searchValue.toLowerCase();
    return (
      pegawai.fullName.toLowerCase().includes(searchLower) ||
      (pegawai.nip && pegawai.nip.toLowerCase().includes(searchLower)) ||
      (pegawai.email && pegawai.email.toLowerCase().includes(searchLower)) ||
      (pegawai.jabatan && pegawai.jabatan.toLowerCase().includes(searchLower))
    );
  });

  const selectedPegawai = pegawaiList.find(pegawai => pegawai.fullName === value);
  const isAllSelected = value === "all";

  const formatPegawaiDisplay = (pegawai: PegawaiDTO) => {
    return pegawai.nip ? `${pegawai.fullName} (${pegawai.nip})` : pegawai.fullName;
  };

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
          {isAllSelected ? (
            <span className="truncate">👥 Semua Pegawai</span>
          ) : selectedPegawai ? (
            <span className="truncate">{formatPegawaiDisplay(selectedPegawai)}</span>
          ) : (
            <span className="text-muted-foreground">
              {loading ? "Memuat pegawai..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Cari pegawai..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {loading ? "Memuat data..." : "Tidak ada pegawai ditemukan."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {includeAllOption && (
              <CommandItem
                key="all"
                value="all"
                onSelect={() => {
                  onValueChange("all");
                  if (onPegawaiIdChange) {
                    onPegawaiIdChange("all");
                  }
                  setOpen(false);
                  setSearchValue('');
                }}
                className="flex items-center gap-2 p-3"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isAllSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-sm">👥 Semua Pegawai</span>
              </CommandItem>
            )}
            {filteredPegawai.map((pegawai) => (
              <CommandItem
                key={pegawai.id}
                value={pegawai.fullName}
                onSelect={(currentValue) => {
                  const selectedPegawai = pegawaiList.find(p => p.fullName === currentValue);
                  onValueChange(currentValue === value ? "" : currentValue);
                  if (onPegawaiIdChange && selectedPegawai) {
                    onPegawaiIdChange(currentValue === value ? "" : selectedPegawai.id.toString());
                  }
                  setOpen(false);
                  setSearchValue('');
                }}
                className="flex items-center gap-2 p-3"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === pegawai.fullName ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{pegawai.fullName}</span>
                  <div className="flex gap-2 text-xs text-gray-500">
                    {pegawai.nip && <span>NIP: {pegawai.nip}</span>}
                    {pegawai.jabatan && <span>• {pegawai.jabatan}</span>}
                  </div>
                </div>
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
