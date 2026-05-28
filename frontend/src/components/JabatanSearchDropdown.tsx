import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Briefcase } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useJabatan, type Jabatan } from '@/hooks/useJabatan';

interface JabatanSearchDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function JabatanSearchDropdown({
  value,
  onValueChange,
  placeholder = "Pilih jabatan...",
  disabled = false,
  className
}: JabatanSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { jabatanList, loading, error, searchJabatan } = useJabatan();
  const [filteredJabatan, setFilteredJabatan] = useState<Jabatan[]>([]);

  // Filter jabatan berdasarkan search value
  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = jabatanList.filter(jabatan =>
        jabatan.isActive && (
          jabatan.nama.toLowerCase().includes(searchValue.toLowerCase()) ||
          (jabatan.deskripsi && jabatan.deskripsi.toLowerCase().includes(searchValue.toLowerCase()))
        )
      );
      setFilteredJabatan(filtered);
    } else {
      // Show only active jabatan when no search
      setFilteredJabatan(jabatanList.filter(jabatan => jabatan.isActive));
    }
  }, [searchValue, jabatanList]);

  const selectedJabatan = jabatanList.find(jabatan => jabatan.nama === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between h-12", className)}
          disabled={disabled || loading}
        >
          {selectedJabatan ? (
            <span className="truncate">{selectedJabatan.nama}</span>
          ) : (
            <span className="text-muted-foreground">
              {loading ? "Memuat jabatan..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Cari jabatan..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {loading ? "Memuat data..." : "Tidak ada jabatan ditemukan."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredJabatan.map((jabatan) => (
              <CommandItem
                key={jabatan.id}
                value={jabatan.nama}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                  setSearchValue('');
                }}
                className="flex items-center gap-2 p-3"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === jabatan.nama ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">{jabatan.nama}</span>
                  {jabatan.deskripsi && (
                    <span className="text-xs text-muted-foreground">
                      {jabatan.deskripsi}
                    </span>
                  )}
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
