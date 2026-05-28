package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PemotonganRequest;
import com.shadcn.backend.dto.PemotonganResponse;
import com.shadcn.backend.service.PemotonganService;
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
@RequestMapping("/api/pemotongan")
@RequiredArgsConstructor
@Validated
public class PemotonganController {

    private final PemotonganService pemotonganService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getAllPemotongan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String namaPegawai,
            @RequestParam(required = false) Integer bulan,
            @RequestParam(required = false) Integer tahun) {
        
        Page<PemotonganResponse> pemotonganPage = pemotonganService.getAllPemotongan(page, size, namaPegawai, bulan, tahun);
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", pemotonganPage.getContent());
        response.put("currentPage", pemotonganPage.getNumber());
        response.put("totalItems", pemotonganPage.getTotalElements());
        response.put("totalPages", pemotonganPage.getTotalPages());
        response.put("size", pemotonganPage.getSize());
        response.put("first", pemotonganPage.isFirst());
        response.put("last", pemotonganPage.isLast());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<PemotonganResponse> getPemotonganById(@PathVariable Long id) {
        PemotonganResponse pemotongan = pemotonganService.getPemotonganById(id);
        return ResponseEntity.ok(pemotongan);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> createPemotongan(@Valid @RequestBody PemotonganRequest request) {
        try {
            PemotonganResponse pemotongan = pemotonganService.createPemotongan(request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pemotongan berhasil dibuat");
            response.put("data", pemotongan);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating pemotongan: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> updatePemotongan(
            @PathVariable Long id,
            @Valid @RequestBody PemotonganRequest request) {
        try {
            PemotonganResponse pemotongan = pemotonganService.updatePemotongan(id, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pemotongan berhasil diupdate");
            response.put("data", pemotongan);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating pemotongan: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> deletePemotongan(@PathVariable Long id) {
        try {
            pemotonganService.deletePemotongan(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pemotongan berhasil dihapus");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting pemotongan: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/pegawai/{pegawaiId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<List<PemotonganResponse>> getPemotonganByPegawai(@PathVariable Long pegawaiId) {
        List<PemotonganResponse> pemotongans = pemotonganService.getPemotonganByPegawai(pegawaiId);
        return ResponseEntity.ok(pemotongans);
    }

    @GetMapping("/periode")
    @PreAuthorize("hasAnyRole('ADMIN', 'VERIFICATOR')")
    public ResponseEntity<List<PemotonganResponse>> getPemotonganByPeriode(
            @RequestParam Integer bulan,
            @RequestParam Integer tahun) {
        List<PemotonganResponse> pemotongans = pemotonganService.getPemotonganByPeriode(bulan, tahun);
        return ResponseEntity.ok(pemotongans);
    }
}
