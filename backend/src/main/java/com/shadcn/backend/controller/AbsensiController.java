package com.shadcn.backend.controller;

import com.shadcn.backend.dto.AbsensiRequest;
import com.shadcn.backend.dto.AbsensiResponse;
import com.shadcn.backend.dto.AbsensiStats;
import com.shadcn.backend.dto.PagedResponse;
import com.shadcn.backend.dto.ShiftResponse;
import com.shadcn.backend.service.AbsensiService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/absensi")
@RequiredArgsConstructor
public class AbsensiController {
    
    private final AbsensiService absensiService;
    
    @GetMapping("/shifts")
    public ResponseEntity<List<ShiftResponse>> getActiveShifts() {
        List<ShiftResponse> shifts = absensiService.getActiveShifts();
        return ResponseEntity.ok(shifts);
    }
    
    @GetMapping("/location-info")
    public ResponseEntity<Map<String, Object>> getLocationInfo(
            @RequestParam Long pegawaiId,
            @RequestParam Long shiftId,
            @RequestParam(required = false) Double currentLat,
            @RequestParam(required = false) Double currentLon) {
        
        Map<String, Object> locationInfo = absensiService.getLocationInfoForAbsensi(
            pegawaiId, shiftId, currentLat, currentLon);
        return ResponseEntity.ok(locationInfo);
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createAbsensi(@Valid @RequestBody AbsensiRequest request) {
        try {
            AbsensiResponse response = absensiService.createAbsensi(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Absensi berhasil dicatat");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @PostMapping("/check-in")
    public ResponseEntity<Map<String, Object>> checkIn(@Valid @RequestBody AbsensiRequest request) {
        try {
            AbsensiResponse response = absensiService.createAbsensi(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Absensi berhasil dicatat");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/history/{pegawaiId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<PagedResponse<AbsensiResponse>> getAbsensiHistory(
            @PathVariable Long pegawaiId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String bulan,
            @RequestParam(required = false) String tahun,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "tanggal") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PagedResponse<AbsensiResponse> response = absensiService.getAbsensiHistory(
            pegawaiId, bulan, tahun, startDate, endDate, type, status, pageable);
            
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/stats/{pegawaiId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<AbsensiStats> getAbsensiStats(
            @PathVariable Long pegawaiId,
            @RequestParam(required = false) String bulan,
            @RequestParam(required = false) String tahun) {
        
        AbsensiStats stats = absensiService.getAbsensiStats(pegawaiId, bulan, tahun);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/today/{pegawaiId}")
    public ResponseEntity<Map<String, Object>> getTodayAbsensi(@PathVariable Long pegawaiId) {
        try {
            Map<String, Object> result = absensiService.getTodayAbsensi(pegawaiId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/current-month/{pegawaiId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<List<AbsensiResponse>> getCurrentMonthAbsensi(@PathVariable Long pegawaiId) {
        LocalDate now = LocalDate.now();
        String bulan = now.format(DateTimeFormatter.ofPattern("MM"));
        String tahun = now.format(DateTimeFormatter.ofPattern("yyyy"));
        
        PagedResponse<AbsensiResponse> response = absensiService.getAbsensiHistory(
            pegawaiId, bulan, tahun, null, null, null, null, PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "tanggal")));
            
        return ResponseEntity.ok(response.getContent());
    }
    
    // Admin endpoints for master data
    @GetMapping("/history/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<PagedResponse<AbsensiResponse>> getAllAbsensiHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long pegawaiId,
            @RequestParam(defaultValue = "tanggal") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PagedResponse<AbsensiResponse> response = absensiService.getAllAbsensiHistory(
            startDate, endDate, type, status, pegawaiId, pageable);
            
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/stats/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<AbsensiStats> getAllAbsensiStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long pegawaiId) {
        
        AbsensiStats stats = absensiService.getAllAbsensiStats(startDate, endDate, pegawaiId);
        return ResponseEntity.ok(stats);
    }
    
    @DeleteMapping("/{absensiId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteAbsensi(@PathVariable Long absensiId) {
        try {
            absensiService.deleteAbsensi(absensiId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Data absensi berhasil dihapus");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
