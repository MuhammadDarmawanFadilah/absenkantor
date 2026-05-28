package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PemotonganAbsenRequest;
import com.shadcn.backend.service.PemotonganAbsenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pemotongan-absen")
@RequiredArgsConstructor
@Slf4j
public class PemotonganAbsenController {
    
    private final PemotonganAbsenService pemotonganAbsenService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getAllPemotonganAbsen() {
        try {
            log.debug("Request untuk mengambil semua pemotongan absen");
            
            List<Map<String, Object>> pemotonganAbsens = pemotonganAbsenService.getAllPemotonganAbsen();
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Data pemotongan absen berhasil diambil",
                    "data", pemotonganAbsens
            ));
        } catch (Exception e) {
            log.error("Error saat mengambil pemotongan absen: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Gagal mengambil data pemotongan absen: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getPemotonganAbsenById(@PathVariable Long id) {
        try {
            log.debug("Request untuk mengambil pemotongan absen dengan ID: {}", id);
            
            Map<String, Object> pemotonganAbsen = pemotonganAbsenService.getPemotonganAbsenById(id);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Data pemotongan absen berhasil diambil",
                    "data", pemotonganAbsen
            ));
        } catch (Exception e) {
            log.error("Error saat mengambil pemotongan absen dengan ID {}: ", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Gagal mengambil data pemotongan absen: " + e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updatePemotonganAbsen(
            @PathVariable Long id,
            @Valid @RequestBody PemotonganAbsenRequest request) {
        try {
            log.debug("Request untuk mengupdate pemotongan absen dengan ID: {}", id);
            
            Map<String, Object> updated = pemotonganAbsenService.updatePemotonganAbsen(id, request);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Pemotongan absen berhasil diupdate",
                    "data", updated
            ));
        } catch (Exception e) {
            log.error("Error saat mengupdate pemotongan absen dengan ID {}: ", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Gagal mengupdate pemotongan absen: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/reset-to-default")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> resetToDefault() {
        try {
            log.debug("Request untuk reset pemotongan absen ke data default");
            
            pemotonganAbsenService.resetToDefaultData();
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Data pemotongan absen berhasil direset ke pengaturan default"
            ));
        } catch (Exception e) {
            log.error("Error saat reset pemotongan absen ke default: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Gagal reset pemotongan absen ke default: " + e.getMessage()
            ));
        }
    }
}
