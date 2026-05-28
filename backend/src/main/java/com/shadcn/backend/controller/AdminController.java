package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PagedResponse;
import com.shadcn.backend.dto.PegawaiResponse;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final PegawaiRepository pegawaiRepository;
    
    @GetMapping("/master-data/pegawai")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<PagedResponse<PegawaiResponse>> getAllPegawai(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "namaLengkap") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Pegawai> pegawaiPage = pegawaiRepository.findAll(pageable);
        
        List<PegawaiResponse> content = pegawaiPage.getContent().stream()
                .map(this::convertToPegawaiResponse)
                .collect(Collectors.toList());
        
        PagedResponse<PegawaiResponse> response = new PagedResponse<>();
        response.setContent(content);
        response.setPage(pegawaiPage.getNumber());
        response.setSize(pegawaiPage.getSize());
        response.setTotalElements(pegawaiPage.getTotalElements());
        response.setTotalPages(pegawaiPage.getTotalPages());
        response.setFirst(pegawaiPage.isFirst());
        response.setLast(pegawaiPage.isLast());
        response.setEmpty(pegawaiPage.isEmpty());
        
        return ResponseEntity.ok(response);
    }
    
    private PegawaiResponse convertToPegawaiResponse(Pegawai pegawai) {
        return new PegawaiResponse(pegawai);
    }
}
