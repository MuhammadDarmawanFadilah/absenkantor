package com.shadcn.backend.controller;

import com.shadcn.backend.entity.LokasiKantor;
import com.shadcn.backend.repository.LokasiKantorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/master-data/lokasi-kantor")
@CrossOrigin(origins = "*")
public class LokasiKantorController {

    @Autowired
    private LokasiKantorRepository lokasiKantorRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<LokasiKantor>> getAllLokasiKantor(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "namaLokasi") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        
        Sort sort = sortDirection.equals("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        
        Page<LokasiKantor> lokasiKantorPage = lokasiKantorRepository.findAll(pageRequest);
        return ResponseEntity.ok(lokasiKantorPage);
    }

    @GetMapping("/all")
    public ResponseEntity<List<LokasiKantor>> getAllLokasiKantorList() {
        List<LokasiKantor> lokasiKantorList = lokasiKantorRepository.findAll();
        return ResponseEntity.ok(lokasiKantorList);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LokasiKantor> getLokasiKantorById(@PathVariable Long id) {
        return lokasiKantorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LokasiKantor> createLokasiKantor(@RequestBody LokasiKantor lokasiKantor) {
        LokasiKantor savedLokasiKantor = lokasiKantorRepository.save(lokasiKantor);
        return ResponseEntity.ok(savedLokasiKantor);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LokasiKantor> updateLokasiKantor(@PathVariable Long id, @RequestBody LokasiKantor lokasiKantor) {
        if (lokasiKantorRepository.existsById(id)) {
            lokasiKantor.setId(id);
            LokasiKantor updatedLokasiKantor = lokasiKantorRepository.save(lokasiKantor);
            return ResponseEntity.ok(updatedLokasiKantor);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLokasiKantor(@PathVariable Long id) {
        if (lokasiKantorRepository.existsById(id)) {
            lokasiKantorRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
