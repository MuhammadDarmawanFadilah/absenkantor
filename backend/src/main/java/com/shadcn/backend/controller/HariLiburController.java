package com.shadcn.backend.controller;

import com.shadcn.backend.dto.HariLiburRequest;
import com.shadcn.backend.dto.HariLiburResponse;
import com.shadcn.backend.service.HariLiburService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/api/hari-libur")
@RequiredArgsConstructor
@Validated
public class HariLiburController {

    private final HariLiburService hariLiburService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllHariLibur(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String namaLibur,
            @RequestParam(required = false) Integer tahun,
            @RequestParam(required = false) Integer bulan) {
        
        Page<HariLiburResponse> hariLiburPage = hariLiburService.getAllHariLibur(page, size, namaLibur, tahun, bulan);
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", hariLiburPage.getContent());
        response.put("currentPage", hariLiburPage.getNumber());
        response.put("totalItems", hariLiburPage.getTotalElements());
        response.put("totalPages", hariLiburPage.getTotalPages());
        response.put("size", hariLiburPage.getSize());
        response.put("first", hariLiburPage.isFirst());
        response.put("last", hariLiburPage.isLast());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR', 'USER')")
    public ResponseEntity<HariLiburResponse> getHariLiburById(@PathVariable Long id) {
        HariLiburResponse hariLibur = hariLiburService.getHariLiburById(id);
        return ResponseEntity.ok(hariLibur);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> createHariLibur(@Valid @RequestBody HariLiburRequest request) {
        try {
            HariLiburResponse hariLibur = hariLiburService.createHariLibur(request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Hari libur berhasil dibuat");
            response.put("data", hariLibur);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating hari libur: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> updateHariLibur(
            @PathVariable Long id, 
            @Valid @RequestBody HariLiburRequest request) {
        try {
            HariLiburResponse hariLibur = hariLiburService.updateHariLibur(id, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Hari libur berhasil diupdate");
            response.put("data", hariLibur);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating hari libur: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> deleteHariLibur(@PathVariable Long id) {
        try {
            hariLiburService.deleteHariLibur(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Hari libur berhasil dihapus");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting hari libur: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/reset-tahun-ini")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> resetHariLiburTahunIni() {
        try {
            List<HariLiburResponse> hariLiburs = hariLiburService.resetHariLiburTahunIni();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Hari libur tahun ini berhasil direset dari API eksternal");
            response.put("data", hariLiburs);
            response.put("total", hariLiburs.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting hari libur tahun ini: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/reset-tahun/{tahun}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> resetHariLiburByTahun(@PathVariable int tahun) {
        try {
            List<HariLiburResponse> hariLiburs = hariLiburService.resetHariLiburByYear(tahun);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Hari libur tahun " + tahun + " berhasil direset dari API eksternal");
            response.put("data", hariLiburs);
            response.put("total", hariLiburs.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting hari libur tahun {}: {}", tahun, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/tahun/{tahun}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR', 'USER')")
    public ResponseEntity<List<HariLiburResponse>> getHariLiburByTahun(@PathVariable int tahun) {
        List<HariLiburResponse> hariLiburs = hariLiburService.getHariLiburByTahun(tahun);
        return ResponseEntity.ok(hariLiburs);
    }

    @GetMapping("/bulan/{bulan}/tahun/{tahun}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR', 'USER')")
    public ResponseEntity<List<HariLiburResponse>> getHariLiburByBulanTahun(
            @PathVariable int bulan, 
            @PathVariable int tahun) {
        List<HariLiburResponse> hariLiburs = hariLiburService.getHariLiburByBulanTahun(bulan, tahun);
        return ResponseEntity.ok(hariLiburs);
    }

    @GetMapping("/check/{tanggal}")
    public ResponseEntity<Map<String, Object>> checkHariLibur(@PathVariable String tanggal) {
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(tanggal);
            boolean isHariLibur = hariLiburService.isHariLibur(date);
            
            Map<String, Object> response = new HashMap<>();
            response.put("tanggal", tanggal);
            response.put("isHariLibur", isHariLibur);
            response.put("message", isHariLibur ? "Tanggal tersebut adalah hari libur" : "Tanggal tersebut bukan hari libur");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Format tanggal tidak valid. Gunakan format yyyy-MM-dd");
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
