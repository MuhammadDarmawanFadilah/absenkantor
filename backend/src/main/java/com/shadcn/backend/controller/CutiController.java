package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CutiApprovalDto;
import com.shadcn.backend.dto.CutiRequestDto;
import com.shadcn.backend.dto.CutiResponseDto;
import com.shadcn.backend.service.CutiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cuti")
@RequiredArgsConstructor
@Slf4j
public class CutiController {
    
    private final CutiService cutiService;
    
    @PostMapping("/ajukan")
    public ResponseEntity<List<CutiResponseDto>> ajukanCuti(
        @RequestParam Long pegawaiId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalDari,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalKe,
        @RequestParam(required = false) String tipeCuti, // CUTI or SAKIT
        @RequestParam(required = false) String jenisCuti, // optional for SAKIT
        @RequestParam String alasanCuti,
        @RequestParam(required = false) MultipartFile lampiranCuti
    ) {
        log.debug("Menerima request pengajuan cuti:");
        log.debug("- pegawaiId: {}", pegawaiId);
        log.debug("- tanggalDari: {}", tanggalDari);
        log.debug("- tanggalKe: {}", tanggalKe);
        log.debug("- tipeCuti: {}", tipeCuti);
        log.debug("- jenisCuti: {}", jenisCuti);
        log.debug("- alasanCuti: {}", alasanCuti);
        log.debug("- lampiranCuti: {}", lampiranCuti != null ? lampiranCuti.getOriginalFilename() : "null");
        
        try {
            CutiRequestDto request = CutiRequestDto.builder()
                .tanggalDari(tanggalDari)
                .tanggalKe(tanggalKe)
                .tipeCuti(tipeCuti != null ? tipeCuti : "CUTI")
                .jenisCutiId(jenisCuti != null && !jenisCuti.isEmpty() ? Long.parseLong(jenisCuti) : null)
                .alasanCuti(alasanCuti)
                .build();
            
            log.debug("CutiRequestDto dibuat: {}", request);
            
            List<CutiResponseDto> result = cutiService.ajukanCuti(pegawaiId, request, lampiranCuti);
            log.debug("Pengajuan cuti berhasil: {} records", result.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error saat pengajuan cuti: ", e);
            throw e;
        }
    }
    
    @PutMapping("/{cutiId}/approve")
    public ResponseEntity<CutiResponseDto> approveCuti(
        @PathVariable Long cutiId,
        @RequestParam Long adminId,
        @RequestBody CutiApprovalDto approvalDto
    ) {
        CutiResponseDto result = cutiService.approveCuti(cutiId, adminId, approvalDto);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/pegawai/{pegawaiId}")
    public ResponseEntity<Page<CutiResponseDto>> getCutiByPegawai(
        @PathVariable Long pegawaiId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CutiResponseDto> result = cutiService.getCutiByPegawai(pegawaiId, pageable);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping
    public ResponseEntity<Page<CutiResponseDto>> getAllCuti(
        @RequestParam(required = false) Long pegawaiId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String jenisCuti,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CutiResponseDto> result = cutiService.getAllCutiWithFilters(
            pegawaiId, status, jenisCuti, startDate, endDate, pageable);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/stats/{pegawaiId}")
    public ResponseEntity<Map<String, Integer>> getCutiStats(@PathVariable Long pegawaiId) {
        Map<String, Integer> stats = cutiService.getCutiStats(pegawaiId);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/check-leave-today/{pegawaiId}")
    public ResponseEntity<Map<String, Boolean>> checkLeaveToday(@PathVariable Long pegawaiId) {
        boolean isOnLeave = cutiService.isOnApprovedLeaveToday(pegawaiId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isOnApprovedLeave", isOnLeave);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{cutiId}/download-attachment")
    public ResponseEntity<Resource> downloadAttachment(
        @PathVariable Long cutiId,
        @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            log.debug("Download attachment request for cuti ID: {} with auth: {}", cutiId, authHeader != null ? "present" : "missing");
            Resource resource = cutiService.getAttachmentResource(cutiId);
            String filename = cutiService.getAttachmentFilename(cutiId);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
        } catch (Exception e) {
            log.error("Error downloading attachment for cuti ID: {}", cutiId, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{cutiId}/view-attachment")
    public ResponseEntity<Resource> viewAttachment(
        @PathVariable Long cutiId,
        @RequestParam(value = "token", required = false) String token) {
        try {
            log.debug("View attachment request for cuti ID: {} with token: {}", cutiId, token != null ? "present" : "missing");
            Resource resource = cutiService.getAttachmentResource(cutiId);
            String filename = cutiService.getAttachmentFilename(cutiId);
            
            // Determine content type based on file extension
            String contentType = determineContentType(filename);
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
        } catch (Exception e) {
            log.error("Error viewing attachment for cuti ID: {}", cutiId, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    private String determineContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> "application/octet-stream";
        };
    }
}
