package com.shadcn.backend.controller;

import com.shadcn.backend.dto.JenisCutiRequestDto;
import com.shadcn.backend.dto.JenisCutiResponseDto;
import com.shadcn.backend.service.JenisCutiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jenis-cuti")
@RequiredArgsConstructor
public class JenisCutiController {
    
    private final JenisCutiService jenisCutiService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Page<JenisCutiResponseDto>> getAllJenisCuti(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "namaCuti") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : 
                Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<JenisCutiResponseDto> result = jenisCutiService.getAllJenisCuti(search, pageable);
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<JenisCutiResponseDto>> getAllActiveJenisCuti() {
        List<JenisCutiResponseDto> result = jenisCutiService.getAllActiveJenisCuti();
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/seed-test-data")
    public ResponseEntity<String> seedTestData() {
        try {
            jenisCutiService.seedTestData();
            return ResponseEntity.ok("Test data seeded successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error seeding data: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<JenisCutiResponseDto> getJenisCutiById(@PathVariable Long id) {
        JenisCutiResponseDto result = jenisCutiService.getJenisCutiById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<JenisCutiResponseDto> createJenisCuti(@Valid @RequestBody JenisCutiRequestDto request) {
        JenisCutiResponseDto result = jenisCutiService.createJenisCuti(request);
        return ResponseEntity.ok(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<JenisCutiResponseDto> updateJenisCuti(
            @PathVariable Long id, 
            @Valid @RequestBody JenisCutiRequestDto request) {
        JenisCutiResponseDto result = jenisCutiService.updateJenisCuti(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Void> deleteJenisCuti(@PathVariable Long id) {
        jenisCutiService.deleteJenisCuti(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<JenisCutiResponseDto> toggleJenisCutiStatus(@PathVariable Long id) {
        JenisCutiResponseDto result = jenisCutiService.toggleJenisCutiStatus(id);
        return ResponseEntity.ok(result);
    }
}
