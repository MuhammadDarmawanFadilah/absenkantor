import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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

const EDUCATION_OPTIONS = [
  { value: 'SD', label: 'Sekolah Dasar' },
  { value: 'SMP', label: 'Sekolah Menengah Pertama' },
  { value: 'SMA', label: 'Sekolah Menengah Atas' },
  { value: 'SMK', label: 'Sekolah Menengah Kejuruan' },
  { value: 'D3', label: 'Diploma 3' },
  { value: 'D4', label: 'Diploma 4' },
  { value: 'S1', label: 'Sarjana' },
  { value: 'S2', label: 'Magister' },
  { value: 'S3', label: 'Doktor' },
];

interface EducationSearchDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EducationSearchDropdown({
  value,
  onValueChange,
  placeholder = "Pilih pendidikan...",
  disabled = false,
  className
}: EducationSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedEducation = EDUCATION_OPTIONS.find(option => option.value === value);

  const filteredOptions = EDUCATION_OPTIONS.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    option.value.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between h-12", className)}
          disabled={disabled}
        >
          {selectedEducation ? (
            <span className="truncate">{selectedEducation.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Cari pendidikan..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>Tidak ada pendidikan ditemukan.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
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
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-sm">{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
