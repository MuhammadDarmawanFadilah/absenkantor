package com.shadcn.backend.controller;

import com.shadcn.backend.service.WilayahKodeposService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wilayah-kodepos")
@RequiredArgsConstructor
public class WilayahKodeposController {
    
    private final WilayahKodeposService wilayahKodeposService;
    
    @GetMapping("/kodepos/{kodeWilayah}")
    public ResponseEntity<String> getKodepos(@PathVariable String kodeWilayah) {
        String kodepos = wilayahKodeposService.getKodeposByKodeWilayah(kodeWilayah);
        
        if (kodepos != null) {
            return ResponseEntity.ok(kodepos);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
