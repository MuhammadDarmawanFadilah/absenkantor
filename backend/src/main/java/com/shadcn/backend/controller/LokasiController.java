package com.shadcn.backend.controller;

import com.shadcn.backend.dto.LokasiRequest;
import com.shadcn.backend.dto.LokasiResponse;
import com.shadcn.backend.service.LokasiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping({"/api/admin/master-data/lokasi", "/api/admin/master-data/lokasi-kantor"})
@RequiredArgsConstructor
@Slf4j
public class LokasiController {
    
    private final LokasiService lokasiService;
    
    @GetMapping
    // @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> getAllLokasi(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "namaLokasi") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            log.info("Getting all lokasi with search: {}, page: {}, size: {}", search, page, size);
            
            // Try to fetch data from service
            Page<LokasiResponse> lokasiPage = lokasiService.getAllLokasiPaged(search, page, size, sortBy, sortDir);
            log.info("Successfully fetched {} lokasi records", lokasiPage.getTotalElements());
            return ResponseEntity.ok(lokasiPage);
            
        } catch (Exception e) {
            log.error("Error fetching lokasi: {}", e.getMessage(), e);
            
            // Return a fallback response with error details for debugging
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("content", java.util.List.of());
            errorResponse.put("totalElements", 0);
            errorResponse.put("totalPages", 0);
            errorResponse.put("currentPage", page);
            errorResponse.put("size", size);
            errorResponse.put("error", "Database error: " + e.getMessage());
            errorResponse.put("message", "No data available due to database connection issue");
            
            return ResponseEntity.ok(errorResponse);
        }
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or hasRole('USER')")
    public ResponseEntity<List<LokasiResponse>> getActiveLokasi() {
        try {
            List<LokasiResponse> activeLokasi = lokasiService.getAllActiveLokasi();
            return ResponseEntity.ok(activeLokasi);
        } catch (Exception e) {
            log.error("Error fetching active lokasi: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<List<LokasiResponse>> getAllLokasiList() {
        try {
            List<LokasiResponse> lokasiList = lokasiService.getAllLokasi();
            return ResponseEntity.ok(lokasiList);
        } catch (Exception e) {
            log.error("Error fetching all lokasi: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<LokasiResponse> getLokasiById(@PathVariable Long id) {
        try {
            return lokasiService.getLokasiById(id)
                .map(lokasi -> ResponseEntity.ok(lokasi))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching lokasi by id {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    // @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> createLokasi(@Valid @RequestBody LokasiRequest request) {
        try {
            log.info("Creating lokasi: {}", request.getNamaLokasi());
            LokasiResponse createdLokasi = lokasiService.createLokasi(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLokasi);
        } catch (RuntimeException e) {
            log.error("Error creating lokasi: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating lokasi: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @PutMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> updateLokasi(@PathVariable Long id, @Valid @RequestBody LokasiRequest request) {
        try {
            LokasiResponse updatedLokasi = lokasiService.updateLokasi(id, request);
            return ResponseEntity.ok(updatedLokasi);
        } catch (RuntimeException e) {
            log.error("Error updating lokasi: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating lokasi: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> deleteLokasi(@PathVariable Long id) {
        try {
            lokasiService.deleteLokasi(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting lokasi: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting lokasi: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> toggleLokasiStatus(@PathVariable Long id) {
        try {
            LokasiResponse updatedLokasi = lokasiService.toggleLokasiStatus(id);
            return ResponseEntity.ok(updatedLokasi);
        } catch (RuntimeException e) {
            log.error("Error toggling lokasi status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error toggling lokasi status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    // Error response class
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}
