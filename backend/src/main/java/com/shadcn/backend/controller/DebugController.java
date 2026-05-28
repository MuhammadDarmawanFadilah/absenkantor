package com.shadcn.backend.controller;

import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.PegawaiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {
    
    @Autowired
    private PegawaiRepository pegawaiRepository;
    
    @GetMapping("/pegawai/{id}/photo")
    public ResponseEntity<Map<String, Object>> debugPegawaiPhoto(@PathVariable Long id) {
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(id);
        
        Map<String, Object> result = new HashMap<>();
        
        if (pegawaiOpt.isPresent()) {
            Pegawai pegawai = pegawaiOpt.get();
            
            result.put("id", pegawai.getId());
            result.put("username", pegawai.getUsername());
            result.put("namaLengkap", pegawai.getNamaLengkap());
            result.put("fotoKaryawan", pegawai.getFotoKaryawan());
            result.put("photoUrl", pegawai.getPhotoUrl());
            result.put("effectivePhoto", pegawai.getPhotoUrl() != null ? pegawai.getPhotoUrl() : pegawai.getFotoKaryawan());
            result.put("found", true);
            
            // Additional debug info
            result.put("debug", Map.of(
                "hasFotoKaryawan", pegawai.getFotoKaryawan() != null,
                "hasPhotoUrl", pegawai.getPhotoUrl() != null,
                "fieldsMatch", 
                    pegawai.getFotoKaryawan() != null && pegawai.getPhotoUrl() != null && 
                    pegawai.getFotoKaryawan().equals(pegawai.getPhotoUrl())
            ));
            
        } else {
            result.put("found", false);
            result.put("message", "Pegawai not found");
        }
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/pegawai/{id}/sync-photo")
    public ResponseEntity<Map<String, Object>> syncPegawaiPhoto(@PathVariable Long id) {
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(id);
        
        Map<String, Object> result = new HashMap<>();
        
        if (pegawaiOpt.isPresent()) {
            Pegawai pegawai = pegawaiOpt.get();
            
            String before_fotoKaryawan = pegawai.getFotoKaryawan();
            String before_photoUrl = pegawai.getPhotoUrl();
            
            // Sync logic: use photoUrl as primary, update fotoKaryawan
            if (pegawai.getPhotoUrl() != null) {
                pegawai.setFotoKaryawan(pegawai.getPhotoUrl());
            } else if (pegawai.getFotoKaryawan() != null) {
                pegawai.setPhotoUrl(pegawai.getFotoKaryawan());
            }
            
            pegawaiRepository.save(pegawai);
            
            result.put("success", true);
            result.put("before", Map.of(
                "fotoKaryawan", before_fotoKaryawan,
                "photoUrl", before_photoUrl
            ));
            result.put("after", Map.of(
                "fotoKaryawan", pegawai.getFotoKaryawan(),
                "photoUrl", pegawai.getPhotoUrl()
            ));
            
        } else {
            result.put("success", false);
            result.put("message", "Pegawai not found");
        }
        
        return ResponseEntity.ok(result);
    }
}