package com.shadcn.backend.service;

import com.pusher.rest.Pusher;
import com.shadcn.backend.dto.CutiApprovalDto;
import com.shadcn.backend.dto.CutiRequestDto;
import com.shadcn.backend.dto.CutiResponseDto;
import com.shadcn.backend.model.Cuti;
import com.shadcn.backend.model.JenisCuti;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.CutiRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CutiService {
    
    private final CutiRepository cutiRepository;
    private final PegawaiRepository pegawaiRepository;
    private final JenisCutiService jenisCutiService;
    
    @Value("${pusher.app.id}")
    private String pusherAppId;
    
    @Value("${pusher.app.key}")
    private String pusherAppKey;
    
    @Value("${pusher.app.secret}")
    private String pusherAppSecret;
    
    @Value("${pusher.app.cluster}")
    private String pusherAppCluster;
    
    @Value("${file.upload.directory:uploads/cuti}")
    private String uploadDirectory;
    
    private Pusher getPusher() {
        try {
            Pusher pusher = new Pusher(pusherAppId, pusherAppKey, pusherAppSecret);
            pusher.setCluster(pusherAppCluster);
            pusher.setEncrypted(true);
            log.debug("Pusher initialized with app ID: {}, cluster: {}", pusherAppId, pusherAppCluster);
            return pusher;
        } catch (Exception e) {
            log.error("Failed to initialize Pusher: {}", e.getMessage());
            throw new RuntimeException("Failed to initialize Pusher", e);
        }
    }
    
    @Transactional
    public List<CutiResponseDto> ajukanCuti(Long pegawaiId, CutiRequestDto request, MultipartFile file) {
        log.debug("Pengajuan cuti untuk pegawai ID: {}", pegawaiId);
        log.debug("Request: {}", request);
        
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
            .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        log.debug("Pegawai ditemukan: {} dengan izin cuti: {}", pegawai.getNamaLengkap(), pegawai.getIzinCuti());
        
        // Validate cuti quota
        int currentYear = LocalDate.now().getYear();
        Long cutiTerpakai = cutiRepository.countApprovedCutiByPegawaiAndYear(pegawai, currentYear);
        
        // Handle null or zero izinCuti - default to 12 if not set
        Integer pegawaiIzinCuti = pegawai.getIzinCuti();
        if (pegawaiIzinCuti == null || pegawaiIzinCuti <= 0) {
            pegawaiIzinCuti = 12; // Default cuti per year
            log.warn("Pegawai {} tidak memiliki izin cuti yang valid, menggunakan default 12", pegawai.getNamaLengkap());
        }
        
        int sisaCuti = pegawaiIzinCuti;
        
        log.debug("Tahun: {}, Cuti terpakai: {}, Sisa cuti: {}", currentYear, cutiTerpakai, sisaCuti);
        
        List<LocalDate> tanggalCutiList = request.getAllDates();
        log.debug("Tanggal cuti yang diajukan: {}", tanggalCutiList);
        
        if (cutiTerpakai + tanggalCutiList.size() > sisaCuti) {
            String errorMsg = "Kuota cuti tidak mencukupi. Sisa cuti: " + (sisaCuti - cutiTerpakai);
            log.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }
        
        // Check for overlapping cuti
        for (LocalDate tanggal : tanggalCutiList) {
            List<Cuti> overlapping = cutiRepository.findOverlappingCuti(pegawai, tanggal);
            if (!overlapping.isEmpty()) {
                String errorMsg = "Sudah ada pengajuan cuti pada tanggal " + tanggal;
                log.error(errorMsg);
                throw new RuntimeException(errorMsg);
            }
        }
        
        String lampiranPath = null;
        if (file != null && !file.isEmpty()) {
            lampiranPath = saveFile(file);
            log.debug("File lampiran disimpan: {}", lampiranPath);
        }
        
        final String finalLampiranPath = lampiranPath;
        
        // Parse tipe cuti
        Cuti.TipeCuti tipeCuti = Cuti.TipeCuti.CUTI; // default
        if (request.getTipeCuti() != null && !request.getTipeCuti().isEmpty()) {
            tipeCuti = Cuti.TipeCuti.valueOf(request.getTipeCuti().toUpperCase());
        }
        final Cuti.TipeCuti finalTipeCuti = tipeCuti;
        
        // Get jenis cuti entity (optional for SAKIT)
        JenisCuti jenisCuti = null;
        if (tipeCuti == Cuti.TipeCuti.CUTI && request.getJenisCutiId() != null) {
            jenisCuti = jenisCutiService.findById(request.getJenisCutiId());
            log.debug("Jenis cuti: {}", jenisCuti.getNamaCuti());
        } else if (tipeCuti == Cuti.TipeCuti.SAKIT) {
            log.debug("Tipe: SAKIT - tidak memerlukan jenis cuti");
        }
        final JenisCuti finalJenisCuti = jenisCuti;
        
        // Create cuti for each date
        List<Cuti> cutiList = tanggalCutiList.stream()
            .map(tanggal -> {
                log.debug("Membuat cuti untuk tanggal: {}", tanggal);
                return Cuti.builder()
                    .pegawai(pegawai)
                    .tanggalCuti(tanggal)
                    .tipeCuti(finalTipeCuti)
                    .jenisCuti(finalJenisCuti)
                    .alasanCuti(request.getAlasanCuti())
                    .lampiranCuti(finalLampiranPath)
                    .statusApproval(Cuti.StatusApproval.PENDING)
                    .build();
            })
            .collect(Collectors.toList());
        
        log.debug("Menyimpan {} cuti ke database", cutiList.size());
        List<Cuti> savedCutiList = cutiRepository.saveAll(cutiList);
        log.debug("Cuti berhasil disimpan: {} records", savedCutiList.size());
        
        // Send notification to admins
        sendNotificationToAdmins(pegawai, savedCutiList);
        
        return savedCutiList.stream()
            .map(this::convertToResponseDto)
            .toList();
    }
    
    @Transactional
    public CutiResponseDto approveCuti(Long cutiId, Long adminId, CutiApprovalDto approvalDto) {
        Cuti cuti = cutiRepository.findById(cutiId)
            .orElseThrow(() -> new RuntimeException("Pengajuan cuti tidak ditemukan"));
        
        Pegawai admin = pegawaiRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin tidak ditemukan"));
        
        cuti.setStatusApproval(Cuti.StatusApproval.valueOf(approvalDto.getStatusApproval()));
        cuti.setCatatanApproval(approvalDto.getCatatanApproval());
        cuti.setApprovedBy(admin);
        cuti.setApprovedAt(LocalDateTime.now());
        
        Cuti savedCuti = cutiRepository.save(cuti);
        
        // Send notification to pegawai
        sendNotificationToPegawai(savedCuti);
        
        return convertToResponseDto(savedCuti);
    }
    
    @Transactional(readOnly = true)
    public Page<CutiResponseDto> getCutiByPegawai(Long pegawaiId, Pageable pageable) {
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
            .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        return cutiRepository.findByPegawaiOrderByCreatedAtDesc(pegawai, pageable)
            .map(this::convertToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public Page<CutiResponseDto> getAllCutiWithFilters(
        Long pegawaiId, 
        String status, 
        String jenisCuti,
        LocalDate startDate,
        LocalDate endDate,
        Pageable pageable
    ) {
        Cuti.StatusApproval statusEnum = null;
        if (status != null && !status.equals("semua")) {
            statusEnum = Cuti.StatusApproval.valueOf(status.toUpperCase());
        }
        
        return cutiRepository.findWithFilters(pegawaiId, statusEnum, jenisCuti, startDate, endDate, pageable)
            .map(this::convertToResponseDto);
    }
    
    public Map<String, Integer> getCutiStats(Long pegawaiId) {
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
            .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        int currentYear = LocalDate.now().getYear();
        Long cutiTerpakai = cutiRepository.countApprovedCutiByPegawaiAndYear(pegawai, currentYear);
        int totalCuti = pegawai.getIzinCuti() != null ? pegawai.getIzinCuti() : 12;
        int sisaCuti = totalCuti - cutiTerpakai.intValue();
        
        Map<String, Integer> stats = new HashMap<>();
        stats.put("totalCuti", totalCuti);
        stats.put("cutiTerpakai", cutiTerpakai.intValue());
        stats.put("sisaCuti", sisaCuti);
        
        return stats;
    }
    
    private String saveFile(MultipartFile file) {
        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path uploadPath = Paths.get(uploadDirectory);
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);
            
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Gagal menyimpan file: " + e.getMessage());
        }
    }
    
    private void sendNotificationToAdmins(Pegawai pegawai, List<Cuti> cutiList) {
        try {
            log.debug("Sending notification to admins for cuti request from: {}", pegawai.getNamaLengkap());
            
            Pusher pusher = getPusher();
            
            Map<String, Object> data = new HashMap<>();
            data.put("type", "new_cuti_request");
            data.put("message", pegawai.getNamaLengkap() + " mengajukan cuti");
            data.put("pegawaiId", pegawai.getId());
            data.put("pegawaiName", pegawai.getNamaLengkap());
            data.put("cutiCount", cutiList.size());
            data.put("startDate", cutiList.get(0).getTanggalCuti().toString());
            data.put("endDate", cutiList.get(cutiList.size() - 1).getTanggalCuti().toString());
            data.put("timestamp", LocalDateTime.now().toString());
            
            log.debug("Triggering pusher event on admin-channel with data: {}", data);
            pusher.trigger("admin-channel", "cuti-request", data);
            log.info("Notification sent to admins for cuti request from {}", pegawai.getNamaLengkap());
        } catch (Exception e) {
            log.error("Failed to send notification to admins for pegawai {}: {}", pegawai.getNamaLengkap(), e.getMessage(), e);
            // Don't throw exception to avoid breaking the main cuti submission flow
        }
    }
    
    private void sendNotificationToPegawai(Cuti cuti) {
        try {
            log.debug("Sending notification to pegawai: {} for cuti ID: {}", cuti.getPegawai().getNamaLengkap(), cuti.getId());
            
            Pusher pusher = getPusher();
            
            Map<String, Object> data = new HashMap<>();
            data.put("type", "cuti_approval");
            data.put("message", "Pengajuan cuti Anda telah " + 
                (cuti.getStatusApproval() == Cuti.StatusApproval.DISETUJUI ? "disetujui" : "ditolak"));
            data.put("cutiId", cuti.getId());
            data.put("status", cuti.getStatusApproval().name());
            data.put("tanggalCuti", cuti.getTanggalCuti().toString());
            data.put("catatan", cuti.getCatatanApproval());
            data.put("approvedBy", cuti.getApprovedBy() != null ? cuti.getApprovedBy().getNamaLengkap() : "System");
            data.put("timestamp", LocalDateTime.now().toString());
            
            String channel = "pegawai-" + cuti.getPegawai().getId();
            log.debug("Triggering pusher event on channel: {} with data: {}", channel, data);
            pusher.trigger(channel, "cuti-response", data);
            log.info("Notification sent to pegawai {} for cuti approval", cuti.getPegawai().getNamaLengkap());
        } catch (Exception e) {
            log.error("Failed to send notification to pegawai {} for cuti ID {}: {}", 
                cuti.getPegawai().getNamaLengkap(), cuti.getId(), e.getMessage(), e);
            // Don't throw exception to avoid breaking the main approval flow
        }
    }
    
    private CutiResponseDto convertToResponseDto(Cuti cuti) {
        try {
            return CutiResponseDto.builder()
                .id(cuti.getId())
                .pegawaiId(cuti.getPegawai() != null ? cuti.getPegawai().getId() : null)
                .namaPegawai(cuti.getPegawai() != null ? cuti.getPegawai().getNamaLengkap() : "Unknown")
                .tanggalCuti(cuti.getTanggalCuti())
                .tipeCuti(cuti.getTipeCuti() != null ? cuti.getTipeCuti().name() : "CUTI")
                .jenisCutiId(cuti.getJenisCuti() != null ? cuti.getJenisCuti().getId() : null)
                .jenisCutiNama(cuti.getJenisCuti() != null ? cuti.getJenisCuti().getNamaCuti() : (cuti.getTipeCuti() == Cuti.TipeCuti.SAKIT ? "Sakit" : "Unknown"))
                .alasanCuti(cuti.getAlasanCuti())
                .lampiranCuti(cuti.getLampiranCuti())
                .statusApproval(cuti.getStatusApproval().name())
                .catatanApproval(cuti.getCatatanApproval())
                .approvedByName(cuti.getApprovedBy() != null ? cuti.getApprovedBy().getNamaLengkap() : null)
                .approvedAt(cuti.getApprovedAt())
                .createdAt(cuti.getCreatedAt())
                .updatedAt(cuti.getUpdatedAt())
                .build();
        } catch (Exception e) {
            log.error("Error converting Cuti to DTO: {}", e.getMessage());
            // Return basic DTO with available data
            return CutiResponseDto.builder()
                .id(cuti.getId())
                .tanggalCuti(cuti.getTanggalCuti())
                .tipeCuti(cuti.getTipeCuti() != null ? cuti.getTipeCuti().name() : "CUTI")
                .alasanCuti(cuti.getAlasanCuti())
                .statusApproval(cuti.getStatusApproval().name())
                .createdAt(cuti.getCreatedAt())
                .build();
        }
    }
    
    public Resource getAttachmentResource(Long cutiId) {
        Cuti cuti = cutiRepository.findById(cutiId)
            .orElseThrow(() -> new RuntimeException("Cuti tidak ditemukan"));
        
        if (cuti.getLampiranCuti() == null || cuti.getLampiranCuti().isEmpty()) {
            throw new RuntimeException("Lampiran tidak ditemukan");
        }
        
        Path filePath = Paths.get(uploadDirectory, cuti.getLampiranCuti());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("File lampiran tidak ditemukan: " + cuti.getLampiranCuti());
        }
        
        return new FileSystemResource(filePath);
    }
    
    public String getAttachmentFilename(Long cutiId) {
        Cuti cuti = cutiRepository.findById(cutiId)
            .orElseThrow(() -> new RuntimeException("Cuti tidak ditemukan"));
        
        if (cuti.getLampiranCuti() == null || cuti.getLampiranCuti().isEmpty()) {
            throw new RuntimeException("Lampiran tidak ditemukan");
        }
        
        return cuti.getLampiranCuti();
    }
    
    @Transactional(readOnly = true)
    public boolean isOnApprovedLeaveToday(Long pegawaiId) {
        try {
            Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
            
            LocalDate today = LocalDate.now();
            log.debug("Checking approved leave for pegawai {} on date {}", pegawai.getNamaLengkap(), today);
            
            // Check if there's any approved cuti for today
            List<Cuti> approvedCutiToday = cutiRepository.findByPegawaiAndTanggalCutiAndStatusApproval(
                pegawai, today, Cuti.StatusApproval.DISETUJUI);
            
            boolean isOnLeave = !approvedCutiToday.isEmpty();
            log.debug("Pegawai {} is on approved leave today: {}", pegawai.getNamaLengkap(), isOnLeave);
            
            return isOnLeave;
        } catch (Exception e) {
            log.error("Error checking approved leave for pegawai {}: {}", pegawaiId, e.getMessage(), e);
            return false;
        }
    }
}
