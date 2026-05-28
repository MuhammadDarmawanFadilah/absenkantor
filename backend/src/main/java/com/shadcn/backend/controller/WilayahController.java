package com.shadcn.backend.controller;

import com.shadcn.backend.service.WilayahCacheService;
import com.shadcn.backend.service.WilayahService;
import com.shadcn.backend.service.WilayahKodeposService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wilayah")
public class WilayahController {
    
    @Autowired
    private WilayahService wilayahService;

    @Autowired
    private WilayahCacheService wilayahCacheService;

    @Autowired
    private WilayahKodeposService wilayahKodeposService;
    
    /**
     * Get all provinces from wilayah.id
     * Returns list format compatible with frontend dropdown
     */
    @GetMapping("/provinsi")
    public ResponseEntity<?> getProvinsi() {
        try {
            Map<String, Object> response = wilayahService.getProvinces();
            
            if (response.containsKey("error")) {
                // Fallback to hardcoded provinces if API fails
                java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
                
                String[] provinces = {
                    "11|Aceh", "12|Sumatera Utara", "13|Sumatera Barat", "14|Riau", "15|Jambi",
                    "16|Sumatera Selatan", "17|Bengkulu", "18|Lampung", "19|Kepulauan Bangka Belitung",
                    "21|Kepulauan Riau", "31|DKI Jakarta", "32|Jawa Barat", "33|Jawa Tengah",
                    "34|Daerah Istimewa Yogyakarta", "35|Jawa Timur", "36|Banten", "51|Bali",
                    "52|Nusa Tenggara Barat", "53|Nusa Tenggara Timur", "61|Kalimantan Barat",
                    "62|Kalimantan Tengah", "63|Kalimantan Selatan", "64|Kalimantan Timur",
                    "65|Kalimantan Utara", "71|Sulawesi Utara", "72|Sulawesi Tengah", "73|Sulawesi Selatan",
                    "74|Sulawesi Tenggara", "75|Gorontalo", "76|Sulawesi Barat", "81|Maluku",
                    "82|Maluku Utara", "91|Papua Barat", "94|Papua"
                };
                
                for (String province : provinces) {
                    String[] parts = province.split("\\|");
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("kode", parts[0]);
                    item.put("nama", parts[1]);
                    result.add(item);
                }
                
                return ResponseEntity.ok(result);
            }
            
            @SuppressWarnings("unchecked")
            java.util.List<Map<String, Object>> provinces = (java.util.List<Map<String, Object>>) response.get("data");
            
            // Transform to frontend format
            java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (Map<String, Object> province : provinces) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("kode", province.get("code"));
                item.put("nama", province.get("name"));
                result.add(item);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch provinces: " + e.getMessage()));
        }
    }
    
    /**
     * Get cities/regencies by province code
     * Returns list format compatible with frontend dropdown
     */
    @GetMapping("/kota")
    public ResponseEntity<?> getKota(@RequestParam String provinsiKode) {
        try {
            Map<String, Object> response = wilayahService.getRegencies(provinsiKode);
            
            if (response.containsKey("error")) {
                return ResponseEntity.status(500).body(response);
            }
            
            @SuppressWarnings("unchecked")
            java.util.List<Map<String, Object>> regencies = (java.util.List<Map<String, Object>>) response.get("data");
            
            // Transform to frontend format
            java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (Map<String, Object> regency : regencies) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("kode", regency.get("code"));
                item.put("nama", regency.get("name"));
                result.add(item);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch cities: " + e.getMessage()));
        }
    }
    
    /**
     * Get districts by city/regency code
     * Returns list format compatible with frontend dropdown
     */
    @GetMapping("/kecamatan")
    public ResponseEntity<?> getKecamatan(@RequestParam String kotaKode) {
        try {
            Map<String, Object> response = wilayahService.getDistricts(kotaKode);
            
            if (response.containsKey("error")) {
                return ResponseEntity.status(500).body(response);
            }
            
            @SuppressWarnings("unchecked")
            java.util.List<Map<String, Object>> districts = (java.util.List<Map<String, Object>>) response.get("data");
            
            // Transform to frontend format
            java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (Map<String, Object> district : districts) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("kode", district.get("code"));
                item.put("nama", district.get("name"));
                result.add(item);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch districts: " + e.getMessage()));
        }
    }
    
    /**
     * Get villages by district code (includes postal codes)
     * Returns list format compatible with frontend dropdown
     */
    @GetMapping("/kelurahan")
    public ResponseEntity<?> getKelurahan(@RequestParam String kecamatanKode) {
        try {
            Map<String, Object> response = wilayahService.getVillages(kecamatanKode);
            
            if (response.containsKey("error")) {
                return ResponseEntity.status(500).body(response);
            }
            
            @SuppressWarnings("unchecked")
            java.util.List<Map<String, Object>> villages = (java.util.List<Map<String, Object>>) response.get("data");
            
            // Transform to frontend format with postal code from database
            java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (Map<String, Object> village : villages) {
                Map<String, Object> item = new java.util.HashMap<>();
                String villageCode = (String) village.get("code");
                item.put("kode", villageCode);
                item.put("nama", village.get("name"));
                
                // Get postal code from database
                try {
                    String kodePos = wilayahKodeposService.getKodeposByKodeWilayah(villageCode);
                    item.put("kodePos", kodePos);
                } catch (Exception e) {
                    item.put("kodePos", null);
                }
                
                result.add(item);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch villages: " + e.getMessage()));
        }
    }
    
    /**
     * Get wilayah name by code (from cache or API)
     */
    @GetMapping("/name/{kode}")
    public ResponseEntity<Map<String, String>> getWilayahName(@PathVariable String kode) {
        try {
            String nama = wilayahCacheService.getNamaByKode(kode);
            Map<String, String> response = Map.of(
                "kode", kode,
                "nama", nama
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = Map.of(
                "error", "Failed to get wilayah name: " + e.getMessage(),
                "kode", kode,
                "nama", kode // Fallback to code if lookup fails
            );
            return ResponseEntity.status(500).body(error);
        }
    }    /**
     * Batch get wilayah names by codes
     * Expected format: {"kode1": "type1", "kode2": "type2"}
     * Returns: {"kode1": "nama1", "kode2": "nama2"}
     */
    @PostMapping("/names")
    public ResponseEntity<Map<String, String>> getWilayahNames(@RequestBody Map<String, String> kodeMap) {
        Map<String, String> response = new java.util.HashMap<>();
        
        for (Map.Entry<String, String> entry : kodeMap.entrySet()) {
            String kode = entry.getKey();
            // entry.getValue() contains type information (currently not used)
            
            if (kode != null && !kode.isEmpty()) {
                try {
                    String nama = wilayahCacheService.getNamaByKode(kode);
                    response.put(kode, nama);
                } catch (Exception e) {
                    response.put(kode, kode); // Fallback to code
                }
            }
        }
        
        return ResponseEntity.ok(response);
    }
}
