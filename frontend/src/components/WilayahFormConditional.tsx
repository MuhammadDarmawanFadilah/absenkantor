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
import { WilayahCombobox } from "@/components/ui/wilayah-combobox";
import { 
  cachedWilayahAPI, 
  WilayahProvince, 
  WilayahRegency, 
  WilayahDistrict, 
  WilayahVillage,
  convertWilayahToComboboxOptions 
} from "@/lib/wilayah-api";
import { MapPin, Building, Search } from "lucide-react";
import { toast } from "sonner";

interface WilayahFormConditionalProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  tingkatPemilihan?: string; // New prop to control which fields to show
  disabled?: boolean;
  onDataLoad?: () => void;
}

export default function WilayahFormConditional({ 
  control, 
  setValue, 
  watch, 
  tingkatPemilihan,
  disabled = false, 
  onDataLoad 
}: WilayahFormConditionalProps) {
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

  // Load provinces saat component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Auto-lookup system based on existing form values
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
      console.log('🔍 [LOOKUP] Starting wilayah lookup...', {
        provinsi: watchProvinsi,
        kota: watchKota,
        kecamatan: watchKecamatan,
        kelurahan: watchKelurahan
      });

      try {
        // Step 1: Lookup regencies berdasarkan provinsi yang ada
        if (needsRegencyLookup) {
          setLookupProgress("Mencari kota/kabupaten...");
          console.log('📍 [LOOKUP] Loading regencies for:', watchProvinsi);
          await loadRegencies(watchProvinsi);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Step 2: Lookup districts berdasarkan kota yang ada
        if (needsDistrictLookup && watchKota) {
          setLookupProgress("Mencari kecamatan...");
          console.log('🏘️ [LOOKUP] Loading districts for:', watchKota);
          await loadDistricts(watchKota);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Step 3: Lookup villages berdasarkan kecamatan yang ada
        if (needsVillageLookup && watchKecamatan) {
          setLookupProgress("Mencari kelurahan/desa...");
          console.log('🏡 [LOOKUP] Loading villages for:', watchKecamatan);
          await loadVillages(watchKecamatan);
        }

        setLookupProgress("Selesai");
        console.log('✅ [LOOKUP] Complete lookup finished successfully');
        
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
    console.log('🔄 [USER] Provinsi changed to:', value);
    
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
    console.log('🔄 [USER] Kota changed to:', value);
    
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
    console.log('🔄 [USER] Kecamatan changed to:', value);
    
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
  const handleKelurahanChange = useCallback((value: string) => {
    console.log('🔄 [USER] Kelurahan changed to:', value);
    
    if (value && villages.length > 0) {
      const selectedVillage = villages.find(v => v.code === value);
      if (selectedVillage && selectedVillage.postal_code) {
        setValue("kodePos", selectedVillage.postal_code);
        console.log('📮 [AUTO] Postal code set to:', selectedVillage.postal_code);
      }
    } else {
      setValue("kodePos", "");
    }
  }, [villages, setValue]);

  // Load provinces function
  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      console.log('🌍 Loading provinces...');
      const data = await cachedWilayahAPI.getProvinces();
      setProvinces(data);
      console.log('✅ Provinces loaded:', data.length);
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
      console.log('🏢 Loading regencies for province:', provinceCode);
      const data = await cachedWilayahAPI.getRegencies(provinceCode);
      setRegencies(data);
      console.log('✅ Regencies loaded:', data.length);
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
      console.log('🏘️ Loading districts for regency:', regencyCode);
      const data = await cachedWilayahAPI.getDistricts(regencyCode);
      setDistricts(data);
      console.log('✅ Districts loaded:', data.length);
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
      console.log('🏡 Loading villages for district:', districtCode);
      const data = await cachedWilayahAPI.getVillages(districtCode);
      setVillages(data);
      console.log('✅ Villages loaded:', data.length);
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

  // Determine which fields to show based on tingkat pemilihan
  const shouldShowProvinsi = tingkatPemilihan && ['provinsi', 'kota', 'kecamatan', 'kelurahan'].includes(tingkatPemilihan);
  const shouldShowKota = tingkatPemilihan && ['kota', 'kecamatan', 'kelurahan'].includes(tingkatPemilihan);
  const shouldShowKecamatan = tingkatPemilihan && ['kecamatan', 'kelurahan'].includes(tingkatPemilihan);
  const shouldShowKelurahan = tingkatPemilihan && ['kelurahan'].includes(tingkatPemilihan);

  if (!tingkatPemilihan) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MapPin className="h-8 w-8 mx-auto mb-2" />
        <p>Pilih tingkat pemilihan terlebih dahulu</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Wilayah {tingkatPemilihan.charAt(0).toUpperCase() + tingkatPemilihan.slice(1)}
        </h3>
        {isPerformingLookup && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Search className="h-4 w-4 animate-pulse" />
            {lookupProgress}
          </div>
        )}
      </div>

      {/* Conditional Fields based on tingkat pemilihan */}
      <div className="space-y-4">
        {/* Provinsi - Show when any tingkat is selected */}
        {shouldShowProvinsi && (
          <FormField
            control={control}
            name="provinsi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provinsi *</FormLabel>
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
        )}

        {/* Kota/Kabupaten - Show for kota, kecamatan, kelurahan */}
        {shouldShowKota && (
          <FormField
            control={control}
            name="kota"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Kota/Kabupaten *
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
        )}

        {/* Kecamatan - Show for kecamatan, kelurahan */}
        {shouldShowKecamatan && (
          <FormField
            control={control}
            name="kecamatan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kecamatan *</FormLabel>
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
        )}

        {/* Kelurahan/Desa - Show only for kelurahan */}
        {shouldShowKelurahan && (
          <FormField
            control={control}
            name="kelurahan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kelurahan/Desa *</FormLabel>
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
        )}
      </div>

      {/* Display lokasi summary */}
      {(watchProvinsi || watchKota || watchKecamatan || watchKelurahan) && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-muted-foreground mb-2">Lokasi yang dipilih:</p>
          <div className="text-sm space-y-1">
            {shouldShowKelurahan && watchKelurahan && (
              <p><span className="font-medium">Kelurahan/Desa:</span> {getSelectedName(watchKelurahan, villages)}</p>
            )}
            {shouldShowKecamatan && watchKecamatan && (
              <p><span className="font-medium">Kecamatan:</span> {getSelectedName(watchKecamatan, districts)}</p>
            )}
            {shouldShowKota && watchKota && (
              <p><span className="font-medium">Kota/Kabupaten:</span> {getSelectedName(watchKota, regencies)}</p>
            )}
            {shouldShowProvinsi && watchProvinsi && (
              <p><span className="font-medium">Provinsi:</span> {getSelectedName(watchProvinsi, provinces)}</p>
            )}
          </div>
          
          {isPerformingLookup && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <Search className="h-3 w-3 animate-spin" />
              <span>Sedang memuat data wilayah...</span>
            </div>
          )}
        </div>
      )}

      {/* Info about data source */}
      <div className="text-xs text-gray-500 text-center">
        Data wilayah resmi Indonesia
      </div>
    </div>
  );
}
