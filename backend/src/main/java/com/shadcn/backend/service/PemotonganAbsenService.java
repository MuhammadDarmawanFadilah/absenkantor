package com.shadcn.backend.service;

import com.shadcn.backend.dto.PemotonganAbsenRequest;
import com.shadcn.backend.entity.PemotonganAbsen;
import com.shadcn.backend.repository.PemotonganAbsenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PemotonganAbsenService {
    
    private final PemotonganAbsenRepository pemotonganAbsenRepository;
    
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    
    public List<Map<String, Object>> getAllPemotonganAbsen() {
        log.debug("Mengambil semua data pemotongan absen");
        
        List<PemotonganAbsen> pemotonganAbsens = pemotonganAbsenRepository.findAllActiveOrderByKode();
        
        return pemotonganAbsens.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public Map<String, Object> getPemotonganAbsenById(Long id) {
        log.debug("Mengambil pemotongan absen dengan ID: {}", id);
        
        PemotonganAbsen pemotonganAbsen = pemotonganAbsenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pemotongan absen tidak ditemukan"));
        
        return mapToResponse(pemotonganAbsen);
    }
    
    public Map<String, Object> updatePemotonganAbsen(Long id, PemotonganAbsenRequest request) {
        log.debug("Mengupdate pemotongan absen dengan ID: {}", id);
        
        PemotonganAbsen pemotonganAbsen = pemotonganAbsenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pemotongan absen tidak ditemukan"));
        
        // Update only editable fields
        pemotonganAbsen.setNama(request.getNama());
        pemotonganAbsen.setDeskripsi(request.getDeskripsi());
        pemotonganAbsen.setPersentase(request.getPersentase());
        
        PemotonganAbsen saved = pemotonganAbsenRepository.save(pemotonganAbsen);
        
        log.debug("Pemotongan absen berhasil diupdate: {}", saved.getKode());
        
        return mapToResponse(saved);
    }
    
    public void resetToDefaultData() {
        log.debug("Mereset data pemotongan absen ke pengaturan default");
        
        // Update existing records to default values
        updateToDefaultIfExists("TL0", "Terlambat Masuk 0", "Terlambat Masuk 1 - 30 menit", BigDecimal.valueOf(0.00));
        updateToDefaultIfExists("TL1", "Terlambat Masuk 1", "Terlambat Masuk 31 - 60 menit", BigDecimal.valueOf(0.50));
        updateToDefaultIfExists("TL2", "Terlambat Masuk 2", "Terlambat Masuk 61 - 90 menit", BigDecimal.valueOf(1.25));
        updateToDefaultIfExists("TL3", "Terlambat Masuk 3", "Terlambat Masuk lebih dari 90 menit", BigDecimal.valueOf(2.50));
        updateToDefaultIfExists("PSW1", "Pulang Cepat 1", "Pulang Cepat 1 - 30 menit", BigDecimal.valueOf(0.50));
        updateToDefaultIfExists("PSW2", "Pulang Cepat 2", "Pulang Cepat 31 - 60 menit", BigDecimal.valueOf(1.25));
        updateToDefaultIfExists("PSW3", "Pulang Cepat 3", "Pulang Cepat lebih dari 61 menit", BigDecimal.valueOf(2.50));
        updateToDefaultIfExists("LAM", "Lupa Absen Masuk", "Lupa Absen Masuk", BigDecimal.valueOf(2.50));
        updateToDefaultIfExists("LAP", "Lupa Absen Pulang", "Lupa Absen Pulang", BigDecimal.valueOf(2.50));
        updateToDefaultIfExists("TA", "Tidak Absen", "Tidak Absen", BigDecimal.valueOf(5.00));
        
        log.debug("Data pemotongan absen berhasil direset ke pengaturan default");
    }
    
    private void updateToDefaultIfExists(String kode, String nama, String deskripsi, BigDecimal persentase) {
        Optional<PemotonganAbsen> existing = pemotonganAbsenRepository.findByKodeAndIsActive(kode, true);
        if (existing.isPresent()) {
            PemotonganAbsen pemotonganAbsen = existing.get();
            pemotonganAbsen.setNama(nama);
            pemotonganAbsen.setDeskripsi(deskripsi);
            pemotonganAbsen.setPersentase(persentase);
            pemotonganAbsenRepository.save(pemotonganAbsen);
            log.debug("Updated {} to default values", kode);
        } else {
            // Create new record if doesn't exist
            PemotonganAbsen pemotonganAbsen = PemotonganAbsen.builder()
                    .kode(kode)
                    .nama(nama)
                    .deskripsi(deskripsi)
                    .persentase(persentase)
                    .isActive(true)
                    .build();
            pemotonganAbsenRepository.save(pemotonganAbsen);
            log.debug("Created new default entry for {}", kode);
        }
    }
    
    private Map<String, Object> mapToResponse(PemotonganAbsen pemotonganAbsen) {
        return Map.of(
                "id", pemotonganAbsen.getId(),
                "kode", pemotonganAbsen.getKode(),
                "nama", pemotonganAbsen.getNama(),
                "deskripsi", pemotonganAbsen.getDeskripsi(),
                "persentase", pemotonganAbsen.getPersentase(),
                "isActive", pemotonganAbsen.getIsActive(),
                "createdAt", pemotonganAbsen.getCreatedAt().format(DATETIME_FORMATTER),
                "updatedAt", pemotonganAbsen.getUpdatedAt().format(DATETIME_FORMATTER)
        );
    }
}
