package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PegawaiCutiRequestDto;
import com.shadcn.backend.dto.PegawaiCutiResponseDto;
import com.shadcn.backend.dto.PegawaiCutiQuotaDto;
import com.shadcn.backend.service.PegawaiCutiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pegawai-cuti")
@RequiredArgsConstructor
public class PegawaiCutiController {
    
    private final PegawaiCutiService pegawaiCutiService;
    
    @GetMapping("/pegawai/{pegawaiId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or (hasRole('ALUMNI') and #pegawaiId == authentication.principal.id)")
    public ResponseEntity<List<PegawaiCutiResponseDto>> getPegawaiCutiByPegawaiId(@PathVariable Long pegawaiId) {
        List<PegawaiCutiResponseDto> result = pegawaiCutiService.getPegawaiCutiByPegawaiId(pegawaiId);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/pegawai/{pegawaiId}/tahun/{tahun}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or (hasRole('ALUMNI') and #pegawaiId == authentication.principal.id)")
    public ResponseEntity<List<PegawaiCutiResponseDto>> getPegawaiCutiByPegawaiIdAndTahun(
            @PathVariable Long pegawaiId, 
            @PathVariable Integer tahun) {
        List<PegawaiCutiResponseDto> result = pegawaiCutiService.getPegawaiCutiByPegawaiIdAndTahun(pegawaiId, tahun);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/pegawai/{pegawaiId}/quota")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or (hasRole('ALUMNI') and #pegawaiId == authentication.principal.id)")
    public ResponseEntity<List<PegawaiCutiQuotaDto>> getPegawaiCutiQuota(@PathVariable Long pegawaiId) {
        List<PegawaiCutiQuotaDto> result = pegawaiCutiService.getPegawaiCutiQuotaCurrentYear(pegawaiId);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/pegawai/{pegawaiId}/quota/tahun/{tahun}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or (hasRole('ALUMNI') and #pegawaiId == authentication.principal.id)")
    public ResponseEntity<List<PegawaiCutiQuotaDto>> getPegawaiCutiQuotaByTahun(
            @PathVariable Long pegawaiId, 
            @PathVariable Integer tahun) {
        List<PegawaiCutiQuotaDto> result = pegawaiCutiService.getPegawaiCutiQuota(pegawaiId, tahun);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<PegawaiCutiResponseDto> createOrUpdatePegawaiCuti(@Valid @RequestBody PegawaiCutiRequestDto request) {
        PegawaiCutiResponseDto result = pegawaiCutiService.createOrUpdatePegawaiCuti(request);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/pegawai/{pegawaiId}/batch")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Void> savePegawaiCutiList(
            @PathVariable Long pegawaiId,
            @Valid @RequestBody List<PegawaiCutiRequestDto> cutiList) {
        pegawaiCutiService.savePegawaiCutiList(pegawaiId, cutiList);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/pegawai/{pegawaiId}/jenis-cuti/{jenisCutiId}/tahun/{tahun}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Void> deletePegawaiCuti(
            @PathVariable Long pegawaiId,
            @PathVariable Long jenisCutiId,
            @PathVariable Integer tahun) {
        pegawaiCutiService.deletePegawaiCuti(pegawaiId, jenisCutiId, tahun);
        return ResponseEntity.ok().build();
    }
}
