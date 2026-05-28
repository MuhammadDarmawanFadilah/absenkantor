package com.shadcn.backend.controller;

import com.shadcn.backend.model.Jabatan;
import com.shadcn.backend.dto.JabatanRequest;
import com.shadcn.backend.dto.JabatanResponse;
import com.shadcn.backend.service.JabatanService;
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
@RequestMapping("/api/admin/master-data/jabatan")
@RequiredArgsConstructor
@Slf4j
public class JabatanController {
    
    private final JabatanService jabatanService;
    
    @GetMapping
    public ResponseEntity<Page<JabatanResponse>> getAllJabatan(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "sortOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            Page<JabatanResponse> jabatanPage = jabatanService.getAllJabatanPaged(search, page, size, sortBy, sortDir);
            return ResponseEntity.ok(jabatanPage);
        } catch (Exception e) {
            log.error("Error fetching jabatan: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAuthority('jabatan.read')")
    public ResponseEntity<List<Jabatan>> getActiveJabatan() {
        try {
            List<Jabatan> activeJabatan = jabatanService.getAllActiveJabatan();
            return ResponseEntity.ok(activeJabatan);
        } catch (Exception e) {
            log.error("Error fetching active jabatan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('jabatan.read')")
    public ResponseEntity<List<Jabatan>> getAllJabatanList() {
        try {
            List<Jabatan> jabatanList = jabatanService.getAllJabatan();
            return ResponseEntity.ok(jabatanList);
        } catch (Exception e) {
            log.error("Error fetching all jabatan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    // @PreAuthorize("hasAuthority('jabatan.read')")
    public ResponseEntity<JabatanResponse> getJabatanById(@PathVariable Long id) {
        try {
            return jabatanService.getJabatanById(id)
                .map(jabatan -> ResponseEntity.ok(jabatan))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching jabatan by id {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    // @PreAuthorize("hasAuthority('jabatan.create')")
    public ResponseEntity<?> createJabatan(@Valid @RequestBody JabatanRequest request) {
        try {
            JabatanResponse createdJabatan = jabatanService.createJabatan(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdJabatan);
        } catch (RuntimeException e) {
            log.error("Error creating jabatan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating jabatan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @PutMapping("/{id}")
    // @PreAuthorize("hasAuthority('jabatan.update')")
    public ResponseEntity<?> updateJabatan(@PathVariable Long id, @Valid @RequestBody JabatanRequest request) {
        try {
            JabatanResponse updatedJabatan = jabatanService.updateJabatan(id, request);
            return ResponseEntity.ok(updatedJabatan);
        } catch (RuntimeException e) {
            log.error("Error updating jabatan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating jabatan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @DeleteMapping("/{id}")
    // @PreAuthorize("hasAuthority('jabatan.delete')")
    public ResponseEntity<?> deleteJabatan(@PathVariable Long id) {
        try {
            jabatanService.deleteJabatan(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting jabatan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting jabatan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @PatchMapping("/{id}/toggle-active")
    // @PreAuthorize("hasAuthority('jabatan.update')")
    public ResponseEntity<?> toggleJabatanStatus(@PathVariable Long id) {
        try {
            JabatanResponse jabatan = jabatanService.toggleJabatanStatus(id);
            return ResponseEntity.ok(jabatan);
        } catch (RuntimeException e) {
            log.error("Error toggling jabatan status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error toggling jabatan status: {}", e.getMessage());
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
