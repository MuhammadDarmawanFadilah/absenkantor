package com.shadcn.backend.service;

import com.shadcn.backend.dto.JenisCutiRequestDto;
import com.shadcn.backend.dto.JenisCutiResponseDto;
import com.shadcn.backend.model.JenisCuti;
import com.shadcn.backend.repository.JenisCutiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JenisCutiService {
    
    private final JenisCutiRepository jenisCutiRepository;
    
    public Page<JenisCutiResponseDto> getAllJenisCuti(String search, Pageable pageable) {
        Page<JenisCuti> jenisCutis;
        
        if (search != null && !search.trim().isEmpty()) {
            jenisCutis = jenisCutiRepository.findBySearchAndActive(search.trim(), pageable);
        } else {
            // Only return active jenis cuti for admin list (to hide soft-deleted records)
            jenisCutis = jenisCutiRepository.findByIsActive(true, pageable);
        }
        
        return jenisCutis.map(this::convertToDto);
    }
    
    public List<JenisCutiResponseDto> getAllActiveJenisCuti() {
        int currentYear = java.time.LocalDate.now().getYear();
        log.debug("Mengambil jenis cuti aktif untuk tahun: {}", currentYear);
        
        // Get jenis cuti that have PegawaiCuti records for current year
        List<JenisCuti> jenisCutiList = jenisCutiRepository.findActiveJenisCutiForCurrentYear(currentYear);
        log.debug("Ditemukan {} jenis cuti untuk tahun {}", jenisCutiList.size(), currentYear);
        
        return jenisCutiList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public JenisCuti findById(Long id) {
        return jenisCutiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis cuti tidak ditemukan"));
    }
    
    public JenisCutiResponseDto getJenisCutiById(Long id) {
        JenisCuti jenisCuti = jenisCutiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis cuti tidak ditemukan"));
        return convertToDto(jenisCuti);
    }
    
    public JenisCutiResponseDto createJenisCuti(JenisCutiRequestDto request) {
        // Check if nama cuti already exists
        if (jenisCutiRepository.findByNamaCutiAndIsActive(request.getNamaCuti(), true).isPresent()) {
            throw new RuntimeException("Nama cuti sudah ada");
        }
        
        JenisCuti jenisCuti = JenisCuti.builder()
                .namaCuti(request.getNamaCuti())
                .deskripsi(request.getDeskripsi())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        
        JenisCuti saved = jenisCutiRepository.save(jenisCuti);
        log.info("Created new jenis cuti: {}", saved.getNamaCuti());
        
        return convertToDto(saved);
    }
    
    public JenisCutiResponseDto updateJenisCuti(Long id, JenisCutiRequestDto request) {
        JenisCuti jenisCuti = jenisCutiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis cuti tidak ditemukan"));
        
        // Check if nama cuti already exists (excluding current record)
        if (jenisCutiRepository.existsByNamaCutiAndIdNotAndIsActive(request.getNamaCuti(), id)) {
            throw new RuntimeException("Nama cuti sudah ada");
        }
        
        jenisCuti.setNamaCuti(request.getNamaCuti());
        jenisCuti.setDeskripsi(request.getDeskripsi());
        if (request.getIsActive() != null) {
            jenisCuti.setIsActive(request.getIsActive());
        }
        
        JenisCuti updated = jenisCutiRepository.save(jenisCuti);
        log.info("Updated jenis cuti: {}", updated.getNamaCuti());
        
        return convertToDto(updated);
    }
    
    public void deleteJenisCuti(Long id) {
        JenisCuti jenisCuti = jenisCutiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis cuti tidak ditemukan"));
        
        // Check if this jenis cuti is being used by any cuti records
        // If yes, just deactivate it (soft delete)
        // If no, we could do hard delete, but for consistency we'll do soft delete
        jenisCuti.setIsActive(false);
        jenisCutiRepository.save(jenisCuti);
        
        log.info("Soft deleted jenis cuti: {}", jenisCuti.getNamaCuti());
    }
    
    public JenisCutiResponseDto toggleJenisCutiStatus(Long id) {
        JenisCuti jenisCuti = jenisCutiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis cuti tidak ditemukan"));
        
        // Toggle the active status
        jenisCuti.setIsActive(!jenisCuti.getIsActive());
        JenisCuti updated = jenisCutiRepository.save(jenisCuti);
        
        log.info("Toggled jenis cuti status: {} - {}", updated.getNamaCuti(), updated.getIsActive());
        
        return convertToDto(updated);
    }
    
    public void seedTestData() {
        // Check if data already exists
        List<JenisCuti> existing = jenisCutiRepository.findByIsActiveOrderByNamaCuti(true);
        if (!existing.isEmpty()) {
            log.info("Jenis cuti data already exists, skipping seed");
            return;
        }
        
        // Create test data
        String[][] testData = {
            {"Cuti Tahunan", "Cuti tahunan sesuai undang-undang"},
            {"Cuti Sakit", "Cuti karena sakit dengan surat dokter"},
            {"Cuti Melahirkan", "Cuti melahirkan untuk karyawan wanita"},
            {"Cuti Menikah", "Cuti untuk keperluan pernikahan"},
            {"Cuti Kematian Keluarga", "Cuti karena kematian anggota keluarga"},
            {"Cuti Ibadah Haji", "Cuti untuk menunaikan ibadah haji"},
            {"Cuti Besar", "Cuti besar setelah 6 tahun bekerja"},
            {"Cuti Tidak Berbayar", "Cuti tanpa gaji untuk keperluan pribadi"}
        };
        
        for (String[] data : testData) {
            try {
                JenisCuti jenisCuti = JenisCuti.builder()
                        .namaCuti(data[0])
                        .deskripsi(data[1])
                        .isActive(true)
                        .build();
                
                jenisCutiRepository.save(jenisCuti);
                log.info("Created jenis cuti: {}", data[0]);
            } catch (Exception e) {
                log.error("Error creating jenis cuti {}: {}", data[0], e.getMessage());
            }
        }
        
        log.info("Test data seeding completed");
    }
    
    private JenisCutiResponseDto convertToDto(JenisCuti jenisCuti) {
        return JenisCutiResponseDto.builder()
                .id(jenisCuti.getId())
                .namaCuti(jenisCuti.getNamaCuti())
                .deskripsi(jenisCuti.getDeskripsi())
                .isActive(jenisCuti.getIsActive())
                .createdAt(jenisCuti.getCreatedAt())
                .updatedAt(jenisCuti.getUpdatedAt())
                .build();
    }
}
