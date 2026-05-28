package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PegawaiRequest;
import com.shadcn.backend.dto.PegawaiResponse;
import com.shadcn.backend.dto.UpdatePegawaiRequest;
import com.shadcn.backend.dto.SelfUpdatePegawaiRequest;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.service.PegawaiService;
import com.shadcn.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/pegawai")
@RequiredArgsConstructor
public class PegawaiController {

    private final PegawaiService pegawaiService;
    private final AuthService authService;

    @PostMapping("/check-duplicate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Map<String, Boolean>> checkDuplicate(@RequestBody Map<String, Object> checkData) {
        try {
            String username = (String) checkData.get("username");
            String email = (String) checkData.get("email");
            String phoneNumber = (String) checkData.get("phoneNumber");
            String nip = (String) checkData.get("nip");
            Integer excludeId = checkData.get("excludeId") != null ? 
                Integer.valueOf(checkData.get("excludeId").toString()) : null;
            
            Map<String, Boolean> result = pegawaiService.checkDuplicateData(username, email, phoneNumber, nip, excludeId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error checking duplicate data: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", true));
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('pegawai.read')")
    public ResponseEntity<Map<String, Object>> getAllPegawai(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String nama,
            @RequestParam(required = false) String nip,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String jabatan,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "namaLengkap") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            Page<PegawaiResponse> pegawaiPage = pegawaiService.getPegawaiWithFilters(
                search, nama, nip, email, phoneNumber, status, jabatan, role, page, size, sortBy, sortDir);
            
            response.put("pegawai", pegawaiPage.getContent());
            response.put("totalElements", pegawaiPage.getTotalElements());
            response.put("totalPages", pegawaiPage.getTotalPages());
            response.put("currentPage", page);
            response.put("pageSize", size);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching pegawai: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch pegawai data");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('pegawai.read')")
    public ResponseEntity<List<PegawaiResponse>> getAllPegawaiList() {
        try {
            List<PegawaiResponse> pegawaiList = pegawaiService.getAllPegawai();
            return ResponseEntity.ok(pegawaiList);
        } catch (Exception e) {
            log.error("Error fetching pegawai list: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or (hasRole('USER') and #id == authentication.principal.id)")
    public ResponseEntity<PegawaiResponse> getPegawaiById(@PathVariable Long id) {
        try {
            Optional<PegawaiResponse> pegawaiOpt = pegawaiService.getPegawaiById(id);
            if (pegawaiOpt.isPresent()) {
                return ResponseEntity.ok(pegawaiOpt.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error getting pegawai by id: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/current")
    public ResponseEntity<PegawaiResponse> getCurrentPegawai(HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            log.debug("Authorization header: {}", token != null ? "Bearer ***" : "null");
            
            if (token != null && token.startsWith("Bearer ")) {
                String actualToken = token.substring(7);
                log.debug("Extracted token length: {}", actualToken.length());
                
                // Extract user ID directly from token without signature validation
                Long userId = authService.getUserIdFromToken(actualToken);
                log.debug("Extracted user ID from token: {}", userId);
                
                if (userId != null) {
                    // Get pegawai directly by ID without token validation
                    Optional<PegawaiResponse> pegawaiResponseOpt = pegawaiService.getPegawaiById(userId);
                    if (pegawaiResponseOpt.isPresent()) {
                        PegawaiResponse pegawai = pegawaiResponseOpt.get();
                        
                        // Check if pegawai is active
                        if ("ACTIVE".equalsIgnoreCase(pegawai.getStatus()) || 
                            Boolean.TRUE.equals(pegawai.getIsActive())) {
                            
                            log.debug("Successfully found active pegawai data for ID: {}", userId);
                            return ResponseEntity.ok(pegawai);
                        } else {
                            log.warn("Pegawai is not active for ID: {}", userId);
                        }
                    } else {
                        log.warn("Pegawai data not found for ID: {}", userId);
                    }
                } else {
                    log.warn("Could not extract user ID from token");
                }
            } else {
                log.warn("No Authorization header or invalid format");
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting current pegawai: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or (hasRole('USER') and #userId == authentication.principal.id)")
    public ResponseEntity<PegawaiResponse> getPegawaiByUserId(@PathVariable Long userId, HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                String actualToken = token.substring(7);
                
                // Try to get pegawai from token
                Pegawai pegawai = authService.getPegawaiFromToken(actualToken);
                if (pegawai != null && pegawai.getId().equals(userId)) {
                    Optional<PegawaiResponse> pegawaiResponseOpt = pegawaiService.getPegawaiById(pegawai.getId());
                    if (pegawaiResponseOpt.isPresent()) {
                        return ResponseEntity.ok(pegawaiResponseOpt.get());
                    }
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting pegawai by user id: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<PegawaiResponse> getPegawaiByUsername(@PathVariable String username) {
        try {
            Optional<PegawaiResponse> pegawaiOpt = pegawaiService.getPegawaiByUsername(username);
            if (pegawaiOpt.isPresent()) {
                return ResponseEntity.ok(pegawaiOpt.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error getting pegawai by username: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<List<PegawaiResponse>> getPegawaiByStatus(@PathVariable String status) {
        try {
            Boolean isActive = "active".equalsIgnoreCase(status) || "true".equalsIgnoreCase(status);
            List<PegawaiResponse> pegawaiList = pegawaiService.getPegawaiByStatus(isActive);
            return ResponseEntity.ok(pegawaiList);
        } catch (IllegalArgumentException e) {
            log.error("Invalid status: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting pegawai by status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/jabatan/{jabatan}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<List<PegawaiResponse>> getPegawaiByJabatan(@PathVariable String jabatan) {
        try {
            List<PegawaiResponse> pegawaiList = pegawaiService.getPegawaiByJabatan(jabatan);
            return ResponseEntity.ok(pegawaiList);
        } catch (Exception e) {
            log.error("Error getting pegawai by jabatan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or hasRole('USER')")
    public ResponseEntity<List<PegawaiResponse>> getActivePegawai() {
        try {
            List<PegawaiResponse> pegawaiList = pegawaiService.getPegawaiByStatus(true);
            return ResponseEntity.ok(pegawaiList);
        } catch (Exception e) {
            log.error("Error getting active pegawai: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<List<PegawaiResponse>> searchPegawai(@RequestParam String keyword) {
        try {
            List<PegawaiResponse> pegawaiList = pegawaiService.searchPegawai(keyword);
            return ResponseEntity.ok(pegawaiList);
        } catch (Exception e) {
            log.error("Error searching pegawai: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(consumes = "application/json")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> createPegawai(@Valid @RequestBody PegawaiRequest request) {
        try {
            PegawaiResponse pegawai = pegawaiService.createPegawai(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(pegawai);
        } catch (RuntimeException e) {
            log.error("Error creating pegawai: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Error creating pegawai", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Terjadi kesalahan sistem");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<PegawaiResponse> createPegawaiWithFile(
            @RequestPart("data") @Valid PegawaiRequest request,
            @RequestPart(value = "foto_karyawan", required = false) MultipartFile file) {
        try {
            // Handle file upload here if needed
            if (file != null && !file.isEmpty()) {
                // Process file upload logic
                // For now, we'll just set the filename
                request.setFotoKaryawan(file.getOriginalFilename());
            }
            
            PegawaiResponse pegawai = pegawaiService.createPegawai(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(pegawai);
        } catch (RuntimeException e) {
            log.error("Error creating pegawai with file: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error creating pegawai with file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('pegawai.update') or (hasRole('USER') and #id == authentication.principal.id)")
    public ResponseEntity<PegawaiResponse> updatePegawai(
            @PathVariable Long id, 
            @Valid @RequestBody UpdatePegawaiRequest request) {
        try {
            PegawaiResponse pegawai = pegawaiService.updatePegawai(id, request);
            return ResponseEntity.ok(pegawai);
        } catch (RuntimeException e) {
            log.error("Error updating pegawai: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating pegawai", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/self-update")
    @PreAuthorize("hasRole('USER') and #id == authentication.principal.id")
    public ResponseEntity<?> selfUpdatePegawai(
            @PathVariable Long id, 
            @Valid @RequestBody SelfUpdatePegawaiRequest request) {
        try {
            PegawaiResponse pegawai = pegawaiService.selfUpdatePegawai(id, request);
            return ResponseEntity.ok(pegawai);
        } catch (RuntimeException e) {
            log.error("Error self-updating pegawai: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Error self-updating pegawai", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Terjadi kesalahan sistem");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('pegawai.delete')")
    public ResponseEntity<Void> deletePegawai(@PathVariable Long id) {
        try {
            pegawaiService.deletePegawai(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting pegawai: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting pegawai", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/pemilihan/{pemilihanId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PegawaiResponse> assignPemilihanToPegawai(
            @PathVariable Long id, 
            @PathVariable Long pemilihanId) {
        try {
            PegawaiResponse pegawai = pegawaiService.assignPemilihanToPegawai(id, pemilihanId);
            return ResponseEntity.ok(pegawai);
        } catch (RuntimeException e) {
            log.error("Error assigning pemilihan to pegawai: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error assigning pemilihan to pegawai", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}/pemilihan/{pemilihanId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PegawaiResponse> removePemilihanFromPegawai(
            @PathVariable Long id, 
            @PathVariable Long pemilihanId) {
        try {
            PegawaiResponse pegawai = pegawaiService.removePemilihanFromPegawai(id, pemilihanId);
            return ResponseEntity.ok(pegawai);
        } catch (RuntimeException e) {
            log.error("Error removing pemilihan from pegawai: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error removing pemilihan from pegawai", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/exists/username/{username}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Map<String, Boolean>> checkUsernameExists(@PathVariable String username) {
        try {
            boolean exists = pegawaiService.existsByUsername(username);
            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking username existence: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/exists/email/{email}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@PathVariable String email) {
        try {
            boolean exists = pegawaiService.existsByEmail(email);
            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking email existence: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> getPegawaiStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPegawai", pegawaiService.getTotalPegawai());
            stats.put("totalActivePegawai", pegawaiService.getTotalActivePegawai());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting pegawai stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/recalculate-tps")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> recalculateTotalTps() {
        try {
            pegawaiService.recalculateAllTotalTps();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Total TPS berhasil dihitung ulang untuk semua pegawai");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error recalculating total TPS: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Gagal menghitung ulang total TPS");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/map-locations")
    @PreAuthorize("hasAuthority('lokasi-pegawai.read')")
    public ResponseEntity<List<PegawaiResponse>> getPegawaiMapLocations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String nama,
            @RequestParam(required = false) String provinsi,
            @RequestParam(required = false) String kota,
            @RequestParam(required = false) String kecamatan,
            @RequestParam(required = false) String jabatan,
            @RequestParam(required = false) String status) {
        try {
            List<PegawaiResponse> pegawaiList = pegawaiService.getPegawaiWithLocationData(
                search, nama, provinsi, kota, kecamatan, jabatan, status);
            return ResponseEntity.ok(pegawaiList);
        } catch (Exception e) {
            log.error("Error getting pegawai map locations: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or (hasRole('USER') and #id == authentication.principal.id)")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Current password and new password are required"));
            }
            
            PegawaiResponse updatedPegawai = pegawaiService.resetPassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password berhasil diubah", "pegawai", updatedPegawai));
        } catch (RuntimeException e) {
            log.error("Error resetting pegawai password: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error resetting pegawai password", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Terjadi kesalahan saat mengubah password"));
        }    
    }
}
