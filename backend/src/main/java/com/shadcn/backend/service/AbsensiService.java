package com.shadcn.backend.service;

import com.shadcn.backend.dto.AbsensiRequest;
import com.shadcn.backend.dto.AbsensiResponse;
import com.shadcn.backend.dto.AbsensiStats;
import com.shadcn.backend.dto.PagedResponse;
import com.shadcn.backend.dto.ShiftResponse;
import com.shadcn.backend.entity.Absensi;
import com.shadcn.backend.entity.PemotonganAbsen;
import com.shadcn.backend.entity.Shift;
import com.shadcn.backend.entity.Absensi.AbsensiStatus;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.AbsensiRepository;
import com.shadcn.backend.repository.PemotonganAbsenRepository;
import com.shadcn.backend.repository.ShiftRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AbsensiService {
    
    private final AbsensiRepository absensiRepository;
    private final PemotonganAbsenRepository pemotonganAbsenRepository;
    private final ShiftRepository shiftRepository;
    private final PegawaiRepository pegawaiRepository;
    private final PhotoUploadService photoUploadService;
    
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    /**
     * Get all active shifts
     */
    public List<ShiftResponse> getAllActiveShifts() {
        List<Shift> shifts = shiftRepository.findByIsActiveTrueOrderByNamaShiftAsc();
        return shifts.stream()
                .map(this::convertToShiftResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Submit absensi for a pegawai
     */
    public List<ShiftResponse> getActiveShifts() {
        List<Shift> shifts = shiftRepository.findByIsActiveTrueOrderByNamaShiftAsc();
        return shifts.stream()
                .map(this::convertToShiftResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get location information for absensi based on shift requirements
     */
    public Map<String, Object> getLocationInfoForAbsensi(Long pegawaiId, Long shiftId, Double currentLat, Double currentLon) {
        Map<String, Object> locationInfo = new HashMap<>();
        
        try {
            // Get pegawai and shift
            Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
            
            Shift shift = shiftRepository.findById(shiftId)
                    .orElseThrow(() -> new RuntimeException("Shift tidak ditemukan"));
            
            locationInfo.put("shiftName", shift.getNamaShift());
            locationInfo.put("lockLokasi", shift.getLockLokasi());
            locationInfo.put("currentLatitude", currentLat);
            locationInfo.put("currentLongitude", currentLon);
            
            if ("HARUS_DI_KANTOR".equals(shift.getLockLokasi())) {
                // Office-based attendance
                if (pegawai.getLokasi() != null) {
                    locationInfo.put("officeRequired", true);
                    locationInfo.put("officeName", pegawai.getLokasi().getNamaLokasi());
                    locationInfo.put("officeAddress", pegawai.getLokasi().getAlamat());
                    locationInfo.put("officeLatitude", Double.parseDouble(pegawai.getLokasi().getLatitude()));
                    locationInfo.put("officeLongitude", Double.parseDouble(pegawai.getLokasi().getLongitude()));
                    
                    double allowedRadius = 100.0;
                    if (pegawai.getLokasi().getRadius() != null && !pegawai.getLokasi().getRadius().isEmpty()) {
                        try {
                            allowedRadius = Double.parseDouble(pegawai.getLokasi().getRadius());
                        } catch (NumberFormatException e) {
                            log.warn("Invalid radius for location {}", pegawai.getLokasi().getId());
                        }
                    }
                    locationInfo.put("officeRadius", allowedRadius);
                    
                    if (currentLat != null && currentLon != null) {
                        double distanceToOffice = calculateDistance(
                            currentLat, currentLon,
                            Double.parseDouble(pegawai.getLokasi().getLatitude()),
                            Double.parseDouble(pegawai.getLokasi().getLongitude())
                        );
                        locationInfo.put("distanceToOffice", distanceToOffice);
                        locationInfo.put("withinOfficeRadius", distanceToOffice <= allowedRadius);
                    }
                } else {
                    locationInfo.put("officeRequired", true);
                    locationInfo.put("error", "Lokasi kantor pegawai belum terdaftar");
                }
            } else {
                // Flexible location attendance
                locationInfo.put("officeRequired", false);
                locationInfo.put("flexibleLocation", true);
                
                // Include home address if available
                if (pegawai.getAlamat() != null && !pegawai.getAlamat().isEmpty()) {
                    locationInfo.put("homeAddress", pegawai.getAlamat());
                }
                
                if (pegawai.getLatitude() != null && pegawai.getLongitude() != null && 
                    currentLat != null && currentLon != null) {
                    double distanceToHome = calculateDistance(
                        currentLat, currentLon,
                        pegawai.getLatitude(), pegawai.getLongitude()
                    );
                    locationInfo.put("homeLatitude", pegawai.getLatitude());
                    locationInfo.put("homeLongitude", pegawai.getLongitude());
                    locationInfo.put("distanceToHome", distanceToHome);
                }
            }
            
        } catch (Exception e) {
            log.error("Error getting location info: {}", e.getMessage());
            locationInfo.put("error", e.getMessage());
        }
        
        return locationInfo;
    }
    
    public AbsensiResponse createAbsensi(AbsensiRequest request) {
        try {
            // Validate pegawai
            Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
            
            // Validate shift
            Shift shift = shiftRepository.findById(request.getShiftId())
                    .orElseThrow(() -> new RuntimeException("Shift tidak ditemukan"));
            
            // Parse absensi type
            Absensi.AbsensiType type = parseAbsensiType(request.getType());
            
            // Check if already has absensi for this date and type
            LocalDate today = LocalDate.now();
            Optional<Absensi> existingAbsensi = absensiRepository
                    .findByPegawaiAndTanggalAndType(pegawai, today, type);
            
            if (existingAbsensi.isPresent()) {
                throw new RuntimeException("Anda sudah melakukan absensi " + request.getType() + " hari ini");
            }
            
            // Validate location based on shift lock
            validateLocationForAbsensi(request, pegawai, shift);
            
            // Calculate distance based on shift location lock
            double distance = 0.0;
            if (shift.getLockLokasi() != null && shift.getLockLokasi().equals("HARUS_DI_KANTOR")) {
                // For locked location shifts, calculate distance to office
                if (pegawai.getLokasi() != null && pegawai.getLokasi().getLatitude() != null && pegawai.getLokasi().getLongitude() != null) {
                    distance = calculateDistance(
                        request.getLatitude(), 
                        request.getLongitude(),
                        Double.parseDouble(pegawai.getLokasi().getLatitude()), 
                        Double.parseDouble(pegawai.getLokasi().getLongitude())
                    );
                }
            } else {
                // For flexible location shifts, calculate distance to home
                if (pegawai.getLatitude() != null && pegawai.getLongitude() != null) {
                    distance = calculateDistance(
                        request.getLatitude(), 
                        request.getLongitude(),
                        pegawai.getLatitude(), 
                        pegawai.getLongitude()
                    );
                }
            }
            
            // Upload photo if provided
            String photoUrl = null;
            if (request.getPhotoBase64() != null && !request.getPhotoBase64().isEmpty()) {
                try {
                    photoUrl = uploadPhotoFromBase64(request.getPhotoBase64(), pegawai.getId());
                } catch (Exception e) {
                    log.warn("Failed to upload photo for absensi: {}", e.getMessage());
                }
            }
            
            // Determine status and keterangan based on time, shift, and penalty rules
            LocalTime currentTime = LocalTime.now();
            AbsensiStatusAndKeterangan statusAndKeterangan = determineAbsensiStatusAndKeterangan(type, shift, currentTime, pegawai);
            
            // Create absensi record
            Absensi absensi = new Absensi();
            absensi.setPegawai(pegawai);
            absensi.setShift(shift);
            absensi.setType(type);
            absensi.setTanggal(today);
            absensi.setWaktu(currentTime);
            absensi.setLatitude(request.getLatitude());
            absensi.setLongitude(request.getLongitude());
            absensi.setJarak(distance);
            absensi.setPhotoUrl(photoUrl);
            absensi.setStatus(statusAndKeterangan.status);
            absensi.setKeterangan(statusAndKeterangan.keterangan);
            
            // Save absensi
            Absensi savedAbsensi = absensiRepository.save(absensi);
            
            return convertToAbsensiResponse(savedAbsensi);
            
        } catch (Exception e) {
            log.error("Error submitting absensi for pegawai {}: {}", request.getPegawaiId(), e.getMessage(), e);
            throw new RuntimeException("Gagal melakukan absensi: " + e.getMessage());
        }
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<AbsensiResponse> getAbsensiHistory(Long pegawaiId, String bulan, String tahun, String startDate, String endDate, String type, String status, org.springframework.data.domain.Pageable pageable) {
        // Find pegawai
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        // Build date criteria
        LocalDate start = null;
        LocalDate end = null;
        
        // Priority order: startDate/endDate > bulan/tahun > default (current month)
        if (startDate != null && endDate != null) {
            start = LocalDate.parse(startDate, DATE_FORMATTER);
            end = LocalDate.parse(endDate, DATE_FORMATTER);
        } else if (bulan != null && tahun != null) {
            int bulanInt = Integer.parseInt(bulan);
            int tahunInt = Integer.parseInt(tahun);
            start = LocalDate.of(tahunInt, bulanInt, 1);
            end = start.withDayOfMonth(start.lengthOfMonth());
        } else if (tahun != null) {
            int tahunInt = Integer.parseInt(tahun);
            start = LocalDate.of(tahunInt, 1, 1);
            end = LocalDate.of(tahunInt, 12, 31);
        } else {
            // Default to current month
            LocalDate now = LocalDate.now();
            start = now.withDayOfMonth(1);
            end = now.withDayOfMonth(now.lengthOfMonth());
        }
        
        // Parse type and status enums
        Absensi.AbsensiType absensiType = null;
        if (type != null && !type.isEmpty()) {
            try {
                absensiType = Absensi.AbsensiType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid type, ignore
            }
        }
        
        Absensi.AbsensiStatus absensiStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                absensiStatus = Absensi.AbsensiStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        
        // Get absensi data with filters
        Page<Absensi> absensiPage;
        if (absensiType != null && absensiStatus != null) {
            // Filter by date, type, and status
            absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenAndTypeAndStatusOrderByTanggalDescWaktuDesc(
                pegawai, start, end, absensiType, absensiStatus, pageable);
        } else if (absensiType != null) {
            // Filter by date and type only
            absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenAndTypeOrderByTanggalDescWaktuDesc(
                pegawai, start, end, absensiType, pageable);
        } else if (absensiStatus != null) {
            // Filter by date and status only
            absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenAndStatusOrderByTanggalDescWaktuDesc(
                pegawai, start, end, absensiStatus, pageable);
        } else if (start != null && end != null) {
            // Filter by date only
            absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenOrderByTanggalDescWaktuDesc(pegawai, start, end, pageable);
        } else {
            // No filters
            absensiPage = absensiRepository.findByPegawaiOrderByTanggalDescWaktuDesc(pegawai, pageable);
        }
        
        // Convert to response
        List<AbsensiResponse> content = absensiPage.getContent().stream()
                .map(this::convertToAbsensiResponse)
                .collect(Collectors.toList());
        
        PagedResponse<AbsensiResponse> response = new PagedResponse<>();
        response.setContent(content);
        response.setPage(absensiPage.getNumber());
        response.setSize(absensiPage.getSize());
        response.setTotalElements(absensiPage.getTotalElements());
        response.setTotalPages(absensiPage.getTotalPages());
        response.setFirst(absensiPage.isFirst());
        response.setLast(absensiPage.isLast());
        response.setEmpty(absensiPage.isEmpty());
        
        return response;
    }
    
    @Transactional(readOnly = true)
    public AbsensiStats getAbsensiStats(Long pegawaiId, String bulan, String tahun) {
        // Find pegawai
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        // Build date criteria
        LocalDate startDate = null;
        LocalDate endDate = null;
        
        if (bulan != null && tahun != null) {
            int bulanInt = Integer.parseInt(bulan);
            int tahunInt = Integer.parseInt(tahun);
            startDate = LocalDate.of(tahunInt, bulanInt, 1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        } else if (tahun != null) {
            int tahunInt = Integer.parseInt(tahun);
            startDate = LocalDate.of(tahunInt, 1, 1);
            endDate = LocalDate.of(tahunInt, 12, 31);
        } else {
            // Default to current year
            int currentYear = LocalDate.now().getYear();
            startDate = LocalDate.of(currentYear, 1, 1);
            endDate = LocalDate.of(currentYear, 12, 31);
        }
        
        // Get stats
        List<Absensi> absensiList;
        if (startDate != null && endDate != null) {
            absensiList = absensiRepository.findByPegawaiAndTanggalBetween(pegawai, startDate, endDate);
        } else {
            absensiList = absensiRepository.findByPegawaiOrderByTanggalDescWaktuDesc(pegawai);
        }
        
        long totalHadir = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.HADIR).count();
        long totalTerlambat = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.TERLAMBAT).count();
        long totalPulangCepat = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.PULANG_CEPAT).count();
        long totalAlpha = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.ALPHA).count();
        
        // Bulan ini
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
        List<Absensi> bulanIniList = absensiRepository.findByPegawaiAndTanggalBetween(pegawai, startOfMonth, endOfMonth);
        long bulanIni = bulanIniList.size();
        
        return new AbsensiStats(totalHadir, totalTerlambat, totalPulangCepat, totalAlpha, bulanIni);
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getTodayAbsensi(Long pegawaiId) {
        try {
            Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
            
            LocalDate today = LocalDate.now();
            
            // Get today's absensi records
            List<Absensi> todayAbsensi = absensiRepository.findByPegawaiAndTanggal(pegawai, today);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("date", today.format(DATE_FORMATTER));
            
            // Find masuk and pulang records
            Optional<Absensi> masukRecord = todayAbsensi.stream()
                    .filter(a -> a.getType() == Absensi.AbsensiType.MASUK)
                    .findFirst();
            
            Optional<Absensi> pulangRecord = todayAbsensi.stream()
                    .filter(a -> a.getType() == Absensi.AbsensiType.PULANG)
                    .findFirst();
            
            // Build response
            Map<String, Object> absensiData = new HashMap<>();
            
            // Check current time for 12:01 PM cutoff rule
            LocalTime currentTime = LocalTime.now();
            LocalTime cutoffTime = LocalTime.of(12, 1); // 12:01 PM
            boolean isPastCutoff = currentTime.isAfter(cutoffTime);
            
            if (masukRecord.isPresent()) {
                Absensi masuk = masukRecord.get();
                Map<String, Object> masukData = new HashMap<>();
                masukData.put("waktu", masuk.getWaktu().format(TIME_FORMATTER));
                masukData.put("status", masuk.getStatus().name().toLowerCase());
                masukData.put("shift", masuk.getShift() != null ? masuk.getShift().getNamaShift() : "");
                masukData.put("shiftId", masuk.getShift() != null ? masuk.getShift().getId() : null);
                masukData.put("latitude", masuk.getLatitude());
                masukData.put("longitude", masuk.getLongitude());
                masukData.put("jarak", masuk.getJarak());
                masukData.put("photoUrl", masuk.getPhotoUrl());
                masukData.put("keterangan", masuk.getKeterangan());
                absensiData.put("masuk", masukData);
                
                // Set default values for next absensi (pulang)
                result.put("nextType", "pulang");
                result.put("defaultShiftId", masuk.getShift() != null ? masuk.getShift().getId() : null);
                result.put("hasMasuk", true);
            } else {
                // If no masuk record and past cutoff time, force pulang
                if (isPastCutoff) {
                    result.put("nextType", "pulang");
                    result.put("cutoffReached", true);
                    result.put("cutoffMessage", "Waktu absensi masuk telah berakhir (12:01). Silakan langsung absensi pulang.");
                } else {
                    result.put("nextType", "masuk");
                    result.put("cutoffReached", false);
                }
                result.put("defaultShiftId", null);
                result.put("hasMasuk", false);
            }
            
            if (pulangRecord.isPresent()) {
                Absensi pulang = pulangRecord.get();
                Map<String, Object> pulangData = new HashMap<>();
                pulangData.put("waktu", pulang.getWaktu().format(TIME_FORMATTER));
                pulangData.put("status", pulang.getStatus().name().toLowerCase());
                pulangData.put("shift", pulang.getShift() != null ? pulang.getShift().getNamaShift() : "");
                pulangData.put("shiftId", pulang.getShift() != null ? pulang.getShift().getId() : null);
                pulangData.put("latitude", pulang.getLatitude());
                pulangData.put("longitude", pulang.getLongitude());
                pulangData.put("jarak", pulang.getJarak());
                pulangData.put("photoUrl", pulang.getPhotoUrl());
                pulangData.put("keterangan", pulang.getKeterangan());
                absensiData.put("pulang", pulangData);
                result.put("hasPulang", true);
            } else {
                result.put("hasPulang", false);
            }
            
            result.put("absensi", absensiData);
            result.put("isComplete", masukRecord.isPresent() && pulangRecord.isPresent());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error getting today absensi for pegawai {}: {}", pegawaiId, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", e.getMessage());
            return errorResult;
        }
    }
    
    /**
     * Get absensi history for a pegawai
     */
    public List<AbsensiResponse> getAbsensiHistory(Long pegawaiId, String month) {
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        List<Absensi> absensiList;
        
        if (month != null && !month.isEmpty()) {
            // Parse month (format: YYYY-MM)
            String[] parts = month.split("-");
            int year = Integer.parseInt(parts[0]);
            int monthInt = Integer.parseInt(parts[1]);
            
            absensiList = absensiRepository.findByPegawaiAndMonth(pegawai, year, monthInt);
        } else {
            // Get current month
            LocalDate now = LocalDate.now();
            absensiList = absensiRepository.findByPegawaiAndMonth(pegawai, now.getYear(), now.getMonthValue());
        }
        
        return absensiList.stream()
                .map(this::convertToAbsensiResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get absensi statistics for a pegawai
     */
    public AbsensiStats getAbsensiStats(Long pegawaiId) {
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        LocalDate now = LocalDate.now();
        
        long totalHadir = absensiRepository.countByPegawaiAndStatus(pegawai, Absensi.AbsensiStatus.HADIR);
        long totalTerlambat = absensiRepository.countByPegawaiAndStatus(pegawai, Absensi.AbsensiStatus.TERLAMBAT);
        long totalPulangCepat = absensiRepository.countByPegawaiAndStatus(pegawai, Absensi.AbsensiStatus.PULANG_CEPAT);
        long totalAlpha = absensiRepository.countByPegawaiAndStatus(pegawai, Absensi.AbsensiStatus.ALPHA);
        long bulanIni = absensiRepository.countByPegawaiAndMonth(pegawai, now.getYear(), now.getMonthValue());
        
        return new AbsensiStats(totalHadir, totalTerlambat, totalPulangCepat, totalAlpha, bulanIni);
    }
    
    // Master data methods for admin
    @Transactional(readOnly = true)
    public PagedResponse<AbsensiResponse> getAllAbsensiHistory(String startDate, String endDate, String type, String status, Long pegawaiId, org.springframework.data.domain.Pageable pageable) {
        // Build date criteria
        LocalDate start = null;
        LocalDate end = null;
        
        if (startDate != null && endDate != null) {
            start = LocalDate.parse(startDate, DATE_FORMATTER);
            end = LocalDate.parse(endDate, DATE_FORMATTER);
        } else {
            // Default to current month
            LocalDate now = LocalDate.now();
            start = now.withDayOfMonth(1);
            end = now.withDayOfMonth(now.lengthOfMonth());
        }
        
        // Parse type and status enums
        Absensi.AbsensiType absensiType = null;
        if (type != null && !type.isEmpty()) {
            try {
                absensiType = Absensi.AbsensiType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid type, ignore
            }
        }
        
        Absensi.AbsensiStatus absensiStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                absensiStatus = Absensi.AbsensiStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        
        // Find pegawai if specified
        Pegawai pegawai = null;
        if (pegawaiId != null) {
            pegawai = pegawaiRepository.findById(pegawaiId)
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        }
        
        // Get absensi data with filters
        Page<Absensi> absensiPage;
        
        if (pegawai != null) {
            // Filter by specific pegawai
            if (absensiType != null && absensiStatus != null) {
                absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenAndTypeAndStatusOrderByTanggalDescWaktuDesc(
                    pegawai, start, end, absensiType, absensiStatus, pageable);
            } else if (absensiType != null) {
                absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenAndTypeOrderByTanggalDescWaktuDesc(
                    pegawai, start, end, absensiType, pageable);
            } else if (absensiStatus != null) {
                absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenAndStatusOrderByTanggalDescWaktuDesc(
                    pegawai, start, end, absensiStatus, pageable);
            } else {
                absensiPage = absensiRepository.findByPegawaiAndTanggalBetweenOrderByTanggalDescWaktuDesc(
                    pegawai, start, end, pageable);
            }
        } else {
            // All pegawai
            if (absensiType != null && absensiStatus != null) {
                absensiPage = absensiRepository.findByTanggalBetweenAndTypeAndStatusOrderByTanggalDescWaktuDesc(
                    start, end, absensiType, absensiStatus, pageable);
            } else if (absensiType != null) {
                absensiPage = absensiRepository.findByTanggalBetweenAndTypeOrderByTanggalDescWaktuDesc(
                    start, end, absensiType, pageable);
            } else if (absensiStatus != null) {
                absensiPage = absensiRepository.findByTanggalBetweenAndStatusOrderByTanggalDescWaktuDesc(
                    start, end, absensiStatus, pageable);
            } else {
                absensiPage = absensiRepository.findByTanggalBetweenOrderByTanggalDescWaktuDesc(
                    start, end, pageable);
            }
        }
        
        // Convert to response
        List<AbsensiResponse> content = absensiPage.getContent().stream()
                .map(this::convertToAbsensiResponse)
                .collect(Collectors.toList());
        
        PagedResponse<AbsensiResponse> response = new PagedResponse<>();
        response.setContent(content);
        response.setPage(absensiPage.getNumber());
        response.setSize(absensiPage.getSize());
        response.setTotalElements(absensiPage.getTotalElements());
        response.setTotalPages(absensiPage.getTotalPages());
        response.setFirst(absensiPage.isFirst());
        response.setLast(absensiPage.isLast());
        response.setEmpty(absensiPage.isEmpty());
        
        return response;
    }
    
    @Transactional(readOnly = true)
    public AbsensiStats getAllAbsensiStats(String startDate, String endDate, Long pegawaiId) {
        // Build date criteria
        LocalDate start = null;
        LocalDate end = null;
        
        if (startDate != null && endDate != null) {
            start = LocalDate.parse(startDate, DATE_FORMATTER);
            end = LocalDate.parse(endDate, DATE_FORMATTER);
        } else {
            // Default to current month
            LocalDate now = LocalDate.now();
            start = now.withDayOfMonth(1);
            end = now.withDayOfMonth(now.lengthOfMonth());
        }
        
        // Find pegawai if specified
        Pegawai pegawai = null;
        if (pegawaiId != null) {
            pegawai = pegawaiRepository.findById(pegawaiId)
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        }
        
        // Get stats
        List<Absensi> absensiList;
        if (pegawai != null) {
            absensiList = absensiRepository.findByPegawaiAndTanggalBetween(pegawai, start, end);
        } else {
            absensiList = absensiRepository.findByTanggalBetween(start, end);
        }
        
        long totalHadir = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.HADIR).count();
        long totalTerlambat = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.TERLAMBAT).count();
        long totalPulangCepat = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.PULANG_CEPAT).count();
        long totalAlpha = absensiList.stream().filter(a -> a.getStatus() == AbsensiStatus.ALPHA).count();
        
        // Bulan ini
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
        List<Absensi> bulanIniList;
        if (pegawai != null) {
            bulanIniList = absensiRepository.findByPegawaiAndTanggalBetween(pegawai, startOfMonth, endOfMonth);
        } else {
            bulanIniList = absensiRepository.findByTanggalBetween(startOfMonth, endOfMonth);
        }
        long bulanIni = bulanIniList.size();
        
        return new AbsensiStats(totalHadir, totalTerlambat, totalPulangCepat, totalAlpha, bulanIni);
    }
    
    /**
     * Helper methods
     */
    
    private Absensi.AbsensiType parseAbsensiType(String type) {
        switch (type.toLowerCase()) {
            case "masuk":
                return Absensi.AbsensiType.MASUK;
            case "pulang":
                return Absensi.AbsensiType.PULANG;
            default:
                throw new RuntimeException("Tipe absensi tidak valid: " + type);
        }
    }
    
    /**
     * Enhanced method to determine status and keterangan with dynamic penalty calculation
     */
    private AbsensiStatusAndKeterangan determineAbsensiStatusAndKeterangan(Absensi.AbsensiType type, Shift shift, LocalTime currentTime, Pegawai pegawai) {
        LocalTime jamMasuk = LocalTime.parse(shift.getJamMasuk());
        LocalTime jamKeluar = LocalTime.parse(shift.getJamKeluar());
        
        if (type == Absensi.AbsensiType.MASUK) {
            return determineCheckInStatusAndKeterangan(currentTime, jamMasuk);
        } else {
            return determineCheckOutStatusAndKeterangan(currentTime, jamKeluar, pegawai);
        }
    }
    
    /**
     * Determine check-in status and keterangan with dynamic penalty calculation
     */
    private AbsensiStatusAndKeterangan determineCheckInStatusAndKeterangan(LocalTime currentTime, LocalTime jamMasuk) {
        if (currentTime.isAfter(jamMasuk)) {
            long lateMinutes = Duration.between(jamMasuk, currentTime).toMinutes();
            BigDecimal penaltyPercentage = getPenaltyPercentageForLateness((int) lateMinutes);
            
            if (lateMinutes >= 31 && lateMinutes <= 90) {
                long compensableLateness = lateMinutes - 30; // Only minutes above 30
                String keterangan = "Terlambat " + lateMinutes + " menit - " + compensableLateness + " menit dapat dikompensasi dengan " + (compensableLateness * 2) + " menit lembur";
                return new AbsensiStatusAndKeterangan(Absensi.AbsensiStatus.TERLAMBAT, keterangan);
            } else if (lateMinutes > 0) {
                if (lateMinutes <= 30) {
                    String keterangan = "Terlambat " + lateMinutes + " menit (tidak perlu kompensasi - " + penaltyPercentage + "% potongan)";
                    return new AbsensiStatusAndKeterangan(Absensi.AbsensiStatus.TERLAMBAT, keterangan);
                } else {
                    String keterangan = "Terlambat " + lateMinutes + " menit (tidak dapat dikompensasi - " + penaltyPercentage + "% potongan)";
                    return new AbsensiStatusAndKeterangan(Absensi.AbsensiStatus.TERLAMBAT, keterangan);
                }
            }
        }
        return new AbsensiStatusAndKeterangan(Absensi.AbsensiStatus.HADIR, "Masuk tepat waktu");
    }
    
    /**
     * Determine check-out status and keterangan
     */
    private AbsensiStatusAndKeterangan determineCheckOutStatusAndKeterangan(LocalTime currentTime, LocalTime jamKeluar, Pegawai pegawai) {
        if (currentTime.isBefore(jamKeluar.minusMinutes(30))) {
            long earlyMinutes = Duration.between(currentTime, jamKeluar).toMinutes();
            String keterangan = "Pulang cepat " + earlyMinutes + " menit";
            return new AbsensiStatusAndKeterangan(Absensi.AbsensiStatus.PULANG_CEPAT, keterangan);
        } else if (currentTime.isAfter(jamKeluar)) {
            long overtimeMinutes = Duration.between(jamKeluar, currentTime).toMinutes();
            String keterangan = "Lembur " + overtimeMinutes + " menit";
            return new AbsensiStatusAndKeterangan(Absensi.AbsensiStatus.HADIR, keterangan);
        }
        return new AbsensiStatusAndKeterangan(Absensi.AbsensiStatus.HADIR, "Pulang tepat waktu");
    }
    
    /**
     * Get penalty percentage for lateness from database rules (same logic as seeder and LaporanTukinService)
     */
    private BigDecimal getPenaltyPercentageForLateness(int lateMinutes) {
        try {
            // Get penalty rules from database
            List<PemotonganAbsen> pemotonganRules = pemotonganAbsenRepository.findAllActiveOrderByKode();
            Map<String, BigDecimal> rulePercentages = pemotonganRules.stream()
                    .collect(Collectors.toMap(
                            PemotonganAbsen::getKode,
                            PemotonganAbsen::getPersentase
                    ));
            
            // Apply same logic as LaporanTukinService
            if (lateMinutes <= 30) {
                return rulePercentages.getOrDefault("TL0", BigDecimal.valueOf(0.00));
            } else if (lateMinutes <= 60) {
                return rulePercentages.getOrDefault("TL1", BigDecimal.valueOf(0.50));
            } else if (lateMinutes <= 90) {
                return rulePercentages.getOrDefault("TL2", BigDecimal.valueOf(1.25));
            } else {
                return rulePercentages.getOrDefault("TL3", BigDecimal.valueOf(2.50));
            }
        } catch (Exception e) {
            log.warn("Failed to get penalty percentage from database, using fallback values: {}", e.getMessage());
            // Fallback to hardcoded values if database access fails
            if (lateMinutes <= 30) return BigDecimal.valueOf(0.00);
            else if (lateMinutes <= 60) return BigDecimal.valueOf(0.50);
            else if (lateMinutes <= 90) return BigDecimal.valueOf(1.25);
            else return BigDecimal.valueOf(2.50);
        }
    }
    
    /**
     * Helper class to return both status and keterangan
     */
    private static class AbsensiStatusAndKeterangan {
        final Absensi.AbsensiStatus status;
        final String keterangan;
        
        AbsensiStatusAndKeterangan(Absensi.AbsensiStatus status, String keterangan) {
            this.status = status;
            this.keterangan = keterangan;
        }
    }
    
    /**
     * Legacy method for backward compatibility
     */
    private Absensi.AbsensiStatus determineAbsensiStatus(Absensi.AbsensiType type, Shift shift) {
        LocalTime now = LocalTime.now();
        LocalTime jamMasuk = LocalTime.parse(shift.getJamMasuk());
        LocalTime jamKeluar = LocalTime.parse(shift.getJamKeluar());
        
        if (type == Absensi.AbsensiType.MASUK) {
            // Use dynamic penalty rules instead of hardcoded 15 minutes
            if (now.isAfter(jamMasuk)) {
                return Absensi.AbsensiStatus.TERLAMBAT;
            } else {
                return Absensi.AbsensiStatus.HADIR;
            }
        } else {
            // Check if leaving early
            if (now.isBefore(jamKeluar.minusMinutes(30))) { // 30 minutes before end time
                return Absensi.AbsensiStatus.PULANG_CEPAT;
            } else {
                return Absensi.AbsensiStatus.HADIR;
            }
        }
    }
    
    /**
     * Validate location for attendance based on shift lock location
     */
    private void validateLocationForAbsensi(AbsensiRequest request, Pegawai pegawai, Shift shift) {
        if (shift.getLockLokasi() != null && shift.getLockLokasi().equals("HARUS_DI_KANTOR")) {
            // For office-locked shifts, validate employee is within office radius
            if (pegawai.getLokasi() == null) {
                throw new RuntimeException("Pegawai belum memiliki lokasi kantor yang terdaftar");
            }
            
            if (pegawai.getLokasi().getLatitude() == null || pegawai.getLokasi().getLongitude() == null) {
                throw new RuntimeException("Lokasi kantor pegawai belum memiliki koordinat yang valid");
            }
            
            double distanceToOffice = calculateDistance(
                request.getLatitude(), 
                request.getLongitude(),
                Double.parseDouble(pegawai.getLokasi().getLatitude()), 
                Double.parseDouble(pegawai.getLokasi().getLongitude())
            );
            
            // Get office radius (default 100 meters if not set)
            double allowedRadius = 100.0; // default radius
            if (pegawai.getLokasi().getRadius() != null && !pegawai.getLokasi().getRadius().isEmpty()) {
                try {
                    allowedRadius = Double.parseDouble(pegawai.getLokasi().getRadius());
                } catch (NumberFormatException e) {
                    log.warn("Invalid radius value for location {}: {}", pegawai.getLokasi().getId(), pegawai.getLokasi().getRadius());
                }
            }
            
            if (distanceToOffice > allowedRadius) {
                throw new RuntimeException(String.format(
                    "Anda berada di luar radius kantor (%.0f meter dari kantor, maksimal %.0f meter). " +
                    "Silakan datang ke kantor untuk melakukan absensi.",
                    distanceToOffice, allowedRadius
                ));
            }
            
            log.info("Employee {} is within office radius: {:.2f}m <= {:.2f}m", 
                pegawai.getId(), distanceToOffice, allowedRadius);
        }
        // For DIMANA_SAJA shifts, no location validation needed
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Earth's radius in meters
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distance in meters
    }
    
    private String uploadPhotoFromBase64(String base64Data, Long pegawaiId) throws Exception {
        try {
            // Remove base64 prefix if present
            String cleanBase64 = base64Data;
            if (base64Data.contains(",")) {
                cleanBase64 = base64Data.split(",")[1];
            }
            
            // Decode base64
            byte[] imageBytes = Base64.getDecoder().decode(cleanBase64);
            
            // Generate filename
            String filename = "absensi_" + pegawaiId + "_" + System.currentTimeMillis() + ".jpg";
            
            // Use the file upload service
            return photoUploadService.saveFileFromBytes(imageBytes, filename, "photos");
            
        } catch (Exception e) {
            log.error("Error uploading photo from base64: {}", e.getMessage());
            throw new Exception("Failed to upload photo: " + e.getMessage());
        }
    }
    
    private ShiftResponse convertToShiftResponse(Shift shift) {
        ShiftResponse response = new ShiftResponse();
        response.setId(shift.getId());
        response.setNamaShift(shift.getNamaShift());
        response.setJamMasuk(shift.getJamMasuk());
        response.setJamKeluar(shift.getJamKeluar());
        response.setLockLokasi(shift.getLockLokasi());
        response.setDeskripsi(shift.getDeskripsi());
        response.setIsActive(shift.getIsActive());
        response.setCreatedAt(shift.getCreatedAt());
        response.setUpdatedAt(shift.getUpdatedAt());
        return response;
    }
    
    private AbsensiResponse convertToAbsensiResponse(Absensi absensi) {
        AbsensiResponse response = new AbsensiResponse();
        response.setId(absensi.getId());
        response.setTanggal(absensi.getTanggal().format(DATE_FORMATTER));
        response.setWaktu(absensi.getWaktu().format(TIME_FORMATTER));
        response.setType(absensi.getType().name().toLowerCase());
        response.setShift(absensi.getShift() != null ? absensi.getShift().getNamaShift() : "");
        response.setShiftLockLokasi(absensi.getShift() != null ? absensi.getShift().getLockLokasi() : "");
        
        // Set lokasi based on shift lock location
        String lokasi = "Tidak ada lokasi";
        if (absensi.getShift() != null) {
            if ("HARUS_DI_KANTOR".equals(absensi.getShift().getLockLokasi())) {
                // Absensi di kantor - gunakan nama lokasi kantor
                lokasi = absensi.getPegawai().getLokasi() != null ? 
                        absensi.getPegawai().getLokasi().getNamaLokasi() : "Kantor";
            } else if ("BISA_DI_RUMAH".equals(absensi.getShift().getLockLokasi())) {
                // Work from home - set as "Di Rumah"
                lokasi = "Di Rumah";
            } else {
                // Flexible location
                lokasi = "Lokasi Fleksibel";
            }
        }
        response.setLokasi(lokasi);
        
        response.setJarak(absensi.getJarak());
        response.setPhotoUrl(absensi.getPhotoUrl());
        response.setStatus(absensi.getStatus().name().toLowerCase());
        response.setKeterangan(absensi.getKeterangan());
        response.setLatitude(absensi.getLatitude());
        response.setLongitude(absensi.getLongitude());
        response.setCreatedAt(absensi.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // Add pegawai info for admin views
        response.setPegawaiId(absensi.getPegawai().getId());
        response.setPegawaiNama(absensi.getPegawai().getNamaLengkap());
        response.setPegawaiNip(absensi.getPegawai().getNip());
        
        return response;
    }
    
    @Transactional
    public void deleteAbsensi(Long absensiId) {
        Optional<Absensi> absensiOpt = absensiRepository.findById(absensiId);
        if (absensiOpt.isEmpty()) {
            throw new RuntimeException("Data absensi tidak ditemukan");
        }
        
        Absensi absensi = absensiOpt.get();
        absensiRepository.delete(absensi);
    }
}
