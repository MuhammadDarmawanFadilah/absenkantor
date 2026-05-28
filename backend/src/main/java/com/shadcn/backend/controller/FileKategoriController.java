package com.shadcn.backend.controller;

import com.shadcn.backend.dto.FileKategoriRequest;
import com.shadcn.backend.dto.FileKategoriResponse;
import com.shadcn.backend.service.FileKategoriService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/master-data/file-kategori")
@RequiredArgsConstructor
@Slf4j
public class FileKategoriController {
    
    private final FileKategoriService service;
    
    @GetMapping
    @PreAuthorize("hasAuthority('kategori-file.read')")
    public ResponseEntity<Page<FileKategoriResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "sortOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        log.info("GET /api/admin/master-data/file-kategori - search: {}, isActive: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", 
                search, isActive, page, size, sortBy, sortDir);
        
        Page<FileKategoriResponse> result = service.findAll(search, isActive, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<FileKategoriResponse>> findAllActive() {
        log.info("GET /api/admin/master-data/file-kategori/active");
        List<FileKategoriResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<FileKategoriResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/master-data/file-kategori/{}", id);
        FileKategoriResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<FileKategoriResponse> create(@Valid @RequestBody FileKategoriRequest request) {
        log.info("POST /api/admin/master-data/file-kategori - {}", request);
        FileKategoriResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<FileKategoriResponse> update(@PathVariable Long id, @Valid @RequestBody FileKategoriRequest request) {
        log.info("PUT /api/admin/master-data/file-kategori/{} - {}", id, request);
        FileKategoriResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/master-data/file-kategori/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<FileKategoriResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/master-data/file-kategori/{}/toggle-active", id);
        FileKategoriResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
