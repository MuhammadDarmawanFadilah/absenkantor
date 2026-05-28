package com.shadcn.backend.service;

import com.shadcn.backend.repository.WilayahKodeposRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WilayahKodeposService {
    
    private final WilayahKodeposRepository wilayahKodeposRepository;
    
    public String getKodeposByKodeWilayah(String kodeWilayah) {
        log.debug("Mencari kode pos untuk kode wilayah: {}", kodeWilayah);
        
        try {
            return wilayahKodeposRepository.findKodeposByKodeWilayah(kodeWilayah)
                    .orElse(null);
        } catch (Exception e) {
            log.error("Error fetching kodepos for kodeWilayah: {}", kodeWilayah, e);
            return null;
        }
    }
}
