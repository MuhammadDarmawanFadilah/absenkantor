"use client";

import { useState, useEffect, useCallback } from "react";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WilayahCombobox } from "@/components/ui/wilayah-combobox";
import { 
  cachedWilayahAPI, 
  WilayahProvince, 
  WilayahRegency, 
  WilayahDistrict, 
  WilayahVillage,
  convertWilayahToComboboxOptions 
} from "@/lib/wilayah-api";
import { getKodeposByWilayah } from "@/lib/kodepos-api";
import { MapPin, Building, Home, Mail, Search } from "lucide-react";
import { toast } from "sonner";

interface WilayahFormProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  disabled?: boolean;
  onDataLoad?: () => void;
}

export default function WilayahForm({ control, setValue, watch, disabled = false, onDataLoad }: WilayahFormProps) {
  // State untuk data wilayah
  const [provinces, setProvinces] = useState<WilayahProvince[]>([]);
  const [regencies, setRegencies] = useState<WilayahRegency[]>([]);
  const [districts, setDistricts] = useState<WilayahDistrict[]>([]);
  const [villages, setVillages] = useState<WilayahVillage[]>([]);

  // State untuk loading
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // State untuk track lookup process
  const [isPerformingLookup, setIsPerformingLookup] = useState(false);
  const [lookupProgress, setLookupProgress] = useState("");

  // Watch form values
  const watchProvinsi = watch("provinsi");
  const watchKota = watch("kota");
  const watchKecamatan = watch("kecamatan");
  const watchKelurahan = watch("kelurahan");

  // Auto-fill postal code when villages are loaded and kelurahan is already selected
  useEffect(() => {
    const autoFillKodepos = async () => {
      if (watchKelurahan) {
        try {
          const kodepos = await getKodeposByWilayah(watchKelurahan);
          if (kodepos) {
            const currentKodePos = watch("kodePos");
            if (!currentKodePos || currentKodePos !== kodepos) {
              setValue("kodePos", kodepos);
            }
          }
        } catch (error) {
          console.error("Error auto-filling kodepos:", error);
        }
      }
    };

    autoFillKodepos();
  }, [watchKelurahan, setValue, watch]);

  // Load provinces saat component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // 🔥 SISTEM LOOKUP OTOMATIS YANG DIROMBAK ULANG
  useEffect(() => {
    const performCompleteLookup = async () => {
      if (provinces.length === 0) return;
      
      // Cek apakah ada data yang perlu di-lookup
      const needsRegencyLookup = watchProvinsi && regencies.length === 0;
      const needsDistrictLookup = watchKota && districts.length === 0;
      const needsVillageLookup = watchKecamatan && villages.length === 0;

      if (!needsRegencyLookup && !needsDistrictLookup && !needsVillageLookup) {
        return;
      }

      setIsPerformingLookup(true);

      try {
        // Step 1: Lookup regencies berdasarkan provinsi yang ada
        if (needsRegencyLookup) {
          setLookupProgress("Mencari kota/kabupaten...");
          await loadRegencies(watchProvinsi);
          
          // Wait sebentar agar state ter-update
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Step 2: Lookup districts berdasarkan kota yang ada
        if (needsDistrictLookup && watchKota) {
          setLookupProgress("Mencari kecamatan...");
          await loadDistricts(watchKota);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Step 3: Lookup villages berdasarkan kecamatan yang ada
        if (needsVillageLookup && watchKecamatan) {
          setLookupProgress("Mencari kelurahan/desa...");
          await loadVillages(watchKecamatan);
        }

        setLookupProgress("Selesai");
        
        onDataLoad?.();
      } catch (error) {
        console.error('❌ [LOOKUP] Error during complete lookup:', error);
        toast.error("Gagal memuat data wilayah. Silakan coba lagi.");
      } finally {
        setIsPerformingLookup(false);
        setLookupProgress("");
      }
    };

    // Debounce lookup agar tidak terlalu sering
    const timeoutId = setTimeout(performCompleteLookup, 500);
    return () => clearTimeout(timeoutId);
  }, [provinces.length, watchProvinsi, watchKota, watchKecamatan, regencies.length, districts.length, villages.length]);

  // Handle perubahan provinsi user
  const handleProvinsiChange = useCallback(async (value: string) => {
    // Reset all dependent fields
    setValue("kota", "");
    setValue("kecamatan", "");
    setValue("kelurahan", "");
    setValue("kodePos", "");
    
    // Clear dependent data
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    if (value) {
      await loadRegencies(value);
    }
  }, [setValue]);

  // Handle perubahan kota user
  const handleKotaChange = useCallback(async (value: string) => {
    // Reset dependent fields
    setValue("kecamatan", "");
    setValue("kelurahan", "");
    setValue("kodePos", "");
    
    // Clear dependent data
    setDistricts([]);
    setVillages([]);

    if (value) {
      await loadDistricts(value);
    }
  }, [setValue]);

  // Handle perubahan kecamatan user
  const handleKecamatanChange = useCallback(async (value: string) => {
    // Reset dependent fields
    setValue("kelurahan", "");
    setValue("kodePos", "");
    
    // Clear dependent data
    setVillages([]);

    if (value) {
      await loadVillages(value);
    }
  }, [setValue]);

  // Handle perubahan kelurahan user
  const handleKelurahanChange = useCallback(async (value: string) => {
    if (value) {
      try {
        // Ambil kode pos dari backend berdasarkan kode wilayah
        const kodepos = await getKodeposByWilayah(value);
        if (kodepos) {
          setValue("kodePos", kodepos);
        } else {
          setValue("kodePos", "");
        }
      } catch (error) {
        console.error("Error fetching kodepos:", error);
        setValue("kodePos", "");
      }
    } else {
      setValue("kodePos", "");
    }
  }, [setValue]);

  // Load provinces function
  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await cachedWilayahAPI.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error("❌ Error loading provinces:", error);
      toast.error("Gagal memuat data provinsi");
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Load regencies function
  const loadRegencies = async (provinceCode: string) => {
    setLoadingRegencies(true);
    try {
      const data = await cachedWilayahAPI.getRegencies(provinceCode);
      setRegencies(data);
    } catch (error) {
      console.error("❌ Error loading regencies:", error);
      toast.error("Gagal memuat data kota/kabupaten");
    } finally {
      setLoadingRegencies(false);
    }
  };

  // Load districts function  
  const loadDistricts = async (regencyCode: string) => {
    setLoadingDistricts(true);
    try {
      const data = await cachedWilayahAPI.getDistricts(regencyCode);
      setDistricts(data);
    } catch (error) {
      console.error("❌ Error loading districts:", error);
      toast.error("Gagal memuat data kecamatan");
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Load villages function
  const loadVillages = async (districtCode: string) => {
    setLoadingVillages(true);
    try {
      const data = await cachedWilayahAPI.getVillages(districtCode);
      setVillages(data);
      
      // Auto-fill kode pos jika kelurahan sudah dipilih
      const currentKelurahan = watch("kelurahan");
      if (currentKelurahan && data.length > 0) {
        try {
          const kodepos = await getKodeposByWilayah(currentKelurahan);
          if (kodepos) {
            setValue("kodePos", kodepos);
          }
        } catch (error) {
          console.error("Error loading kodepos:", error);
        }
      }
    } catch (error) {
      console.error("❌ Error loading villages:", error);
      toast.error("Gagal memuat data kelurahan/desa");
    } finally {
      setLoadingVillages(false);
    }
  };

  // Get display name helper
  const getSelectedName = (code: string, items: { code: string; name: string }[]) => {
    const found = items.find(item => item.code === code);
    return found ? found.name : code;
  };

  // Debug log untuk development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Debug log removed for cleaner code
    }
  }, [
    isPerformingLookup, lookupProgress,
    watchProvinsi, watchKota, watchKecamatan, watchKelurahan,
    provinces.length, regencies.length, districts.length, villages.length,
    loadingProvinces, loadingRegencies, loadingDistricts, loadingVillages
  ]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Informasi Lokasi & Alamat
        {isPerformingLookup && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Search className="h-4 w-4 animate-pulse" />
            {lookupProgress}
          </div>
        )}
      </h3>

      {/* Provinsi */}
      <FormField
        control={control}
        name="provinsi"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Provinsi</FormLabel>
            <FormControl>
              <WilayahCombobox
                options={convertWilayahToComboboxOptions(provinces)}
                value={field.value}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  handleProvinsiChange(value);
                }}
                placeholder={loadingProvinces ? "Memuat provinsi..." : "Pilih provinsi"}
                searchPlaceholder="Cari provinsi..."
                emptyMessage="Provinsi tidak ditemukan"
                name={field.name}
                onBlur={field.onBlur}
                disabled={disabled}
                loading={loadingProvinces}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Kota/Kabupaten */}
      <FormField
        control={control}
        name="kota"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Kota/Kabupaten
            </FormLabel>
            <FormControl>
              <WilayahCombobox
                options={convertWilayahToComboboxOptions(regencies)}
                value={field.value}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  handleKotaChange(value);
                }}
                placeholder={
                  !watchProvinsi 
                    ? "Pilih provinsi terlebih dahulu" 
                    : loadingRegencies
                      ? "Memuat kota/kabupaten..."
                      : regencies.length === 0
                        ? "Sedang mencari data..."
                        : "Pilih kota/kabupaten"
                }
                searchPlaceholder="Cari kota/kabupaten..."
                emptyMessage="Kota/kabupaten tidak ditemukan"
                name={field.name}
                onBlur={field.onBlur}
                disabled={disabled || !watchProvinsi}
                loading={loadingRegencies || (watchProvinsi && regencies.length === 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Kecamatan */}
      <FormField
        control={control}
        name="kecamatan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kecamatan</FormLabel>
            <FormControl>
              <WilayahCombobox
                options={convertWilayahToComboboxOptions(districts)}
                value={field.value}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  handleKecamatanChange(value);
                }}
                placeholder={
                  !watchKota 
                    ? "Pilih kota/kabupaten terlebih dahulu" 
                    : loadingDistricts
                      ? "Memuat kecamatan..."
                      : districts.length === 0
                        ? "Sedang mencari data..."
                        : "Pilih kecamatan"
                }
                searchPlaceholder="Cari kecamatan..."
                emptyMessage="Kecamatan tidak ditemukan"
                name={field.name}
                onBlur={field.onBlur}
                disabled={disabled || !watchKota}
                loading={loadingDistricts || (watchKota && districts.length === 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Kelurahan/Desa */}
      <FormField
        control={control}
        name="kelurahan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kelurahan/Desa</FormLabel>
            <FormControl>
              <WilayahCombobox
                options={convertWilayahToComboboxOptions(villages)}
                value={field.value}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  handleKelurahanChange(value);
                }}
                placeholder={
                  !watchKecamatan 
                    ? "Pilih kecamatan terlebih dahulu" 
                    : loadingVillages
                      ? "Memuat kelurahan/desa..."
                      : villages.length === 0
                        ? "Sedang mencari data..."
                        : "Pilih kelurahan/desa"
                }
                searchPlaceholder="Cari kelurahan/desa..."
                emptyMessage="Kelurahan/desa tidak ditemukan"
                name={field.name}
                onBlur={field.onBlur}
                disabled={disabled || !watchKecamatan}
                loading={loadingVillages || (watchKecamatan && villages.length === 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Kode Pos */}
      <FormField
        control={control}
        name="kodePos"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Kode Pos
              {watchKelurahan && (
                <span className="text-xs text-blue-600">(Auto dari database)</span>
              )}
            </FormLabel>
            <FormControl>
              <Input 
                placeholder={
                  !watchKelurahan 
                    ? "Pilih kelurahan terlebih dahulu untuk auto-fill" 
                    : villages.length === 0
                      ? "Kode pos akan terisi otomatis setelah data kelurahan dimuat"
                      : "Kode pos akan terisi otomatis atau isi manual"
                }
                disabled={disabled}
                {...field} 
              />
            </FormControl>
            <FormMessage />
            {watchKelurahan && (
              <p className="text-xs text-gray-500">
                Kode pos diambil dari database resmi berdasarkan kelurahan yang dipilih
              </p>
            )}
          </FormItem>
        )}
      />

    </div>
  );
}
