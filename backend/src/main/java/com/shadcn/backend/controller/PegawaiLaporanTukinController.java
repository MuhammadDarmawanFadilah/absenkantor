package com.shadcn.backend.controller;

import com.shadcn.backend.dto.LaporanTukinRequest;
import com.shadcn.backend.dto.LaporanTukinResponse;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.LaporanTukinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/pegawai/laporan-tukin")
@RequiredArgsConstructor
@Slf4j
public class PegawaiLaporanTukinController {
    
    private final LaporanTukinService laporanTukinService;
    private final AuthService authService;
    
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> generateLaporanPribadi(
            @Valid @RequestBody LaporanTukinRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            log.info("Request generate laporan tukin pribadi: {}/{}", request.getBulan(), request.getTahun());
            
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            // Force pegawaiId to current user for personal report
            request.setPegawaiId(currentUser.getId());
            
            LaporanTukinResponse response = laporanTukinService.generateLaporanTukinPribadi(request, currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Laporan tunjangan kinerja pribadi berhasil digenerate");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error generating laporan tukin pribadi: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal generate laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/histori")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getHistoriLaporanPribadi(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer bulan,
            @RequestParam(required = false) Integer tahun,
            @RequestParam(required = false) String status,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            // Filter by current user's ID
            Page<LaporanTukinResponse> laporanPage = laporanTukinService.getHistoriLaporanPribadi(
                page, size, bulan, tahun, status, currentUser.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Data histori laporan pribadi berhasil diambil");
            result.put("data", laporanPage.getContent());
            result.put("currentPage", laporanPage.getNumber());
            result.put("totalItems", laporanPage.getTotalElements());
            result.put("totalPages", laporanPage.getTotalPages());
            result.put("size", laporanPage.getSize());
            result.put("hasNext", laporanPage.hasNext());
            result.put("hasPrevious", laporanPage.hasPrevious());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching histori laporan pribadi: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil histori laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getLaporanPribadiById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            LaporanTukinResponse response = laporanTukinService.getLaporanByIdPribadi(id, currentUser.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Detail laporan berhasil diambil");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting laporan by id: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil detail laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}/detail")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getDetailLaporanPribadi(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            LaporanTukinResponse response = laporanTukinService.getDetailLaporanByIdPribadi(id, currentUser.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Detail laporan berhasil diambil");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting detail laporan by id: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil detail laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<byte[]> downloadLaporanPribadi(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            byte[] fileContent = laporanTukinService.downloadLaporanPribadi(id, currentUser.getId());
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"laporan-tukin-pribadi-" + id + ".xlsx\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(fileContent);
        } catch (Exception e) {
            log.error("Error downloading laporan pribadi: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}/download-pdf")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<byte[]> downloadLaporanPribadiPDF(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            byte[] pdfContent = laporanTukinService.downloadLaporanPribadiPDF(id, currentUser.getId());
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"laporan-tukin-pribadi-" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfContent);
        } catch (Exception e) {
            log.error("Error downloading laporan pribadi PDF: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}/rincian")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getRincianDetailPribadi(
            @PathVariable Long id,
            @RequestParam(required = false) Long pegawaiId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            // For personal reports, force pegawaiId to current user if not specified
            Long targetPegawaiId = pegawaiId != null ? pegawaiId : currentUser.getId();
            
            // Verify access - can only access own data
            if (!targetPegawaiId.equals(currentUser.getId())) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Access denied - can only view own data");
                return ResponseEntity.status(403).body(result);
            }
            
            var rincianDetail = laporanTukinService.getRincianDetailLaporanPribadi(id, targetPegawaiId, currentUser.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Rincian detail berhasil diambil");
            result.put("data", rincianDetail);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting rincian detail pribadi: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil rincian detail: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}/pegawai")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getPegawaiListPribadi(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            // For personal reports, only return current user
            var pegawaiList = laporanTukinService.getPegawaiListLaporanPribadi(id, currentUser.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Daftar pegawai berhasil diambil");
            result.put("data", pegawaiList);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting pegawai list pribadi: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil daftar pegawai: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> deleteLaporanPribadi(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            laporanTukinService.deleteLaporanPribadi(id, currentUser.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Laporan berhasil dihapus");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error deleting laporan pribadi: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal menghapus laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
}