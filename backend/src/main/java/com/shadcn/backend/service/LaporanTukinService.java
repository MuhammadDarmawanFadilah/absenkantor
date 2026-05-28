package com.shadcn.backend.service;

import com.shadcn.backend.dto.LaporanTukinRequest;
import com.shadcn.backend.dto.LaporanTukinResponse;
import com.shadcn.backend.entity.Absensi;
import com.shadcn.backend.entity.PemotonganAbsen;
import com.shadcn.backend.model.LaporanTukin;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.model.Pemotongan;
import com.shadcn.backend.model.HariLibur;
import com.shadcn.backend.model.Cuti;
import com.shadcn.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.CMYKColor;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LaporanTukinService {
    
    private final LaporanTukinRepository laporanTukinRepository;
    private final PegawaiRepository pegawaiRepository;
    private final AbsensiRepository absensiRepository;
    private final PemotonganAbsenRepository pemotonganAbsenRepository;
    private final PemotonganRepository pemotonganRepository;
    private final HariLiburRepository hariLiburRepository;
    private final CutiRepository cutiRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    public LaporanTukinResponse generateLaporanTukin(LaporanTukinRequest request) {
        log.info("Generating laporan tukin for periode: {}/{}", request.getBulan(), request.getTahun());
        
        // Get current user from Spring Security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Pegawai currentUser = pegawaiRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
        
        return generateLaporanTukin(request, currentUser);
    }
    
    public LaporanTukinResponse generateLaporanTukin(LaporanTukinRequest request, Pegawai currentUser) {
        log.info("Generating laporan tukin for periode: {}/{}", request.getBulan(), request.getTahun());
        
        // Validate and calculate date range
        LocalDate startDate, endDate;
        
        if (request.getTanggalMulai() != null && request.getTanggalAkhir() != null) {
            startDate = LocalDate.parse(request.getTanggalMulai(), DATE_FORMATTER);
            endDate = LocalDate.parse(request.getTanggalAkhir(), DATE_FORMATTER);
        } else {
            // Auto calculate from month/year
            startDate = LocalDate.of(request.getTahun(), request.getBulan(), 1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        }
        
        // Get employees based on request
        List<Pegawai> targetPegawai;
        boolean isPersonalReport = false;
        
        if (request.getPegawaiId() != null) {
            // Personal report - only for specific pegawai
            Pegawai specificPegawai = pegawaiRepository.findById(request.getPegawaiId())
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan dengan ID: " + request.getPegawaiId()));
            
            if (!specificPegawai.getIsActive()) {
                throw new RuntimeException("Pegawai tidak aktif: " + specificPegawai.getNamaLengkap());
            }
            
            targetPegawai = List.of(specificPegawai);
            isPersonalReport = true;
            log.info("Generating personal laporan tukin for pegawai: {} ({})", 
                    specificPegawai.getNamaLengkap(), specificPegawai.getNip());
        } else {
            // Admin report - for all active employees
            targetPegawai = pegawaiRepository.findByIsActive(true);
            log.info("Generating admin laporan tukin for {} active employees", targetPegawai.size());
        }
        
        // Calculate tukin for each employee
        List<LaporanTukinResponse.DetailPegawaiTukin> detailPegawai = new ArrayList<>();
        BigDecimal totalTunjanganKinerja = BigDecimal.ZERO;
        BigDecimal totalPotonganAbsen = BigDecimal.ZERO;
        BigDecimal totalPemotongan = BigDecimal.ZERO;
        BigDecimal totalTunjanganBersih = BigDecimal.ZERO;
        
        for (Pegawai pegawai : targetPegawai) {
            LaporanTukinResponse.DetailPegawaiTukin detail = calculateTukinForPegawaiWithEnhancedDetail(
                pegawai, startDate, endDate, request.getBulan(), request.getTahun());
            detailPegawai.add(detail);
            
            // Sum totals
            if (detail.getTunjanganKinerja() != null) {
                totalTunjanganKinerja = totalTunjanganKinerja.add(BigDecimal.valueOf(detail.getTunjanganKinerja()));
            }
            if (detail.getPotonganAbsen() != null) {
                totalPotonganAbsen = totalPotonganAbsen.add(detail.getPotonganAbsen());
            }
            if (detail.getPemotonganLain() != null) {
                totalPemotongan = totalPemotongan.add(detail.getPemotonganLain());
            }
            if (detail.getTunjanganBersih() != null) {
                totalTunjanganBersih = totalTunjanganBersih.add(detail.getTunjanganBersih());
            }
        }
        
        // Create and save laporan record
        String judul;
        if (request.getPegawaiId() != null) {
            Pegawai targetEmployee = targetPegawai.get(0);
            judul = String.format("Laporan Tunjangan Kinerja Pribadi %s %d - %s", 
                getMonthName(request.getBulan()), request.getTahun(), targetEmployee.getNamaLengkap());
        } else {
            judul = String.format("Laporan Tunjangan Kinerja %s %d", 
                getMonthName(request.getBulan()), request.getTahun());
        }
            
        LaporanTukin laporan = LaporanTukin.builder()
                .judul(judul)
                .bulan(request.getBulan())
                .tahun(request.getTahun())
                .tanggalMulai(startDate)
                .tanggalAkhir(endDate)
                .startDate(startDate)  // Legacy column
                .endDate(endDate)      // Legacy column
                .formatLaporan(request.getFormatLaporan())
                .totalPegawai(targetPegawai.size())
                .totalTunjanganKinerja(totalTunjanganKinerja)
                .totalPotonganAbsen(totalPotonganAbsen)
                .totalPemotongan(totalPemotongan)
                .totalTunjanganBersih(totalTunjanganBersih)
                .generatedBy(currentUser)
                .isPersonalReport(isPersonalReport)
                // Legacy columns
                .totalTukin(totalTunjanganKinerja)
                .jenisLaporan("TUNJANGAN_KINERJA")
                .judulLaporan(judul)
                .periode(String.format("%02d/%d", request.getBulan(), request.getTahun()))
                .statusLaporan("GENERATED")
                .build();
        
        LaporanTukin savedLaporan = laporanTukinRepository.save(laporan);
        
        // Build response
        return LaporanTukinResponse.builder()
                .id(savedLaporan.getId())
                .judul(savedLaporan.getJudul())
                .bulan(savedLaporan.getBulan())
                .tahun(savedLaporan.getTahun())
                .tanggalMulai(savedLaporan.getTanggalMulai().format(DATE_FORMATTER))
                .tanggalAkhir(savedLaporan.getTanggalAkhir().format(DATE_FORMATTER))
                .formatLaporan(savedLaporan.getFormatLaporan())
                .status(savedLaporan.getStatus())
                .tanggalGenerate(savedLaporan.getTanggalGenerate())
                .generatedBy(savedLaporan.getGeneratedBy().getNamaLengkap())
                .totalPegawai(savedLaporan.getTotalPegawai())
                .totalTunjanganKinerja(savedLaporan.getTotalTunjanganKinerja())
                .totalPotonganAbsen(savedLaporan.getTotalPotonganAbsen())
                .totalPemotongan(savedLaporan.getTotalPemotongan())
                .totalTunjanganBersih(savedLaporan.getTotalTunjanganBersih())
                .detailPegawai(detailPegawai)
                .build();
    }
    
    private LaporanTukinResponse.DetailPegawaiTukin calculateTukinForPegawai(
            Pegawai pegawai, LocalDate startDate, LocalDate endDate, Integer bulan, Integer tahun) {
        
        // Base tunjangan kinerja
        Long tunjanganKinerja = pegawai.getTunjanganKinerja() != null ? pegawai.getTunjanganKinerja() : 0L;
        BigDecimal baseTunjangan = BigDecimal.valueOf(tunjanganKinerja);
        
        // Calculate attendance-based deductions
        Map<String, Object> statistikAbsen = calculateAbsensiStats(pegawai, startDate, endDate);
        BigDecimal potonganAbsen = calculatePotonganAbsen(pegawai, statistikAbsen, baseTunjangan, startDate, endDate);
        
        // Generate detailed attendance history and deduction breakdown
        List<LaporanTukinResponse.HistoriAbsensi> historiAbsensi = generateHistoriAbsensi(pegawai, startDate, endDate);
        List<LaporanTukinResponse.DetailPemotonganAbsen> detailPemotonganAbsenList = generateDetailPemotonganAbsen(pegawai, statistikAbsen, baseTunjangan, startDate, endDate);
        
        // Get other deductions for this period
        List<Pemotongan> pemotonganList = pemotonganRepository.findByPegawaiIdAndBulanPemotonganAndTahunPemotonganAndIsActiveTrue(
            pegawai.getId(), bulan, tahun);
        
        BigDecimal pemotonganLain = pemotonganList.stream()
                .map(p -> {
                    if (p.getNominalPemotongan() != null) {
                        return p.getNominalPemotongan();
                    } else if (p.getPersentasePemotongan() != null && baseTunjangan.compareTo(BigDecimal.ZERO) > 0) {
                        // Apply rumus baru untuk pemotongan lain dari database
                        BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                        return baseTunjangan.multiply(p.getPersentasePemotongan())
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                                .multiply(defaultFactor);
                    }
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        String detailPemotonganLain = pemotonganList.stream()
                .map(p -> p.getAlasanPemotongan() + " (" + p.getPersentasePemotongan() + "%)")
                .collect(Collectors.joining(", "));
        
        // ATURAN BARU: Maksimal pemotongan 100% dikali 60% sebagai default factor
        // Rumus: persentase_potongan * 60% * nilai_tunjangan
        // Contoh: 85% * 60% * 7.500.000 = 3.825.000
        
        // Calculate maximum possible deduction (100% * 60% of base salary)
        BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP); // 0.6
        BigDecimal maxPossibleDeduction = baseTunjangan.multiply(defaultFactor); // 60% dari tunjangan dasar
        
        // Hitung persentase aktual dari potongan absen (sebelum dikali 60%)
        BigDecimal attendancePercentage = BigDecimal.ZERO;
        if (baseTunjangan.compareTo(BigDecimal.ZERO) > 0) {
            // Persentase raw dari potongan absen (bisa lebih dari 100%)
            attendancePercentage = potonganAbsen.multiply(BigDecimal.valueOf(100))
                    .divide(baseTunjangan, 2, RoundingMode.HALF_UP);
        }
        
        // Apply aturan baru: maksimal 100% dikali 60% factor
        boolean attendanceCapped = false;
        if (attendancePercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            // Jika lebih dari 100%, batasi ke 100%
            attendancePercentage = BigDecimal.valueOf(100);
            attendanceCapped = true;
        }
        
        // Terapkan rumus baru: persentase * 60% * tunjangan
        potonganAbsen = baseTunjangan
                .multiply(attendancePercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(defaultFactor);
        
        if (attendanceCapped) {
            log.info("Applied 100% cap with 60% factor to attendance deductions for pegawai: {} ({}), max deduction: {}", 
                    pegawai.getNamaLengkap(), pegawai.getNip(), maxPossibleDeduction);
        }
        
        // Hitung persentase aktual dari pemotongan lain (sebelum dikali 60%)
        BigDecimal otherPercentage = BigDecimal.ZERO;
        if (baseTunjangan.compareTo(BigDecimal.ZERO) > 0) {
            otherPercentage = pemotonganLain.multiply(BigDecimal.valueOf(100))
                    .divide(baseTunjangan, 2, RoundingMode.HALF_UP);
        }
        
        // Apply aturan baru untuk pemotongan lain
        boolean otherCapped = false;
        if (otherPercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            otherPercentage = BigDecimal.valueOf(100);
            otherCapped = true;
        }
        
        // Terapkan rumus baru: persentase * 60% * tunjangan
        pemotonganLain = baseTunjangan
                .multiply(otherPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(defaultFactor);
        
        if (otherCapped) {
            log.info("Applied 100% cap with 60% factor to other deductions for pegawai: {} ({}), max deduction: {}", 
                    pegawai.getNamaLengkap(), pegawai.getNip(), maxPossibleDeduction);
        }
        
        // Total potongan (sudah menggunakan formula baru)
        BigDecimal totalPotongan = potonganAbsen.add(pemotonganLain);
        boolean totalCapped = attendanceCapped || otherCapped;
        
        BigDecimal tunjanganBersih = baseTunjangan.subtract(totalPotongan);
        if (tunjanganBersih.compareTo(BigDecimal.ZERO) < 0) {
            tunjanganBersih = BigDecimal.ZERO;
        }
        
        return LaporanTukinResponse.DetailPegawaiTukin.builder()
                .pegawaiId(pegawai.getId())
                .nip(pegawai.getNip())
                .namaLengkap(pegawai.getNamaLengkap())
                .jabatan(pegawai.getJabatan() != null ? pegawai.getJabatan().getNama() : "-")
                .lokasi(pegawai.getLokasi() != null ? pegawai.getLokasi().getNamaLokasi() : "-")
                .tunjanganKinerja(tunjanganKinerja)
                .statistikAbsen(statistikAbsen)
                .potonganAbsen(potonganAbsen)
                .detailPotonganAbsen(buildDetailPotonganAbsen(statistikAbsen))
                .pemotonganLain(pemotonganLain)
                .detailPemotonganLain(detailPemotonganLain)
                .totalPotongan(totalPotongan)
                .tunjanganBersih(tunjanganBersih)
                .isAttendanceCapped(attendanceCapped)
                .isOtherDeductionsCapped(otherCapped)
                .isTotalCapped(totalCapped)
                .maxPossibleDeduction(maxPossibleDeduction)
                .historiAbsensi(historiAbsensi)
                .detailPemotonganAbsenList(detailPemotonganAbsenList)
                .build();
    }
    
    private Map<String, Object> calculateAbsensiStats(Pegawai pegawai, LocalDate startDate, LocalDate endDate) {
        List<Absensi> absensiList = absensiRepository.findByPegawaiAndTanggalBetween(pegawai, startDate, endDate);
        
        // Get holidays for the period
        List<HariLibur> hariLiburList = hariLiburRepository.findByTanggalLiburBetweenAndIsActiveTrue(startDate, endDate);
        Set<LocalDate> hariLiburDates = hariLiburList.stream()
            .map(HariLibur::getTanggalLibur)
            .collect(Collectors.toSet());

        // Get approved cuti dates for the period
        List<Cuti> cutiListForStats = cutiRepository
            .findByPegawaiAndTanggalCutiBetweenOrderByCreatedAtDesc(pegawai, startDate, endDate, Pageable.unpaged())
            .getContent()
            .stream()
            .filter(c -> c.getStatusApproval() == Cuti.StatusApproval.DISETUJUI)
            .collect(Collectors.toList());
        Set<LocalDate> cutiDates = cutiListForStats.stream()
            .map(Cuti::getTanggalCuti)
            .collect(Collectors.toSet());
        
        Map<String, Object> stats = new HashMap<>();
        
        // Group by date to check daily attendance
        Map<LocalDate, List<Absensi>> absensiByDate = absensiList.stream()
                .collect(Collectors.groupingBy(Absensi::getTanggal));
        
        int totalHariKerja = 0;
        int totalHadir = 0;
        int totalTerlambat = 0;
        int totalPulangCepat = 0;
        int totalAlpha = 0;
        int totalCuti = 0;
        int totalTerlambatMenit = 0;
        int totalPulangCepatMenit = 0;
        
        // Check each working day in the period
        LocalDate currentDate = startDate;
        LocalDate today = LocalDate.now();
        while (!currentDate.isAfter(endDate)) {
            // Skip weekends (assuming Saturday=6, Sunday=7) and holidays
            if (currentDate.getDayOfWeek().getValue() < 6 && !hariLiburDates.contains(currentDate)) {
                // Only count past and present days for statistics, not future days
                if (!currentDate.isAfter(today)) {
                    totalHariKerja++;

                    // If this date is an approved cuti, count as cuti and skip penalty counting
                    if (cutiDates.contains(currentDate)) {
                        totalCuti++;
                        currentDate = currentDate.plusDays(1);
                        continue;
                    }
                    
                    List<Absensi> dayAbsensi = absensiByDate.get(currentDate);
                    if (dayAbsensi == null || dayAbsensi.isEmpty()) {
                        totalAlpha++;
                    } else {
                        boolean hasMasuk = dayAbsensi.stream().anyMatch(a -> a.getType() == Absensi.AbsensiType.MASUK);
                        boolean hasPulang = dayAbsensi.stream().anyMatch(a -> a.getType() == Absensi.AbsensiType.PULANG);
                        
                        if (hasMasuk && hasPulang) {
                            totalHadir++;
                            
                            // Check for late arrival and early departure based on shift
                            for (Absensi absen : dayAbsensi) {
                                if (absen.getType() == Absensi.AbsensiType.MASUK && 
                                    absen.getShift() != null && 
                                    absen.getShift().getJamMasuk() != null) {
                                    
                                    LocalTime shiftJamMasuk = LocalTime.parse(absen.getShift().getJamMasuk());
                                    if (absen.getWaktu().isAfter(shiftJamMasuk)) {
                                        totalTerlambat++;
                                        totalTerlambatMenit += (int) Duration.between(shiftJamMasuk, absen.getWaktu()).toMinutes();
                                    }
                                } else if (absen.getType() == Absensi.AbsensiType.PULANG && 
                                           absen.getShift() != null && 
                                           absen.getShift().getJamKeluar() != null) {
                                    
                                    LocalTime shiftJamKeluar = LocalTime.parse(absen.getShift().getJamKeluar());
                                    if (absen.getWaktu().isBefore(shiftJamKeluar)) {
                                        totalPulangCepat++;
                                        totalPulangCepatMenit += (int) Duration.between(absen.getWaktu(), shiftJamKeluar).toMinutes();
                                    }
                                }
                            }
                        } else {
                            totalAlpha++;
                        }
                    }
                }
            }
            currentDate = currentDate.plusDays(1);
        }
        
        stats.put("totalHariKerja", totalHariKerja);
        stats.put("totalHadir", totalHadir);
        stats.put("totalTerlambat", totalTerlambat);
        stats.put("totalPulangCepat", totalPulangCepat);
        stats.put("totalAlpha", totalAlpha);
        stats.put("cuti", totalCuti);
        stats.put("totalTerlambatMenit", totalTerlambatMenit);
        stats.put("totalPulangCepatMenit", totalPulangCepatMenit);
        
        return stats;
    }
    
    private BigDecimal calculatePotonganAbsen(Pegawai pegawai, Map<String, Object> statistikAbsen, BigDecimal baseTunjangan, LocalDate startDate, LocalDate endDate) {
        if (baseTunjangan.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        // Get the enhanced attendance history which has accurate daily deduction calculations
        List<LaporanTukinResponse.HistoriAbsensi> historiAbsensi = generateEnhancedHistoriAbsensi(
            pegawai, startDate, endDate
        );
        
        // Sum up all daily deductions from the enhanced history
        BigDecimal totalPemotongan = historiAbsensi.stream()
                .filter(h -> h.getNominalPemotongan() != null)
                .map(LaporanTukinResponse.HistoriAbsensi::getNominalPemotongan)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // TIDAK ada capping di sini - biarkan total pemotongan mentah
        // Capping akan diterapkan di calculateTukinForPegawai dengan formula baru
        
        return totalPemotongan;
    }
    
    private List<LaporanTukinResponse.HistoriAbsensi> generateHistoriAbsensi(Pegawai pegawai, LocalDate startDate, LocalDate endDate) {
        List<Absensi> absensiList = absensiRepository.findByPegawaiAndTanggalBetween(
            pegawai, startDate, endDate);
        
        // Group by date and type (MASUK/PULANG)
        Map<LocalDate, Map<Absensi.AbsensiType, Absensi>> absensiByDateAndType = absensiList.stream()
            .collect(Collectors.groupingBy(
                Absensi::getTanggal,
                Collectors.toMap(
                    Absensi::getType,
                    Function.identity(),
                    (existing, replacement) -> existing // Keep first if duplicate
                )
            ));
        
        List<LaporanTukinResponse.HistoriAbsensi> historiAbsensi = new ArrayList<>();
        
        LocalDate currentDate = startDate;
        LocalDate today = LocalDate.now();
        while (!currentDate.isAfter(endDate)) {
            Map<Absensi.AbsensiType, Absensi> dayAbsensi = absensiByDateAndType.get(currentDate);
            
            String jamMasuk = null;
            String jamPulang = null;
            String statusMasuk = currentDate.isAfter(today) ? "MENDATANG" : "ALPHA";
            String statusPulang = currentDate.isAfter(today) ? "MENDATANG" : "ALPHA";
            int menitTerlambat = 0;
            int menitPulangCepat = 0;
            String keterangan = "";
            boolean hasPemotongan = false;
            
            if (dayAbsensi != null) {
                // Process MASUK data
                Absensi absenMasuk = dayAbsensi.get(Absensi.AbsensiType.MASUK);
                if (absenMasuk != null) {
                    jamMasuk = absenMasuk.getWaktu().toString();
                    statusMasuk = "HADIR";
                    keterangan = absenMasuk.getKeterangan() != null ? absenMasuk.getKeterangan() : "";
                    
                    // Check if late based on shift schedule
                    if (absenMasuk.getShift() != null && absenMasuk.getShift().getJamMasuk() != null) {
                        LocalTime shiftJamMasuk = LocalTime.parse(absenMasuk.getShift().getJamMasuk());
                        if (absenMasuk.getWaktu().isAfter(shiftJamMasuk)) {
                            menitTerlambat = (int) Duration.between(shiftJamMasuk, absenMasuk.getWaktu()).toMinutes();
                            statusMasuk = "TERLAMBAT";
                            hasPemotongan = true;
                        }
                    }
                }
                
                // Process PULANG data
                Absensi absenPulang = dayAbsensi.get(Absensi.AbsensiType.PULANG);
                if (absenPulang != null) {
                    jamPulang = absenPulang.getWaktu().toString();
                    statusPulang = "HADIR";
                    
                    // Check if early departure based on shift schedule
                    if (absenPulang.getShift() != null && absenPulang.getShift().getJamKeluar() != null) {
                        LocalTime shiftJamKeluar = LocalTime.parse(absenPulang.getShift().getJamKeluar());
                        if (absenPulang.getWaktu().isBefore(shiftJamKeluar)) {
                            menitPulangCepat = (int) Duration.between(absenPulang.getWaktu(), shiftJamKeluar).toMinutes();
                            statusPulang = "PULANG_CEPAT";
                            hasPemotongan = true;
                        }
                    }
                    
                    if (keterangan.isEmpty() && absenPulang.getKeterangan() != null) {
                        keterangan = absenPulang.getKeterangan();
                    }
                }
                
                // If no attendance at all for this date
                if (absenMasuk == null && absenPulang == null) {
                    // Don't apply penalty for future dates
                    hasPemotongan = !currentDate.isAfter(today);
                }
            } else {
                // No attendance record for this date
                // Don't apply penalty for future dates
                hasPemotongan = !currentDate.isAfter(today);
                keterangan = currentDate.isAfter(today) ? "Belum terjadi" : "Tidak ada data absensi";
            }
            
            historiAbsensi.add(LaporanTukinResponse.HistoriAbsensi.builder()
                .tanggal(currentDate.toString())
                .hari(currentDate.getDayOfWeek().name())
                .jamMasuk(jamMasuk)
                .jamPulang(jamPulang)
                .statusMasuk(statusMasuk)
                .statusPulang(statusPulang)
                .menitTerlambat(menitTerlambat)
                .menitPulangCepat(menitPulangCepat)
                .keterangan(keterangan)
                .hasPemotongan(hasPemotongan)
                .build());
            
            currentDate = currentDate.plusDays(1);
        }
        
        return historiAbsensi;
    }
    
    private List<LaporanTukinResponse.HistoriAbsensi> generateEnhancedHistoriAbsensi(Pegawai pegawai, LocalDate startDate, LocalDate endDate) {
        List<Absensi> absensiList = absensiRepository.findByPegawaiAndTanggalBetween(
            pegawai, startDate, endDate);
        
        // Get approved cuti for the period
        List<Cuti> cutiList = cutiRepository.findByPegawaiAndTanggalCutiBetweenOrderByCreatedAtDesc(
            pegawai, startDate, endDate, Pageable.unpaged()).getContent()
            .stream()
            .filter(c -> c.getStatusApproval() == Cuti.StatusApproval.DISETUJUI)
            .collect(Collectors.toList());
        
        // Create map for quick cuti lookup
        Map<LocalDate, Cuti> cutiByDate = cutiList.stream()
            .collect(Collectors.toMap(Cuti::getTanggalCuti, Function.identity(), (existing, replacement) -> existing));
        
        // Get holidays for the period to exclude from deductions
        List<HariLibur> hariLiburList = hariLiburRepository.findByTanggalLiburBetweenAndIsActiveTrue(startDate, endDate);
        Set<LocalDate> hariLiburDates = hariLiburList.stream()
            .map(HariLibur::getTanggalLibur)
            .collect(Collectors.toSet());
        
        // Get pemotongan rules for percentage calculation
        List<PemotonganAbsen> pemotonganRules = pemotonganAbsenRepository.findAllActiveOrderByKode();
        Map<String, BigDecimal> rulePercentages = pemotonganRules.stream()
                .collect(Collectors.toMap(
                    PemotonganAbsen::getKode,
                    PemotonganAbsen::getPersentase,
                    (existing, replacement) -> existing
                ));
        
        // Group by date and type (MASUK/PULANG)
        Map<LocalDate, Map<Absensi.AbsensiType, Absensi>> absensiByDateAndType = absensiList.stream()
            .collect(Collectors.groupingBy(
                Absensi::getTanggal,
                Collectors.toMap(
                    Absensi::getType,
                    Function.identity(),
                    (existing, replacement) -> existing // Keep first if duplicate
                )
            ));
        
        List<LaporanTukinResponse.HistoriAbsensi> historiAbsensi = new ArrayList<>();
        
        LocalDate currentDate = startDate;
        LocalDate today = LocalDate.now();
        while (!currentDate.isAfter(endDate)) {
            Map<Absensi.AbsensiType, Absensi> dayAbsensi = absensiByDateAndType.get(currentDate);
            
            String jamMasuk = null;
            String jamPulang = null;
            String statusMasuk = currentDate.isAfter(today) ? "MENDATANG" : "ALPHA";
            String statusPulang = currentDate.isAfter(today) ? "MENDATANG" : "ALPHA";
            int menitTerlambat = 0;
            int menitPulangCepat = 0;
            String keterangan = "";
            List<String> detailPemotongan = new ArrayList<>();
            
            // Declare absensi variables outside the if block
            Absensi absenMasuk = null;
            Absensi absenPulang = null;
            
            // If approved cuti on this date, mark as CUTI or SAKIT based on tipeCuti
            if (cutiByDate.containsKey(currentDate)) {
                Cuti cuti = cutiByDate.get(currentDate);
                String tipeCutiText = (cuti.getTipeCuti() != null && cuti.getTipeCuti() == Cuti.TipeCuti.SAKIT) ? "SAKIT" : "CUTI";
                statusMasuk = tipeCutiText;
                statusPulang = tipeCutiText;
                
                if (cuti.getTipeCuti() != null && cuti.getTipeCuti() == Cuti.TipeCuti.SAKIT) {
                    keterangan = "Sakit: " + (cuti.getAlasanCuti() != null ? cuti.getAlasanCuti() : "Disetujui");
                } else {
                    keterangan = "Cuti: " + (cuti.getJenisCuti() != null ? cuti.getJenisCuti().getNamaCuti() : "Disetujui");
                }
                
                // No deductions for cuti/sakit
                LaporanTukinResponse.HistoriAbsensi entry = LaporanTukinResponse.HistoriAbsensi.builder()
                    .tanggal(currentDate.toString())
                    .hari(currentDate.getDayOfWeek().name())
                    .jamMasuk(jamMasuk)
                    .jamPulang(jamPulang)
                    .statusMasuk(statusMasuk)
                    .statusPulang(statusPulang)
                    .menitTerlambat(0)
                    .menitPulangCepat(0)
                    .keterangan(keterangan)
                    .hasPemotongan(false)
                    .namaShift(null)
                    .lockLokasi(null)
                    .nominalPemotongan(BigDecimal.ZERO)
                    .persentasePemotongan(BigDecimal.ZERO)
                    .detailPemotongan("")
                    .status(tipeCutiText)
                    .build();
                historiAbsensi.add(entry);
                currentDate = currentDate.plusDays(1);
                continue;
            }

            if (dayAbsensi != null) {
                // Process MASUK data
                absenMasuk = dayAbsensi.get(Absensi.AbsensiType.MASUK);
                if (absenMasuk != null) {
                    jamMasuk = absenMasuk.getWaktu().toString();
                    statusMasuk = "HADIR";
                    keterangan = absenMasuk.getKeterangan() != null ? absenMasuk.getKeterangan() : "";
                    
                    // Check if late based on shift schedule
                    if (absenMasuk.getShift() != null && absenMasuk.getShift().getJamMasuk() != null) {
                        LocalTime shiftJamMasuk = LocalTime.parse(absenMasuk.getShift().getJamMasuk());
                        if (absenMasuk.getWaktu().isAfter(shiftJamMasuk)) {
                            menitTerlambat = (int) Duration.between(shiftJamMasuk, absenMasuk.getWaktu()).toMinutes();
                            statusMasuk = "TERLAMBAT";
                            
                            // Determine appropriate late penalty based on minutes
                            BigDecimal percentage;
                            if (menitTerlambat <= 30) {
                                percentage = rulePercentages.getOrDefault("TL0", BigDecimal.valueOf(0.00));
                            } else if (menitTerlambat <= 60) {
                                percentage = rulePercentages.getOrDefault("TL1", BigDecimal.valueOf(0.50));
                            } else if (menitTerlambat <= 90) {
                                percentage = rulePercentages.getOrDefault("TL2", BigDecimal.valueOf(1.25));
                            } else {
                                percentage = rulePercentages.getOrDefault("TL3", BigDecimal.valueOf(2.50));
                            }
                            
                            // Only mark as having deduction if percentage > 0
                            if (percentage.compareTo(BigDecimal.ZERO) > 0) {
                                // Add initial detail - will be updated later if compensated
                                detailPemotongan.add("Terlambat " + menitTerlambat + " menit (" + percentage + "%)");
                            } else {
                                // Still late but no penalty
                                detailPemotongan.add("Terlambat " + menitTerlambat + " menit (tidak ada potongan)");
                            }
                        }
                    }
                } else {
                    // No check-in record
                    BigDecimal percentage = rulePercentages.getOrDefault("TIDAK_MASUK", BigDecimal.valueOf(2.5));
                    detailPemotongan.add("Tidak masuk (" + percentage + "%)");
                }
                
                // Process PULANG data
                absenPulang = dayAbsensi.get(Absensi.AbsensiType.PULANG);
                if (absenPulang != null) {
                    jamPulang = absenPulang.getWaktu().toString();
                    statusPulang = "HADIR";
                    
                    // Check if early departure based on shift schedule
                    if (absenPulang.getShift() != null && absenPulang.getShift().getJamKeluar() != null) {
                        LocalTime shiftJamKeluar = LocalTime.parse(absenPulang.getShift().getJamKeluar());
                        if (absenPulang.getWaktu().isBefore(shiftJamKeluar)) {
                            menitPulangCepat = (int) Duration.between(absenPulang.getWaktu(), shiftJamKeluar).toMinutes();
                            statusPulang = "PULANG_CEPAT";
                            
                            // Determine appropriate early departure penalty based on minutes
                            BigDecimal percentage;
                            if (menitPulangCepat <= 30) {
                                percentage = rulePercentages.getOrDefault("PSW1", BigDecimal.valueOf(0.50));
                            } else if (menitPulangCepat <= 60) {
                                percentage = rulePercentages.getOrDefault("PSW2", BigDecimal.valueOf(1.25));
                            } else {
                                percentage = rulePercentages.getOrDefault("PSW3", BigDecimal.valueOf(2.50));
                            }
                            
                            detailPemotongan.add("Pulang cepat " + menitPulangCepat + " menit (" + percentage + "%)");
                        }
                    }
                    
                    if (keterangan.isEmpty() && absenPulang.getKeterangan() != null) {
                        keterangan = absenPulang.getKeterangan();
                    }
                } else if (absenMasuk != null) {
                    // Has check-in but no check-out - Lupa Absen Pulang
                    BigDecimal percentage = rulePercentages.getOrDefault("LAP", BigDecimal.valueOf(2.5));
                    detailPemotongan.add("Lupa absen pulang (" + percentage + "%)");
                }
                
                // If no attendance at all for this date
                if (absenMasuk == null && absenPulang == null) {
                    // Check if it's a future date first
                    if (currentDate.isAfter(today)) {
                        // Already set to MENDATANG in initialization, no deduction
                        keterangan = "Belum terjadi";
                    } else {
                        // Already handled cuti earlier; treat as tidak absen
                            BigDecimal percentage = rulePercentages.getOrDefault("TA", BigDecimal.valueOf(5.0));
                            detailPemotongan.add("Tidak absen (" + percentage + "%)");
                    }
                }
            } else {
                // No attendance record for this date
                // Check if it's a future date first
                if (currentDate.isAfter(today)) {
                    // Already set to MENDATANG in initialization, no deduction
                    keterangan = "Belum terjadi";
                } else {
                    // Check if it's a holiday first
                    if (hariLiburDates.contains(currentDate)) {
                        statusMasuk = "LIBUR";
                        statusPulang = "LIBUR";
                        keterangan = "Hari Libur";
                        // No deduction for holidays
                    } else {
                            // No attendance record and no cuti and no holiday - Tidak Absen
                            keterangan = "Tidak ada data absensi";
                            BigDecimal percentage = rulePercentages.getOrDefault("TA", BigDecimal.valueOf(5.0));
                            detailPemotongan.add("Tidak absen (" + percentage + "%)");
                    }
                }
            }
            
            // Calculate deduction amounts and percentages for this day
            BigDecimal dailyDeduction = BigDecimal.ZERO;
            BigDecimal dailyPercentage = BigDecimal.ZERO;
            String combinedStatus = "HADIR";
            
            // Re-evaluate hasPemotongan based on actual penalties
            boolean actuallyHasPemotongan = false;
            
            if (statusMasuk.equals("TERLAMBAT")) {
                // Calculate late penalty based on minutes
                BigDecimal percentage;
                if (menitTerlambat <= 30) {
                    percentage = rulePercentages.getOrDefault("TL0", BigDecimal.valueOf(0.00));
                } else if (menitTerlambat <= 60) {
                    percentage = rulePercentages.getOrDefault("TL1", BigDecimal.valueOf(0.50));
                } else if (menitTerlambat <= 90) {
                    percentage = rulePercentages.getOrDefault("TL2", BigDecimal.valueOf(1.25));
                } else {
                    percentage = rulePercentages.getOrDefault("TL3", BigDecimal.valueOf(2.50));
                }
                
                // NEW RULE: Check for overtime compensation for late arrival (31-90 minutes only)
                // Only minutes ABOVE 30 need compensation at 2x rate
                boolean canCompensateWithOvertime = false;
                
                if (menitTerlambat > 30 && menitTerlambat <= 90 && absenPulang != null) {
                    // Calculate overtime minutes (working beyond scheduled end time)
                    if (absenPulang.getShift() != null && absenPulang.getShift().getJamKeluar() != null) {
                        LocalTime shiftJamKeluar = LocalTime.parse(absenPulang.getShift().getJamKeluar());
                        if (absenPulang.getWaktu().isAfter(shiftJamKeluar)) {
                            int overtimeMinutes = (int) Duration.between(shiftJamKeluar, absenPulang.getWaktu()).toMinutes();
                            
                            // Only compensate for minutes above 30 (since 0-30 minutes have 0% penalty)
                            int compensableLateness = menitTerlambat - 30;
                            int requiredCompensation = compensableLateness * 2; // 2x compensation for compensable late minutes
                            
                            if (overtimeMinutes >= requiredCompensation) {
                                canCompensateWithOvertime = true;
                                // Reset percentage to zero since compensation is successful
                                percentage = BigDecimal.ZERO;
                                // Update detail to show compensation
                                final int finalMenitTerlambat = menitTerlambat;
                                detailPemotongan.removeIf(detail -> detail.contains("Terlambat " + finalMenitTerlambat + " menit"));
                                detailPemotongan.add("Terlambat " + menitTerlambat + " menit (dikompensasi lembur " + 
                                    overtimeMinutes + " menit untuk " + compensableLateness + " menit telat, perlu " + requiredCompensation + " menit)");
                            }
                        }
                    }
                }
                
                // Add percentage to daily total (will be 0 if compensated)
                if (percentage.compareTo(BigDecimal.ZERO) > 0) {
                    actuallyHasPemotongan = true;
                    dailyPercentage = dailyPercentage.add(percentage);
                }
                
                if (canCompensateWithOvertime) {
                    combinedStatus = "TERLAMBAT (DIKOMPENSASI LEMBUR)";
                } else {
                    combinedStatus = "TERLAMBAT";
                }
            }
            
            if (statusPulang.equals("PULANG_CEPAT")) {
                // Calculate early departure penalty based on minutes
                BigDecimal percentage;
                if (menitPulangCepat <= 30) {
                    percentage = rulePercentages.getOrDefault("PSW1", BigDecimal.valueOf(0.50));
                } else if (menitPulangCepat <= 60) {
                    percentage = rulePercentages.getOrDefault("PSW2", BigDecimal.valueOf(1.25));
                } else {
                    percentage = rulePercentages.getOrDefault("PSW3", BigDecimal.valueOf(2.50));
                }
                actuallyHasPemotongan = true;
                dailyPercentage = dailyPercentage.add(percentage);
                combinedStatus = statusMasuk.equals("TERLAMBAT") ? "TERLAMBAT + PULANG CEPAT" : "PULANG CEPAT";
            }
            
            if (statusMasuk.equals("CUTI")) {
                combinedStatus = "CUTI";
                actuallyHasPemotongan = false; // No deduction for approved cuti
            } else if (statusMasuk.equals("LIBUR")) {
                combinedStatus = "LIBUR";
                actuallyHasPemotongan = false; // No deduction for holidays
            } else if (statusMasuk.equals("MENDATANG")) {
                combinedStatus = "MENDATANG";
                actuallyHasPemotongan = false; // No deduction for future dates
            } else if (statusMasuk.equals("ALPHA") || (absenMasuk == null && absenPulang == null && !statusMasuk.equals("CUTI") && !statusMasuk.equals("LIBUR") && !statusMasuk.equals("MENDATANG"))) {
                BigDecimal percentage = rulePercentages.getOrDefault("TA", BigDecimal.valueOf(5.0));
                actuallyHasPemotongan = true;
                dailyPercentage = percentage;
                combinedStatus = "ALPHA";
            } else if (absenMasuk != null && absenPulang == null) {
                // Lupa Absen Pulang
                BigDecimal percentage = rulePercentages.getOrDefault("LAP", BigDecimal.valueOf(2.5));
                actuallyHasPemotongan = true;
                dailyPercentage = dailyPercentage.add(percentage);
                combinedStatus = statusMasuk.equals("TERLAMBAT") ? "TERLAMBAT + LUPA ABSEN PULANG" : "LUPA ABSEN PULANG";
            } else if (absenMasuk == null && absenPulang != null) {
                // Lupa Absen Masuk
                BigDecimal percentage = rulePercentages.getOrDefault("LAM", BigDecimal.valueOf(2.5));
                actuallyHasPemotongan = true;
                dailyPercentage = dailyPercentage.add(percentage);
                combinedStatus = "LUPA ABSEN MASUK";
            }
            
            // Calculate nominal deduction only if there's actual penalty
            if (actuallyHasPemotongan) {
                BigDecimal baseTunjangan = pegawai.getTunjanganKinerja() != null ? 
                    BigDecimal.valueOf(pegawai.getTunjanganKinerja()) : BigDecimal.valueOf(1000000);
                dailyDeduction = baseTunjangan.multiply(dailyPercentage).divide(BigDecimal.valueOf(100));
            } else {
                // No actual penalty, reset status to HADIR if only late <= 30 min
                if (statusMasuk.equals("TERLAMBAT") && !statusPulang.equals("PULANG_CEPAT")) {
                    combinedStatus = "HADIR";
                }
            }
            
            // Get shift information for determining work location
            String namaShift = null;
            String lockLokasi = null;
            
            // Use shift info from attendance records if available
            if (absenMasuk != null && absenMasuk.getShift() != null) {
                namaShift = absenMasuk.getShift().getNamaShift();
                lockLokasi = absenMasuk.getShift().getLockLokasi();
            } else if (absenPulang != null && absenPulang.getShift() != null) {
                namaShift = absenPulang.getShift().getNamaShift();
                lockLokasi = absenPulang.getShift().getLockLokasi();
            }
            
            // Combine keterangan with pemotongan details
            String finalKeterangan = keterangan;
            if (!detailPemotongan.isEmpty()) {
                String pemotonganDetail = String.join(", ", detailPemotongan);
                finalKeterangan = keterangan.isEmpty() ? pemotonganDetail : keterangan + " - " + pemotonganDetail;
            }
            
            historiAbsensi.add(LaporanTukinResponse.HistoriAbsensi.builder()
                .tanggal(currentDate.toString())
                .hari(currentDate.getDayOfWeek().name())
                .jamMasuk(jamMasuk)
                .jamPulang(jamPulang)
                .statusMasuk(statusMasuk)
                .statusPulang(statusPulang)
                .menitTerlambat(menitTerlambat)
                .menitPulangCepat(menitPulangCepat)
                .keterangan(finalKeterangan)
                .hasPemotongan(actuallyHasPemotongan)
                .namaShift(namaShift)
                .lockLokasi(lockLokasi)
                .nominalPemotongan(dailyDeduction)
                .persentasePemotongan(dailyPercentage)
                .detailPemotongan(String.join(", ", detailPemotongan))
                .status(combinedStatus)
                .build());
            
            currentDate = currentDate.plusDays(1);
        }
        
        return historiAbsensi;
    }
    
    private List<LaporanTukinResponse.DetailPemotonganAbsen> generateDetailPemotonganAbsen(
            Pegawai pegawai, Map<String, Object> statistikAbsen, BigDecimal baseTunjangan, 
            LocalDate startDate, LocalDate endDate) {
        
        List<LaporanTukinResponse.DetailPemotonganAbsen> detailList = new ArrayList<>();
        
        // Get deduction rules
        List<PemotonganAbsen> pemotonganAbsenRules = pemotonganAbsenRepository.findAllActiveOrderByKode();
        
        // Get attendance data for the period
        List<Absensi> absensiList = absensiRepository.findByPegawaiAndTanggalBetween(
            pegawai, startDate, endDate);
        
        for (PemotonganAbsen rule : pemotonganAbsenRules) {
            String kode = rule.getKode();
            List<String> tanggalKejadian = new ArrayList<>();
            int jumlahKejadian = 0;
            BigDecimal nominalPotongan = BigDecimal.ZERO;
            
            switch (kode) {
                case "ALPA":
                    // Count days without any check-in or check-out record
                    LocalDate checkDate = startDate;
                    while (!checkDate.isAfter(endDate)) {
                        Set<LocalDate> attendanceDates = absensiList.stream()
                            .map(Absensi::getTanggal)
                            .collect(Collectors.toSet());
                        
                        if (!attendanceDates.contains(checkDate)) {
                            tanggalKejadian.add(checkDate.toString());
                            jumlahKejadian++;
                        }
                        checkDate = checkDate.plusDays(1);
                    }
                    break;
                    
                case "TERLAMBAT":
                    // Count late arrivals based on shift schedule
                    for (Absensi absensi : absensiList) {
                        if (absensi.getType() == Absensi.AbsensiType.MASUK &&
                            absensi.getWaktu() != null && 
                            absensi.getShift() != null && 
                            absensi.getShift().getJamMasuk() != null) {
                            
                            LocalTime shiftJamMasuk = LocalTime.parse(absensi.getShift().getJamMasuk());
                            if (absensi.getWaktu().isAfter(shiftJamMasuk)) {
                                tanggalKejadian.add(absensi.getTanggal().toString());
                                jumlahKejadian++;
                            }
                        }
                    }
                    break;
                    
                case "PULANG_CEPAT":
                    // Count early departures based on shift schedule
                    for (Absensi absensi : absensiList) {
                        if (absensi.getType() == Absensi.AbsensiType.PULANG &&
                            absensi.getWaktu() != null && 
                            absensi.getShift() != null && 
                            absensi.getShift().getJamKeluar() != null) {
                            
                            LocalTime shiftJamKeluar = LocalTime.parse(absensi.getShift().getJamKeluar());
                            if (absensi.getWaktu().isBefore(shiftJamKeluar)) {
                                tanggalKejadian.add(absensi.getTanggal().toString());
                                jumlahKejadian++;
                            }
                        }
                    }
                    break;
                    
                case "TIDAK_MASUK":
                    // Count days without check-in record
                    Set<LocalDate> masukDates = absensiList.stream()
                        .filter(a -> a.getType() == Absensi.AbsensiType.MASUK)
                        .map(Absensi::getTanggal)
                        .collect(Collectors.toSet());
                    
                    LocalDate checkMasukDate = startDate;
                    while (!checkMasukDate.isAfter(endDate)) {
                        if (!masukDates.contains(checkMasukDate)) {
                            tanggalKejadian.add(checkMasukDate.toString());
                            jumlahKejadian++;
                        }
                        checkMasukDate = checkMasukDate.plusDays(1);
                    }
                    break;
                    
                case "LAP":
                    // Count days without check-out record (Lupa Absen Pulang)
                    Set<LocalDate> pulangDates = absensiList.stream()
                        .filter(a -> a.getType() == Absensi.AbsensiType.PULANG)
                        .map(Absensi::getTanggal)
                        .collect(Collectors.toSet());
                    
                    LocalDate checkPulangDate = startDate;
                    while (!checkPulangDate.isAfter(endDate)) {
                        if (!pulangDates.contains(checkPulangDate)) {
                            tanggalKejadian.add(checkPulangDate.toString());
                            jumlahKejadian++;
                        }
                        checkPulangDate = checkPulangDate.plusDays(1);
                    }
                    break;
            }
            
            // Calculate deduction amount if there are violations
            if (jumlahKejadian > 0) {
                nominalPotongan = baseTunjangan
                    .multiply(rule.getPersentase())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(jumlahKejadian));
                
                String detailKejadian = "Tanggal: " + String.join(", ", tanggalKejadian);
                
                detailList.add(LaporanTukinResponse.DetailPemotonganAbsen.builder()
                    .kodePemotongan(rule.getKode())
                    .namaPemotongan(rule.getNama())
                    .deskripsiPemotongan(rule.getDeskripsi())
                    .persentasePemotongan(rule.getPersentase())
                    .jumlahKejadian(jumlahKejadian)
                    .nominalPemotongan(nominalPotongan)
                    .detailKejadian(detailKejadian)
                    .tanggalKejadian(tanggalKejadian)
                    .build());
            }
        }
        
        return detailList;
    }

    private String buildDetailPotonganAbsen(Map<String, Object> statistikAbsen) {
        List<String> details = new ArrayList<>();
        
        // Get pemotongan absen rules to display actual percentages
        List<PemotonganAbsen> rules = pemotonganAbsenRepository.findAllActiveOrderByKode();
        Map<String, BigDecimal> rulePercentages = rules.stream()
                .collect(Collectors.toMap(
                    PemotonganAbsen::getKode,
                    PemotonganAbsen::getPersentase,
                    (existing, replacement) -> existing
                ));
        
        int totalAlpha = (Integer) statistikAbsen.get("totalAlpha");
        int totalTerlambat = (Integer) statistikAbsen.get("totalTerlambat");
        int totalPulangCepat = (Integer) statistikAbsen.get("totalPulangCepat");
        int totalTerlambatMenit = (Integer) statistikAbsen.get("totalTerlambatMenit");
        int totalPulangCepatMenit = (Integer) statistikAbsen.get("totalPulangCepatMenit");
        
        if (totalAlpha > 0) {
            BigDecimal percentage = rulePercentages.getOrDefault("TA", BigDecimal.valueOf(5.0));
            details.add("Tidak absen: " + totalAlpha + " hari (" + percentage + "% per hari)");
        }
        if (totalTerlambat > 0) {
            BigDecimal percentage = rulePercentages.getOrDefault("TERLAMBAT", 
                rulePercentages.getOrDefault("T40", BigDecimal.valueOf(0.5)));
            details.add("Terlambat: " + totalTerlambat + " kali, " + totalTerlambatMenit + " menit (" + percentage + "%)");
        }
        if (totalPulangCepat > 0) {
            BigDecimal percentage = rulePercentages.getOrDefault("PULANG_CEPAT", 
                rulePercentages.getOrDefault("PC70", BigDecimal.valueOf(2.5)));
            details.add("Pulang Cepat: " + totalPulangCepat + " kali, " + totalPulangCepatMenit + " menit (" + percentage + "%)");
        }
        
        return details.isEmpty() ? "Tidak ada potongan absen" : String.join(", ", details);
    }
    
    public Page<LaporanTukinResponse> getHistoriLaporan(int page, int size, Integer bulan, Integer tahun, String status) {
        log.info("Getting admin laporan tukin history with filters: bulan={}, tahun={}, status={}", bulan, tahun, status);
        
        Pageable pageable = PageRequest.of(page, size);
        // Use admin-specific filter to exclude personal reports
        Page<LaporanTukin> laporanPage = laporanTukinRepository.findAdminReportsWithFilters(bulan, tahun, status, pageable);
        
        return laporanPage.map(this::convertToResponse);
    }
    
    public LaporanTukinResponse getLaporanById(Long id) {
        LaporanTukin laporan = laporanTukinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        return convertToResponse(laporan);
    }
    
    @Transactional(timeout = 300, readOnly = true)
    public LaporanTukinResponse getLaporanByIdWithDetail(Long id, Long pegawaiId) {
        LaporanTukin laporan = laporanTukinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        return convertToResponseWithDetail(laporan, pegawaiId);
    }
    
    @Transactional(timeout = 300, readOnly = true)
    public List<LaporanTukinResponse.DetailPegawaiTukin> getRincianDetailPerPegawai(Long laporanId, Long pegawaiId) {
        LaporanTukin laporan = laporanTukinRepository.findById(laporanId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        LocalDate startDate = laporan.getTanggalMulai();
        LocalDate endDate = laporan.getTanggalAkhir();
        
        List<Pegawai> pegawaiList;
        if (pegawaiId != null) {
            // Get specific pegawai
            Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
            pegawaiList = List.of(pegawai);
        } else {
            // Get all active employees
            pegawaiList = pegawaiRepository.findByIsActive(true);
        }
        
        List<LaporanTukinResponse.DetailPegawaiTukin> detailPegawai = new ArrayList<>();
        
        for (Pegawai pegawai : pegawaiList) {
            LaporanTukinResponse.DetailPegawaiTukin detail = calculateTukinForPegawaiWithEnhancedDetail(
                pegawai, startDate, endDate, laporan.getBulan(), laporan.getTahun());
            detailPegawai.add(detail);
        }
        
        return detailPegawai;
    }

    /**
     * Paginated version of getRincianDetailPerPegawai with bulk pre-fetching for better performance.
     * - When pegawaiId is specified: returns full detail (with historiAbsensi) for that one employee
     * - When paginating all employees: strips historiAbsensi to reduce payload and computation
     */
    @Transactional(timeout = 300, readOnly = true)
    public Page<LaporanTukinResponse.DetailPegawaiTukin> getRincianDetailPerPegawaiPaginated(
            Long laporanId, Long pegawaiId, int page, int size) {
        LaporanTukin laporan = laporanTukinRepository.findById(laporanId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));

        LocalDate startDate = laporan.getTanggalMulai();
        LocalDate endDate = laporan.getTanggalAkhir();

        // If specific employee requested, return full detail (with historiAbsensi)
        if (pegawaiId != null) {
            Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
            LaporanTukinResponse.DetailPegawaiTukin detail =
                    calculateTukinForPegawaiWithEnhancedDetail(
                            pegawai, startDate, endDate, laporan.getBulan(), laporan.getTahun());
            return new PageImpl<>(List.of(detail), PageRequest.of(0, 1), 1);
        }

        // Paginated mode: fetch a page of employees and bulk-load shared data once
        Pageable pageable = PageRequest.of(page, size, Sort.by("namaLengkap").ascending());
        Page<Pegawai> pegawaiPage = pegawaiRepository.findByIsActive(true, pageable);

        // Bulk pre-fetch shared data ONCE for the entire period (massive N+1 reduction)
        Set<LocalDate> hariLiburDates = hariLiburRepository
                .findByTanggalLiburBetweenAndIsActiveTrue(startDate, endDate)
                .stream()
                .map(HariLibur::getTanggalLibur)
                .collect(Collectors.toSet());

        List<PemotonganAbsen> pemotonganRules = pemotonganAbsenRepository.findAllActiveOrderByKode();

        // Bulk fetch ALL absensi for all employees in this page within the date range
        List<Long> pegawaiIds = pegawaiPage.getContent().stream()
                .map(Pegawai::getId).collect(Collectors.toList());
        Map<Long, List<Absensi>> absensiByPegawai = absensiRepository
                .findByTanggalBetween(startDate, endDate)
                .stream()
                .filter(a -> pegawaiIds.contains(a.getPegawai().getId()))
                .collect(Collectors.groupingBy(a -> a.getPegawai().getId()));

        // Bulk fetch ALL approved cuti for the period for employees in this page
        Map<Long, Map<LocalDate, Cuti>> cutiByPegawai = cutiRepository
                .findApprovedCutiByDateRange(startDate, endDate)
                .stream()
                .filter(c -> pegawaiIds.contains(c.getPegawai().getId()))
                .collect(Collectors.groupingBy(
                        c -> c.getPegawai().getId(),
                        Collectors.toMap(Cuti::getTanggalCuti, Function.identity(),
                                (existing, replacement) -> existing)));

        List<LaporanTukinResponse.DetailPegawaiTukin> detailPegawai = new ArrayList<>();
        for (Pegawai pegawai : pegawaiPage.getContent()) {
            List<Absensi> pegawaiAbsensi = absensiByPegawai.getOrDefault(pegawai.getId(), Collections.emptyList());
            Map<LocalDate, Cuti> pegawaiCuti = cutiByPegawai.getOrDefault(pegawai.getId(), Collections.emptyMap());

            LaporanTukinResponse.DetailPegawaiTukin detail =
                    calculateTukinForPegawaiWithBulkData(
                            pegawai, startDate, endDate, laporan.getBulan(), laporan.getTahun(),
                            pegawaiAbsensi, pegawaiCuti, hariLiburDates, pemotonganRules,
                            false /* excludeHistoriAbsensi for list view */);
            detailPegawai.add(detail);
        }

        return new PageImpl<>(detailPegawai, pageable, pegawaiPage.getTotalElements());
    }
    
    private LaporanTukinResponse.DetailPegawaiTukin calculateTukinForPegawaiWithEnhancedDetail(
            Pegawai pegawai, LocalDate startDate, LocalDate endDate, Integer bulan, Integer tahun) {
        
        // Base tunjangan kinerja
        Long tunjanganKinerja = pegawai.getTunjanganKinerja() != null ? pegawai.getTunjanganKinerja() : 0L;
        BigDecimal baseTunjangan = BigDecimal.valueOf(tunjanganKinerja);
        
        // Calculate attendance-based deductions
        Map<String, Object> statistikAbsen = calculateAbsensiStats(pegawai, startDate, endDate);
        BigDecimal potonganAbsen = calculatePotonganAbsen(pegawai, statistikAbsen, baseTunjangan, startDate, endDate);
        
        // Generate enhanced attendance history with deduction details
        List<LaporanTukinResponse.HistoriAbsensi> historiAbsensi = generateEnhancedHistoriAbsensi(pegawai, startDate, endDate);
        List<LaporanTukinResponse.DetailPemotonganAbsen> detailPemotonganAbsenList = generateDetailPemotonganAbsen(pegawai, statistikAbsen, baseTunjangan, startDate, endDate);
        
        // Get other deductions for this period
        List<Pemotongan> pemotonganList = pemotonganRepository.findByPegawaiIdAndBulanPemotonganAndTahunPemotonganAndIsActiveTrue(
            pegawai.getId(), bulan, tahun);
        
        BigDecimal pemotonganLain = pemotonganList.stream()
                .map(p -> {
                    if (p.getNominalPemotongan() != null) {
                        return p.getNominalPemotongan();
                    } else if (p.getPersentasePemotongan() != null && baseTunjangan.compareTo(BigDecimal.ZERO) > 0) {
                        // Apply rumus baru untuk pemotongan lain dari database
                        BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                        return baseTunjangan.multiply(p.getPersentasePemotongan())
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                                .multiply(defaultFactor);
                    }
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        String detailPemotonganLain = pemotonganList.stream()
                .map(p -> p.getAlasanPemotongan() + " (" + p.getPersentasePemotongan() + "%)")
                .collect(Collectors.joining(", "));
        
        // ATURAN BARU: Maksimal pemotongan 100% dikali 60% sebagai default factor
        // Rumus: persentase_potongan * 60% * nilai_tunjangan
        // Contoh: 85% * 60% * 7.500.000 = 3.825.000
        
        // Calculate maximum possible deduction (100% * 60% of base salary)
        BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP); // 0.6
        BigDecimal maxPossibleDeduction = baseTunjangan.multiply(defaultFactor); // 60% dari tunjangan dasar
        
        // Hitung persentase aktual dari potongan absen (sebelum dikali 60%)
        BigDecimal attendancePercentage = BigDecimal.ZERO;
        if (baseTunjangan.compareTo(BigDecimal.ZERO) > 0) {
            // Persentase raw dari potongan absen (bisa lebih dari 100%)
            attendancePercentage = potonganAbsen.multiply(BigDecimal.valueOf(100))
                    .divide(baseTunjangan, 2, RoundingMode.HALF_UP);
        }
        
        // Apply aturan baru: maksimal 100% dikali 60% factor
        boolean attendanceCapped = false;
        if (attendancePercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            // Jika lebih dari 100%, batasi ke 100%
            attendancePercentage = BigDecimal.valueOf(100);
            attendanceCapped = true;
        }
        
        // Terapkan rumus baru: persentase * 60% * tunjangan
        potonganAbsen = baseTunjangan
                .multiply(attendancePercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(defaultFactor);
        
        if (attendanceCapped) {
            log.info("Applied 100% cap with 60% factor to attendance deductions for pegawai: {} ({}), max deduction: {}", 
                    pegawai.getNamaLengkap(), pegawai.getNip(), maxPossibleDeduction);
        }
        
        // Hitung persentase aktual dari pemotongan lain (sebelum dikali 60%)
        BigDecimal otherPercentage = BigDecimal.ZERO;
        if (baseTunjangan.compareTo(BigDecimal.ZERO) > 0) {
            otherPercentage = pemotonganLain.multiply(BigDecimal.valueOf(100))
                    .divide(baseTunjangan, 2, RoundingMode.HALF_UP);
        }
        
        // Apply aturan baru untuk pemotongan lain
        boolean otherCapped = false;
        if (otherPercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            otherPercentage = BigDecimal.valueOf(100);
            otherCapped = true;
        }
        
        // Terapkan rumus baru: persentase * 60% * tunjangan
        pemotonganLain = baseTunjangan
                .multiply(otherPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(defaultFactor);
        
        if (otherCapped) {
            log.info("Applied 100% cap with 60% factor to other deductions for pegawai: {} ({}), max deduction: {}", 
                    pegawai.getNamaLengkap(), pegawai.getNip(), maxPossibleDeduction);
        }
        
        // Total potongan (sudah menggunakan formula baru)
        BigDecimal totalPotongan = potonganAbsen.add(pemotonganLain);
        boolean totalCapped = attendanceCapped || otherCapped;
        
        BigDecimal tunjanganBersih = baseTunjangan.subtract(totalPotongan);
        if (tunjanganBersih.compareTo(BigDecimal.ZERO) < 0) {
            tunjanganBersih = BigDecimal.ZERO;
        }
        
        return LaporanTukinResponse.DetailPegawaiTukin.builder()
                .pegawaiId(pegawai.getId())
                .nip(pegawai.getNip())
                .namaLengkap(pegawai.getNamaLengkap())
                .jabatan(pegawai.getJabatan() != null ? pegawai.getJabatan().getNama() : "-")
                .lokasi(pegawai.getLokasi() != null ? pegawai.getLokasi().getNamaLokasi() : "-")
                .tunjanganKinerja(tunjanganKinerja)
                .statistikAbsen(statistikAbsen)
                .potonganAbsen(potonganAbsen)
                .detailPotonganAbsen(buildDetailPotonganAbsen(statistikAbsen))
                .pemotonganLain(pemotonganLain)
                .detailPemotonganLain(detailPemotonganLain)
                .totalPotongan(totalPotongan)
                .tunjanganBersih(tunjanganBersih)
                .isAttendanceCapped(attendanceCapped)
                .isOtherDeductionsCapped(otherCapped)
                .isTotalCapped(totalCapped)
                .maxPossibleDeduction(maxPossibleDeduction)
                .historiAbsensi(historiAbsensi)
                .detailPemotonganAbsenList(detailPemotonganAbsenList)
                .build();
    }

    /**
     * Performance-optimized version that accepts pre-fetched bulk data (hariLibur, cuti, absensi, pemotonganRules).
     * This avoids the N+1 DB query problem when processing many employees at once.
     */
    private LaporanTukinResponse.DetailPegawaiTukin calculateTukinForPegawaiWithBulkData(
            Pegawai pegawai,
            LocalDate startDate, LocalDate endDate,
            Integer bulan, Integer tahun,
            List<Absensi> pegawaiAbsensi,
            Map<LocalDate, Cuti> pegawaiCutiByDate,
            Set<LocalDate> hariLiburDates,
            List<PemotonganAbsen> pemotonganRules,
            boolean includeHistoriAbsensi) {

        Long tunjanganKinerja = pegawai.getTunjanganKinerja() != null ? pegawai.getTunjanganKinerja() : 0L;
        BigDecimal baseTunjangan = BigDecimal.valueOf(tunjanganKinerja);

        Map<String, Object> statistikAbsen = calculateAbsensiStatsWithBulkData(
                pegawai, startDate, endDate, pegawaiAbsensi, pegawaiCutiByDate, hariLiburDates);

        BigDecimal potonganAbsen = calculatePotonganAbsen(pegawai, statistikAbsen, baseTunjangan, startDate, endDate);

        List<LaporanTukinResponse.HistoriAbsensi> historiAbsensi = includeHistoriAbsensi
                ? generateEnhancedHistoriAbsensiWithBulkData(pegawai, startDate, endDate,
                        pegawaiAbsensi, pegawaiCutiByDate, hariLiburDates, pemotonganRules)
                : Collections.emptyList();

        List<LaporanTukinResponse.DetailPemotonganAbsen> detailPemotonganAbsenList =
                generateDetailPemotonganAbsen(pegawai, statistikAbsen, baseTunjangan, startDate, endDate);

        List<Pemotongan> pemotonganList = pemotonganRepository
                .findByPegawaiIdAndBulanPemotonganAndTahunPemotonganAndIsActiveTrue(
                        pegawai.getId(), bulan, tahun);

        BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal maxPossibleDeduction = baseTunjangan.multiply(defaultFactor);

        BigDecimal pemotonganLain = pemotonganList.stream()
                .map(p -> {
                    if (p.getNominalPemotongan() != null) return p.getNominalPemotongan();
                    else if (p.getPersentasePemotongan() != null && baseTunjangan.compareTo(BigDecimal.ZERO) > 0)
                        return baseTunjangan.multiply(p.getPersentasePemotongan())
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                                .multiply(defaultFactor);
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String detailPemotonganLain = pemotonganList.stream()
                .map(p -> p.getAlasanPemotongan() + " (" + p.getPersentasePemotongan() + "%)")
                .collect(Collectors.joining(", "));

        BigDecimal attendancePercentage = BigDecimal.ZERO;
        if (baseTunjangan.compareTo(BigDecimal.ZERO) > 0)
            attendancePercentage = potonganAbsen.multiply(BigDecimal.valueOf(100))
                    .divide(baseTunjangan, 2, RoundingMode.HALF_UP);

        boolean attendanceCapped = false;
        if (attendancePercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            attendancePercentage = BigDecimal.valueOf(100);
            attendanceCapped = true;
        }
        potonganAbsen = baseTunjangan.multiply(attendancePercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(defaultFactor);

        BigDecimal otherPercentage = BigDecimal.ZERO;
        if (baseTunjangan.compareTo(BigDecimal.ZERO) > 0)
            otherPercentage = pemotonganLain.multiply(BigDecimal.valueOf(100))
                    .divide(baseTunjangan, 2, RoundingMode.HALF_UP);

        boolean otherCapped = false;
        if (otherPercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            otherPercentage = BigDecimal.valueOf(100);
            otherCapped = true;
        }
        pemotonganLain = baseTunjangan.multiply(otherPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(defaultFactor);

        BigDecimal totalPotongan = potonganAbsen.add(pemotonganLain);
        boolean totalCapped = attendanceCapped || otherCapped;
        BigDecimal tunjanganBersih = baseTunjangan.subtract(totalPotongan);
        if (tunjanganBersih.compareTo(BigDecimal.ZERO) < 0) tunjanganBersih = BigDecimal.ZERO;

        return LaporanTukinResponse.DetailPegawaiTukin.builder()
                .pegawaiId(pegawai.getId())
                .nip(pegawai.getNip())
                .namaLengkap(pegawai.getNamaLengkap())
                .jabatan(pegawai.getJabatan() != null ? pegawai.getJabatan().getNama() : "-")
                .lokasi(pegawai.getLokasi() != null ? pegawai.getLokasi().getNamaLokasi() : "-")
                .tunjanganKinerja(tunjanganKinerja)
                .statistikAbsen(statistikAbsen)
                .potonganAbsen(potonganAbsen)
                .detailPotonganAbsen(buildDetailPotonganAbsen(statistikAbsen))
                .pemotonganLain(pemotonganLain)
                .detailPemotonganLain(detailPemotonganLain)
                .totalPotongan(totalPotongan)
                .tunjanganBersih(tunjanganBersih)
                .isAttendanceCapped(attendanceCapped)
                .isOtherDeductionsCapped(otherCapped)
                .isTotalCapped(totalCapped)
                .maxPossibleDeduction(maxPossibleDeduction)
                .historiAbsensi(historiAbsensi)
                .detailPemotonganAbsenList(detailPemotonganAbsenList)
                .build();
    }

    private Map<String, Object> calculateAbsensiStatsWithBulkData(
            Pegawai pegawai, LocalDate startDate, LocalDate endDate,
            List<Absensi> absensiList,
            Map<LocalDate, Cuti> cutiByDate,
            Set<LocalDate> hariLiburDates) {

        Map<String, Object> stats = new HashMap<>();
        Map<LocalDate, List<Absensi>> absensiByDate = absensiList.stream()
                .collect(Collectors.groupingBy(Absensi::getTanggal));

        int totalHariKerja = 0, totalHadir = 0, totalTerlambat = 0, totalPulangCepat = 0;
        int totalAlpha = 0, totalCuti = 0, totalTerlambatMenit = 0, totalPulangCepatMenit = 0;

        LocalDate currentDate = startDate;
        LocalDate today = LocalDate.now();
        while (!currentDate.isAfter(endDate)) {
            if (currentDate.getDayOfWeek().getValue() < 6 && !hariLiburDates.contains(currentDate)) {
                if (!currentDate.isAfter(today)) {
                    totalHariKerja++;
                    if (cutiByDate.containsKey(currentDate)) {
                        totalCuti++;
                        currentDate = currentDate.plusDays(1);
                        continue;
                    }
                    List<Absensi> dayAbsensi = absensiByDate.get(currentDate);
                    if (dayAbsensi == null || dayAbsensi.isEmpty()) {
                        totalAlpha++;
                    } else {
                        boolean hasMasuk = dayAbsensi.stream().anyMatch(a -> a.getType() == Absensi.AbsensiType.MASUK);
                        boolean hasPulang = dayAbsensi.stream().anyMatch(a -> a.getType() == Absensi.AbsensiType.PULANG);
                        if (hasMasuk && hasPulang) {
                            totalHadir++;
                            for (Absensi absen : dayAbsensi) {
                                if (absen.getType() == Absensi.AbsensiType.MASUK
                                        && absen.getShift() != null && absen.getShift().getJamMasuk() != null) {
                                    LocalTime shiftJamMasuk = LocalTime.parse(absen.getShift().getJamMasuk());
                                    if (absen.getWaktu().isAfter(shiftJamMasuk)) {
                                        totalTerlambat++;
                                        totalTerlambatMenit += (int) Duration.between(shiftJamMasuk, absen.getWaktu()).toMinutes();
                                    }
                                } else if (absen.getType() == Absensi.AbsensiType.PULANG
                                        && absen.getShift() != null && absen.getShift().getJamKeluar() != null) {
                                    LocalTime shiftJamKeluar = LocalTime.parse(absen.getShift().getJamKeluar());
                                    if (absen.getWaktu().isBefore(shiftJamKeluar)) {
                                        totalPulangCepat++;
                                        totalPulangCepatMenit += (int) Duration.between(absen.getWaktu(), shiftJamKeluar).toMinutes();
                                    }
                                }
                            }
                        } else {
                            totalAlpha++;
                        }
                    }
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        stats.put("totalHariKerja", totalHariKerja);
        stats.put("totalHadir", totalHadir);
        stats.put("totalTerlambat", totalTerlambat);
        stats.put("totalPulangCepat", totalPulangCepat);
        stats.put("totalAlpha", totalAlpha);
        stats.put("totalCuti", totalCuti);
        stats.put("totalTerlambatMenit", totalTerlambatMenit);
        stats.put("totalPulangCepatMenit", totalPulangCepatMenit);
        return stats;
    }

    private List<LaporanTukinResponse.HistoriAbsensi> generateEnhancedHistoriAbsensiWithBulkData(
            Pegawai pegawai, LocalDate startDate, LocalDate endDate,
            List<Absensi> absensiList,
            Map<LocalDate, Cuti> cutiByDate,
            Set<LocalDate> hariLiburDates,
            List<PemotonganAbsen> pemotonganRules) {

        Long tunjanganKinerja = pegawai.getTunjanganKinerja() != null ? pegawai.getTunjanganKinerja() : 0L;
        BigDecimal baseTunjangan = BigDecimal.valueOf(tunjanganKinerja);
        BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        Map<String, BigDecimal> rulePercentages = pemotonganRules.stream()
                .collect(Collectors.toMap(PemotonganAbsen::getKode, PemotonganAbsen::getPersentase,
                        (existing, replacement) -> existing));

        Map<LocalDate, Map<Absensi.AbsensiType, Absensi>> absensiByDateAndType = absensiList.stream()
                .collect(Collectors.groupingBy(Absensi::getTanggal,
                        Collectors.toMap(Absensi::getType, Function.identity(),
                                (existing, replacement) -> existing)));

        // Count working days for per-day tunjangan calculation
        long workingDays = 0;
        LocalDate d = startDate;
        LocalDate today = LocalDate.now();
        while (!d.isAfter(endDate)) {
            if (d.getDayOfWeek().getValue() < 6 && !hariLiburDates.contains(d) && !d.isAfter(today))
                workingDays++;
            d = d.plusDays(1);
        }
        BigDecimal tunjanganPerHari = workingDays > 0
                ? baseTunjangan.divide(BigDecimal.valueOf(workingDays), 6, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<LaporanTukinResponse.HistoriAbsensi> result = new ArrayList<>();
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            Map<Absensi.AbsensiType, Absensi> dayAbsensi = absensiByDateAndType.get(currentDate);
            boolean isHoliday = hariLiburDates.contains(currentDate);
            boolean isWeekend = currentDate.getDayOfWeek().getValue() >= 6;
            boolean isCuti = cutiByDate.containsKey(currentDate);
            boolean isFuture = currentDate.isAfter(today);

            String jamMasuk = null, jamPulang = null;
            String statusMasuk = isFuture ? "MENDATANG" : "ALPHA";
            int menitTerlambat = 0;
            BigDecimal nominalPemotongan = BigDecimal.ZERO;
            BigDecimal persentasePemotongan = BigDecimal.ZERO;
            String detailPem = "";

            if (isHoliday) {
                statusMasuk = "LIBUR";
            } else if (isWeekend) {
                statusMasuk = "LIBUR";
            } else if (isCuti) {
                statusMasuk = "CUTI";
            } else if (!isFuture && dayAbsensi != null) {
                Absensi absenMasuk = dayAbsensi.get(Absensi.AbsensiType.MASUK);
                Absensi absenPulang = dayAbsensi.get(Absensi.AbsensiType.PULANG);
                if (absenMasuk != null) {
                    jamMasuk = absenMasuk.getWaktu().toString();
                    statusMasuk = "HADIR";
                    if (absenMasuk.getShift() != null && absenMasuk.getShift().getJamMasuk() != null) {
                        LocalTime shiftJam = LocalTime.parse(absenMasuk.getShift().getJamMasuk());
                        if (absenMasuk.getWaktu().isAfter(shiftJam)) {
                            menitTerlambat = (int) Duration.between(shiftJam, absenMasuk.getWaktu()).toMinutes();
                            statusMasuk = "TERLAMBAT";
                            BigDecimal pct = rulePercentages.getOrDefault("TERLAMBAT", BigDecimal.ZERO);
                            nominalPemotongan = baseTunjangan.multiply(pct)
                                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                                    .multiply(defaultFactor);
                            persentasePemotongan = pct;
                            detailPem = "Terlambat " + menitTerlambat + " menit";
                        }
                    }
                }
                if (absenPulang != null) jamPulang = absenPulang.getWaktu().toString();
                if (absenMasuk == null && absenPulang == null) {
                    statusMasuk = "ALPHA";
                    BigDecimal pct = rulePercentages.getOrDefault("ALPHA", BigDecimal.valueOf(100));
                    nominalPemotongan = tunjanganPerHari.multiply(pct)
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    persentasePemotongan = pct;
                    detailPem = "Tidak hadir";
                }
            }

            result.add(LaporanTukinResponse.HistoriAbsensi.builder()
                    .tanggal(currentDate.toString())
                    .hari(currentDate.getDayOfWeek().toString())
                    .jamMasuk(jamMasuk)
                    .jamPulang(jamPulang)
                    .statusMasuk(statusMasuk)
                    .statusPulang(jamPulang != null ? "HADIR" : statusMasuk)
                    .menitTerlambat(menitTerlambat)
                    .menitPulangCepat(0)
                    .keterangan(detailPem)
                    .hasPemotongan(nominalPemotongan.compareTo(BigDecimal.ZERO) > 0)
                    .nominalPemotongan(nominalPemotongan)
                    .persentasePemotongan(persentasePemotongan)
                    .detailPemotongan(detailPem)
                    .status(statusMasuk)
                    .build());
            currentDate = currentDate.plusDays(1);
        }
        return result;
    }

    private LaporanTukinResponse convertToResponse(LaporanTukin laporan) {
        return LaporanTukinResponse.builder()
                .id(laporan.getId())
                .judul(laporan.getJudul())
                .bulan(laporan.getBulan())
                .tahun(laporan.getTahun())
                .tanggalMulai(laporan.getTanggalMulai().format(DATE_FORMATTER))
                .tanggalAkhir(laporan.getTanggalAkhir().format(DATE_FORMATTER))
                .formatLaporan(laporan.getFormatLaporan())
                .status(laporan.getStatus())
                .filePath(laporan.getFilePath())
                .tanggalGenerate(laporan.getTanggalGenerate())
                .generatedBy(laporan.getGeneratedBy().getNamaLengkap())
                .totalPegawai(laporan.getTotalPegawai())
                .totalTunjanganKinerja(laporan.getTotalTunjanganKinerja())
                .totalPotonganAbsen(laporan.getTotalPotonganAbsen())
                .totalPemotongan(laporan.getTotalPemotongan())
                .totalTunjanganBersih(laporan.getTotalTunjanganBersih())
                .build();
    }
    
    private LaporanTukinResponse convertToResponseWithDetail(LaporanTukin laporan, Long pegawaiId) {
        // Regenerate detail data based on saved report parameters
        LocalDate startDate = laporan.getTanggalMulai();
        LocalDate endDate = laporan.getTanggalAkhir();
        
        List<Pegawai> pegawaiList;
        if (pegawaiId != null) {
            // Get specific pegawai
            Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                    .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
            pegawaiList = List.of(pegawai);
        } else {
            // Get all active employees
            pegawaiList = pegawaiRepository.findByIsActive(true);
        }
        
        // Calculate tukin for each employee using the same period
        List<LaporanTukinResponse.DetailPegawaiTukin> detailPegawai = new ArrayList<>();
        
        for (Pegawai pegawai : pegawaiList) {
            LaporanTukinResponse.DetailPegawaiTukin detail = calculateTukinForPegawaiWithEnhancedDetail(
                pegawai, startDate, endDate, laporan.getBulan(), laporan.getTahun());
            detailPegawai.add(detail);
        }
        
        return LaporanTukinResponse.builder()
                .id(laporan.getId())
                .judul(laporan.getJudul())
                .bulan(laporan.getBulan())
                .tahun(laporan.getTahun())
                .tanggalMulai(laporan.getTanggalMulai().format(DATE_FORMATTER))
                .tanggalAkhir(laporan.getTanggalAkhir().format(DATE_FORMATTER))
                .formatLaporan(laporan.getFormatLaporan())
                .status(laporan.getStatus())
                .filePath(laporan.getFilePath())
                .tanggalGenerate(laporan.getTanggalGenerate())
                .generatedBy(laporan.getGeneratedBy().getNamaLengkap())
                .totalPegawai(laporan.getTotalPegawai())
                .totalTunjanganKinerja(laporan.getTotalTunjanganKinerja())
                .totalPotonganAbsen(laporan.getTotalPotonganAbsen())
                .totalPemotongan(laporan.getTotalPemotongan())
                .totalTunjanganBersih(laporan.getTotalTunjanganBersih())
                .detailPegawai(detailPegawai)
                .build();
    }
    
    @Transactional(timeout = 300, readOnly = true)
    public LaporanTukinResponse getLaporanByIdWithDetail(Long id) {
        return getLaporanByIdWithDetail(id, null);
    }
    
    public List<Map<String, Object>> getListPegawaiInLaporan(Long laporanId) {
        // Validate laporan exists
        laporanTukinRepository.findById(laporanId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        // Get all active employees that could be in the report
        List<Pegawai> pegawaiList = pegawaiRepository.findByIsActive(true);
        
        return pegawaiList.stream()
                .map(pegawai -> {
                    Map<String, Object> pegawaiInfo = new HashMap<>();
                    pegawaiInfo.put("id", pegawai.getId());
                    pegawaiInfo.put("nip", pegawai.getNip());
                    pegawaiInfo.put("namaLengkap", pegawai.getNamaLengkap());
                    pegawaiInfo.put("jabatan", pegawai.getJabatan() != null ? pegawai.getJabatan().getNama() : "-");
                    pegawaiInfo.put("lokasi", pegawai.getLokasi() != null ? pegawai.getLokasi().getNamaLokasi() : "-");
                    return pegawaiInfo;
                })
                .collect(Collectors.toList());
    }
    
    private String getMonthName(int month) {
        String[] months = {
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        };
        return months[month - 1];
    }
    
    @Transactional(timeout = 300, readOnly = true)
    public byte[] generateExcelReport(Long laporanId) throws IOException {
        // Get laporan data
        LaporanTukin laporan = laporanTukinRepository.findById(laporanId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        LaporanTukinResponse laporanResponse = getLaporanByIdWithDetail(laporanId);
        List<LaporanTukinResponse.DetailPegawaiTukin> rincianData = getRincianDetailPerPegawai(laporanId, null);
        
        // Get holiday data for the period
        List<HariLibur> holidays = hariLiburRepository.findByBulanLiburAndTahunLiburAndIsActiveTrueOrderByTanggalLiburAsc(
                laporan.getBulan(), laporan.getTahun());
        
        // Create workbook
        Workbook workbook = new XSSFWorkbook();
        
        // Create styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle emptyHeaderStyle = createEmptyHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle dateStyle = createDateStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);
        CellStyle cappedCurrencyStyle = createCappedCurrencyStyle(workbook);
        CellStyle holidayStyle = createHolidayStyle(workbook);
        CellStyle nameStyle = createNameStyle(workbook);
        CellStyle numberStyle = createNumberStyle(workbook);
        
        // Sheet 1: Input Absensi Hadir
        createInputAbsensiSheet(workbook, rincianData, laporan, holidays, titleStyle, headerStyle, emptyHeaderStyle, dataStyle, dateStyle, holidayStyle, nameStyle, numberStyle, currencyStyle);
        
        // Sheet 2: Rekapitulasi Pemotongan Tunjangan Kinerja
        createRekapitulasiPemotonganSheet(workbook, rincianData, laporan, titleStyle, headerStyle, emptyHeaderStyle, dataStyle, currencyStyle);
        
        // Sheet 3: Summary Kehadiran (REKAP ABSENSI PEGAWAI PPPK)
        createSummaryKehadiranSheet(workbook, rincianData, laporan, titleStyle, headerStyle, dataStyle);
        
        // Sheet 4: Detail Tunjangan Kinerja Per Pegawai
        createDetailTunjanganSheet(workbook, laporanResponse, titleStyle, headerStyle, dataStyle, currencyStyle, cappedCurrencyStyle);
        
        // Write to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream.toByteArray();
    }
    
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontName("Calibri");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.MEDIUM);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.MEDIUM);
        style.setBorderRight(BorderStyle.MEDIUM);
        style.setWrapText(true);
        return style;
    }
    
    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.BLACK.getIndex());
        font.setFontName("Calibri");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.MEDIUM);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.MEDIUM);
        style.setBorderRight(BorderStyle.MEDIUM);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
    
    private CellStyle createEmptyHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.MEDIUM);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.MEDIUM);
        style.setBorderRight(BorderStyle.MEDIUM);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setFontName("Calibri");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("dd/mm/yyyy"));
        return style;
    }
    
    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setFontName("Calibri");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        return style;
    }
    
    private CellStyle getCappedCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setFontName("Calibri");
        font.setBold(true);
        font.setColor(IndexedColors.RED.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THICK);
        style.setBorderBottom(BorderStyle.THICK);
        style.setBorderLeft(BorderStyle.THICK);
        style.setBorderRight(BorderStyle.THICK);
        style.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
    
    private CellStyle createCappedCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setFontName("Calibri");
        font.setColor(IndexedColors.RED.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.MEDIUM);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.MEDIUM);
        style.setBorderRight(BorderStyle.MEDIUM);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        return style;
    }
    
    // Add new style methods for better formatting
    private CellStyle createNameStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setFontName("Calibri");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }
    
    private CellStyle createNumberStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setFontName("Calibri");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createHolidayStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.DARK_GREEN.getIndex());
        font.setFontName("Calibri");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    private void createInputAbsensiSheet(Workbook workbook, List<LaporanTukinResponse.DetailPegawaiTukin> rincianData,
                                       LaporanTukin laporan, List<HariLibur> holidays,
                                       CellStyle titleStyle, CellStyle headerStyle, CellStyle emptyHeaderStyle, 
                                       CellStyle dataStyle, CellStyle dateStyle, CellStyle holidayStyle,
                                       CellStyle nameStyle, CellStyle numberStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Input Absensi Hadir");
        
        // Create title
        Row titleRow = sheet.createRow(0);
        titleRow.setHeightInPoints(25); // Set row height for better appearance
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("INPUT ABSENSI HADIR");
        titleCell.setCellStyle(titleStyle);
        
        // Get dates in month (working days only)
        LocalDate startDate = laporan.getTanggalMulai();
        LocalDate endDate = laporan.getTanggalAkhir();
        Set<LocalDate> holidayDates = holidays.stream()
                .map(HariLibur::getTanggalLibur)
                .collect(Collectors.toSet());
        
        List<LocalDate> workingDates = new ArrayList<>();
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            // Include all days but mark holidays differently
            if (currentDate.getDayOfWeek().getValue() <= 7) { // All days
                workingDates.add(currentDate);
            }
            currentDate = currentDate.plusDays(1);
        }
        
        // Calculate total columns needed
        int totalCols = 3 + (workingDates.size() * 3); // No, Nama, Nilai Kls Jab + (K,M,P for each date)
        
        // Merge title cells and apply borders
        CellRangeAddress titleRange = new CellRangeAddress(0, 0, 0, totalCols - 1);
        sheet.addMergedRegion(titleRange);
        // Fill all cells in merged region with empty cells for proper border rendering
        for (int i = 1; i < totalCols; i++) {
            Cell emptyCell = titleRow.createCell(i);
            emptyCell.setCellStyle(titleStyle);
        }
        
        // Add period row
        Row periodRow = sheet.createRow(1);
        periodRow.setHeightInPoints(20); // Set row height for better appearance
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("BULAN " + getMonthName(laporan.getBulan()).toUpperCase() + " TAHUN " + laporan.getTahun());
        periodCell.setCellStyle(titleStyle);
        CellRangeAddress periodRange = new CellRangeAddress(1, 1, 0, totalCols - 1);
        sheet.addMergedRegion(periodRange);
        // Fill all cells in merged region for proper border rendering
        for (int i = 1; i < totalCols; i++) {
            Cell emptyCell = periodRow.createCell(i);
            emptyCell.setCellStyle(titleStyle);
        }
        
        // Create date header row
        Row dateHeaderRow = sheet.createRow(2);
        dateHeaderRow.setHeightInPoints(18); // Set row height for header
        Cell noHeaderCell1 = dateHeaderRow.createCell(0);
        noHeaderCell1.setCellStyle(headerStyle); // Uniform header style
        Cell namaHeaderCell1 = dateHeaderRow.createCell(1);
        namaHeaderCell1.setCellStyle(headerStyle); // Uniform header style
        Cell tunjanganHeaderCell1 = dateHeaderRow.createCell(2);
        tunjanganHeaderCell1.setCellStyle(headerStyle); // Uniform header style
        
        int colIndex = 3;
        for (LocalDate date : workingDates) {
            Cell dateCell = dateHeaderRow.createCell(colIndex);
            dateCell.setCellValue(date.getDayOfMonth());
            CellStyle dateStyleToUse = holidayDates.contains(date) ? holidayStyle : headerStyle;
            dateCell.setCellStyle(dateStyleToUse);
            
            // Merge 3 columns for each date (K, M, P) and fill for proper borders
            sheet.addMergedRegion(new CellRangeAddress(2, 2, colIndex, colIndex + 2));
            for (int i = 1; i <= 2; i++) {
                Cell emptyCell = dateHeaderRow.createCell(colIndex + i);
                emptyCell.setCellStyle(dateStyleToUse);
            }
            colIndex += 3;
        }
        
        // Create day name header row  
        Row dayHeaderRow = sheet.createRow(3);
        dayHeaderRow.setHeightInPoints(18); // Set row height for header
        Cell noHeaderCell2 = dayHeaderRow.createCell(0);
        noHeaderCell2.setCellStyle(headerStyle); // Uniform header style
        Cell namaHeaderCell2 = dayHeaderRow.createCell(1);
        namaHeaderCell2.setCellStyle(headerStyle); // Uniform header style
        Cell tunjanganHeaderCell2 = dayHeaderRow.createCell(2);
        tunjanganHeaderCell2.setCellStyle(headerStyle); // Uniform header style
        
        colIndex = 3;
        String[] dayNames = {"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"};
        for (LocalDate date : workingDates) {
            Cell dayCell = dayHeaderRow.createCell(colIndex);
            String dayName = dayNames[date.getDayOfWeek().getValue() % 7];
            dayCell.setCellValue(dayName);
            CellStyle dayStyleToUse = holidayDates.contains(date) ? holidayStyle : headerStyle;
            dayCell.setCellStyle(dayStyleToUse);
            
            // Merge 3 columns for day name and fill for proper borders
            sheet.addMergedRegion(new CellRangeAddress(3, 3, colIndex, colIndex + 2));
            for (int i = 1; i <= 2; i++) {
                Cell emptyCell = dayHeaderRow.createCell(colIndex + i);
                emptyCell.setCellStyle(dayStyleToUse);
            }
            colIndex += 3;
        }
        
        // Create K/M/P header row
        Row kmpHeaderRow = sheet.createRow(4);
        kmpHeaderRow.setHeightInPoints(18); // Set row height for header
        kmpHeaderRow.createCell(0).setCellValue("No");
        kmpHeaderRow.createCell(1).setCellValue("Nama");
        kmpHeaderRow.createCell(2).setCellValue("Tunjangan Kinerja");
        
        // Apply header style to basic columns
        for (int i = 0; i < 3; i++) {
            kmpHeaderRow.getCell(i).setCellStyle(headerStyle);
        }
        
        colIndex = 3;
        for (LocalDate date : workingDates) {
            CellStyle styleToUse = holidayDates.contains(date) ? holidayStyle : headerStyle;
            
            Cell kCell = kmpHeaderRow.createCell(colIndex++);
            kCell.setCellValue("K");
            kCell.setCellStyle(styleToUse);
            
            Cell mCell = kmpHeaderRow.createCell(colIndex++);
            mCell.setCellValue("M");
            mCell.setCellStyle(styleToUse);
            
            Cell pCell = kmpHeaderRow.createCell(colIndex++);
            pCell.setCellValue("P");
            pCell.setCellStyle(styleToUse);
        }
        
        // Fill employee data
        int rowIndex = 5;
        for (int i = 0; i < rincianData.size(); i++) {
            LaporanTukinResponse.DetailPegawaiTukin pegawai = rincianData.get(i);
            Row row = sheet.createRow(rowIndex++);
            
            // Basic info with appropriate styles
            Cell noCell = row.createCell(0);
            noCell.setCellValue(i + 1);
            noCell.setCellStyle(numberStyle);
            
            Cell nameCell = row.createCell(1);
            nameCell.setCellValue(pegawai.getNamaLengkap());
            nameCell.setCellStyle(nameStyle);
            
            Cell tunjanganCell = row.createCell(2);
            tunjanganCell.setCellValue(pegawai.getTunjanganKinerja());
            tunjanganCell.setCellStyle(currencyStyle);
            
            // Create attendance map
            Map<String, LaporanTukinResponse.HistoriAbsensi> attendanceMap = new HashMap<>();
            if (pegawai.getHistoriAbsensi() != null) {
                for (LaporanTukinResponse.HistoriAbsensi hist : pegawai.getHistoriAbsensi()) {
                    attendanceMap.put(hist.getTanggal(), hist);
                }
            }
            
            // Fill attendance data for each date
            colIndex = 3;
            for (LocalDate date : workingDates) {
                String dateStr = date.toString();
                LaporanTukinResponse.HistoriAbsensi attendance = attendanceMap.get(dateStr);
                
                CellStyle styleToUse = holidayDates.contains(date) ? holidayStyle : dataStyle;
                
                // K (Kehadiran) - determine based on attendance and shift status
                Cell kCell = row.createCell(colIndex++);
                if (attendance != null) {
                    String status = attendance.getStatusMasuk();
                    if ("CUTI".equals(status)) {
                        kCell.setCellValue("CT");
                    } else if ("LIBUR".equals(status)) {
                        kCell.setCellValue("L");
                    } else if ("HADIR".equals(status) || "TERLAMBAT".equals(status)) {
                        // Determine work location based on shift lock location
                        String lockLokasi = attendance.getLockLokasi();
                        if (lockLokasi != null) {
                            if ("KANTOR".equalsIgnoreCase(lockLokasi) || "WAJIB_KANTOR".equalsIgnoreCase(lockLokasi)) {
                                kCell.setCellValue("WFO");
                            } else if ("DIMANA_SAJA".equalsIgnoreCase(lockLokasi) || "FLEXIBLE".equalsIgnoreCase(lockLokasi)) {
                                kCell.setCellValue("WFH");
                            } else if ("DINAS".equalsIgnoreCase(lockLokasi) || "DINAS_LUAR".equalsIgnoreCase(lockLokasi)) {
                                kCell.setCellValue("D");
                            } else {
                                kCell.setCellValue("WFO"); // Default to WFO if unknown
                            }
                        } else {
                            kCell.setCellValue("WFO"); // Default to WFO if no shift info
                        }
                    } else if ("DINAS_LUAR".equals(status)) {
                        kCell.setCellValue("D");
                    } else {
                        kCell.setCellValue(""); // Alpha or not present
                    }
                } else {
                    kCell.setCellValue("-"); // No shift assigned
                }
                kCell.setCellStyle(styleToUse);
                
                // M (Masuk) - time or empty
                Cell mCell = row.createCell(colIndex++);
                if (attendance != null && attendance.getJamMasuk() != null) {
                    mCell.setCellValue(attendance.getJamMasuk());
                } else {
                    mCell.setCellValue("00:00");
                }
                mCell.setCellStyle(styleToUse);
                
                // P (Pulang) - time or empty  
                Cell pCell = row.createCell(colIndex++);
                if (attendance != null && attendance.getJamPulang() != null) {
                    pCell.setCellValue(attendance.getJamPulang());
                } else {
                    pCell.setCellValue("00:00");
                }
                pCell.setCellStyle(styleToUse);
            }
        }
        
        // Set custom column widths for better readability
        sheet.setColumnWidth(0, 2500);   // No - slightly wider
        sheet.setColumnWidth(1, 12000);  // Nama - much wider for better readability
        sheet.setColumnWidth(2, 7000);   // Tunjangan Kinerja - wider
        
        // Set width for date columns (K, M, P) - optimal for visibility
        for (int i = 3; i < totalCols; i++) {
            if ((i - 3) % 3 == 0) {
                sheet.setColumnWidth(i, 2200); // K columns - wider for status
            } else {
                sheet.setColumnWidth(i, 2800); // M, P columns - wider for time values
            }
        }
        
        // Add freeze panes for better navigation
        sheet.createFreezePane(3, 5); // Freeze first 3 columns and first 5 rows
    }
    
    private void createRekapitulasiPemotonganSheet(Workbook workbook, List<LaporanTukinResponse.DetailPegawaiTukin> rincianData,
                                                 LaporanTukin laporan, CellStyle titleStyle, CellStyle headerStyle, CellStyle emptyHeaderStyle, CellStyle dataStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Rekapitulasi Pemotongan");
        
        // Create title
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("REKAPITULASI PEMOTONGAN TUNJANGAN KINERJA");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 20));
        
        Row periodRow = sheet.createRow(1);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("BULAN " + getMonthName(laporan.getBulan()).toUpperCase() + " TAHUN " + laporan.getTahun());
        periodCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 20));
        
        // Create main headers (row 3 and 4)
        Row headerRow1 = sheet.createRow(3);
        Row headerRow2 = sheet.createRow(4);
        
        // Basic columns with merged cells
        String[] basicHeaders = {"No.", "Nama", "Tunjangan Kinerja Per Kelas Jabatan"};
        for (int i = 0; i < basicHeaders.length; i++) {
            Cell cell1 = headerRow1.createCell(i);
            cell1.setCellValue(basicHeaders[i]);
            cell1.setCellStyle(headerStyle);
            sheet.addMergedRegion(new CellRangeAddress(3, 4, i, i));
        }
        
        int colIndex = 3;
        
        // Pemotongan Karena Terlambat (TL.1, TL.2, TL.3, TL.4)
        Cell terlambatHeader = headerRow1.createCell(colIndex);
        terlambatHeader.setCellValue("Pemotongan Karena Terlambat");
        terlambatHeader.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(3, 3, colIndex, colIndex + 3));
        
        String[] terlambatSubHeaders = {"TL.1", "TL.2", "TL.3", "TL.4"};
        for (int i = 0; i < terlambatSubHeaders.length; i++) {
            Cell cell = headerRow2.createCell(colIndex + i);
            cell.setCellValue(terlambatSubHeaders[i]);
            cell.setCellStyle(headerStyle);
        }
        colIndex += 4;
        
        // Pemotongan Karena Pulang Sebelum Waktunya (PSW1, PSW2, PSW3)
        Cell pulangHeader = headerRow1.createCell(colIndex);
        pulangHeader.setCellValue("Pemotongan Karena Pulang Sebelum Waktunya");
        pulangHeader.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(3, 3, colIndex, colIndex + 2));
        
        String[] pulangSubHeaders = {"PSW1", "PSW2", "PSW3"};
        for (int i = 0; i < pulangSubHeaders.length; i++) {
            Cell cell = headerRow2.createCell(colIndex + i);
            cell.setCellValue(pulangSubHeaders[i]);
            cell.setCellStyle(headerStyle);
        }
        colIndex += 3;
        
        // LUPA ABSEN (HADIR, PULANG) - Hilangkan Pulang tanpa Izin
        Cell lupaAbsenHeader = headerRow1.createCell(colIndex);
        lupaAbsenHeader.setCellValue("LUPA ABSEN");
        lupaAbsenHeader.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(3, 3, colIndex, colIndex + 1));
        
        String[] lupaAbsenSubHeaders = {"HADIR", "PULANG"};
        for (int i = 0; i < lupaAbsenSubHeaders.length; i++) {
            Cell cell = headerRow2.createCell(colIndex + i);
            cell.setCellValue(lupaAbsenSubHeaders[i]);
            cell.setCellStyle(headerStyle);
        }
        colIndex += 2;
        
        // Alpha/Tidak Masuk and Persen Potong
        Cell tidakMasukHeader = headerRow1.createCell(colIndex);
        tidakMasukHeader.setCellValue("Alpha");
        tidakMasukHeader.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(3, 4, colIndex, colIndex));
        colIndex++;
        
        Cell persenPotongHeader = headerRow1.createCell(colIndex);
        persenPotongHeader.setCellValue("Persen Potong (%)");
        persenPotongHeader.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(3, 4, colIndex, colIndex));
        
        // Fill employee data
        int rowIndex = 5;
        for (int i = 0; i < rincianData.size(); i++) {
            LaporanTukinResponse.DetailPegawaiTukin pegawai = rincianData.get(i);
            Row row = sheet.createRow(rowIndex++);
            
            // Basic info
            row.createCell(0).setCellValue(i + 1);
            row.createCell(1).setCellValue(pegawai.getNamaLengkap());
            row.createCell(2).setCellValue(pegawai.getTunjanganKinerja());
            
            // Initialize deduction counters
            Map<String, Integer> deductionCounts = new HashMap<>();
            
            // Analyze deduction details from historiAbsensi for specific deductions
            if (pegawai.getHistoriAbsensi() != null) {
                for (LaporanTukinResponse.HistoriAbsensi attendance : pegawai.getHistoriAbsensi()) {
                    // Skip CUTI days from deduction breakdown
                    if ("CUTI".equals(attendance.getStatusMasuk())) {
                        continue;
                    }
                    if (attendance.getHasPemotongan() != null && attendance.getHasPemotongan()) {
                        String detail = attendance.getDetailPemotongan();
                        if (detail != null) {
                            // Parse terlambat categories
                            if (detail.contains("Terlambat")) {
                                Integer menit = attendance.getMenitTerlambat();
                                if (menit != null) {
                                    if (menit <= 15) {
                                        deductionCounts.put("TL1", deductionCounts.getOrDefault("TL1", 0) + 1);
                                    } else if (menit <= 30) {
                                        deductionCounts.put("TL2", deductionCounts.getOrDefault("TL2", 0) + 1);
                                    } else if (menit <= 60) {
                                        deductionCounts.put("TL3", deductionCounts.getOrDefault("TL3", 0) + 1);
                                    } else {
                                        deductionCounts.put("TL4", deductionCounts.getOrDefault("TL4", 0) + 1);
                                    }
                                }
                            }
                            // Parse pulang cepat categories
                            else if (detail.contains("Pulang cepat")) {
                                Integer menit = attendance.getMenitPulangCepat();
                                if (menit != null) {
                                    if (menit <= 30) {
                                        deductionCounts.put("PSW1", deductionCounts.getOrDefault("PSW1", 0) + 1);
                                    } else if (menit <= 60) {
                                        deductionCounts.put("PSW2", deductionCounts.getOrDefault("PSW2", 0) + 1);
                                    } else {
                                        deductionCounts.put("PSW3", deductionCounts.getOrDefault("PSW3", 0) + 1);
                                    }
                                }
                            }
                            // Parse lupa absen
                            else if (detail.contains("Lupa absen masuk")) {
                                deductionCounts.put("LAM", deductionCounts.getOrDefault("LAM", 0) + 1);
                            } else if (detail.contains("Lupa absen pulang")) {
                                deductionCounts.put("LAP", deductionCounts.getOrDefault("LAP", 0) + 1);
                            }
                            // Alpha/Tidak masuk tanpa keterangan
                            else if (detail.contains("Tidak masuk") || detail.contains("Alpha")) {
                                deductionCounts.put("ALPHA", deductionCounts.getOrDefault("ALPHA", 0) + 1);
                            }
                        }
                    }
                }
                
                // Count alpha using consistent logic with Summary sheet - use status if no deduction detail
                int alphaFromDetails = deductionCounts.getOrDefault("ALPHA", 0);
                if (alphaFromDetails == 0) {
                    // Fallback to status-based counting for alpha
                    for (LaporanTukinResponse.HistoriAbsensi attendance : pegawai.getHistoriAbsensi()) {
                        String status = attendance.getStatusMasuk();
                        if ("ALPHA".equals(status) || "TIDAK_HADIR".equals(status)) {
                            alphaFromDetails++;
                        }
                    }
                    deductionCounts.put("ALPHA", alphaFromDetails);
                }
            }
            
            // Fill deduction columns
            colIndex = 3;
            
            // TL columns (TL.1, TL.2, TL.3, TL.4)
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("TL1", 0));
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("TL2", 0));
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("TL3", 0));
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("TL4", 0));
            
            // PSW columns (PSW1, PSW2, PSW3)
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("PSW1", 0));
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("PSW2", 0));
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("PSW3", 0));
            
            // LUPA ABSEN columns (hanya HADIR dan PULANG)
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("LAM", 0));
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("LAP", 0));
            
            // Alpha/Tidak masuk
            row.createCell(colIndex++).setCellValue(deductionCounts.getOrDefault("ALPHA", 0));
            
            // ATURAN BARU: Hitung persentase berdasarkan formula baru
            // Rumus: persentase_potongan * 60% * nilai_tunjangan
            // Maksimal persentase yang ditampilkan adalah persentase sebelum dikali 60% (bisa sampai 100%)
            BigDecimal baseTunjangan = BigDecimal.valueOf(pegawai.getTunjanganKinerja());
            BigDecimal actualPercentage = BigDecimal.ZERO;
            
            if (baseTunjangan.compareTo(BigDecimal.ZERO) > 0 && pegawai.getMaxPossibleDeduction() != null) {
                BigDecimal totalDeductionAmount = pegawai.getTotalPotongan() != null ? 
                    pegawai.getTotalPotongan() : BigDecimal.ZERO;
                
                // Hitung persentase sebelum dikali 60% factor
                // totalDeductionAmount = persentase * 60% * baseTunjangan
                // maka persentase = totalDeductionAmount / (60% * baseTunjangan)
                BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                BigDecimal divisor = baseTunjangan.multiply(defaultFactor);
                
                if (divisor.compareTo(BigDecimal.ZERO) > 0) {
                    actualPercentage = totalDeductionAmount
                        .multiply(BigDecimal.valueOf(100))
                        .divide(divisor, 2, RoundingMode.HALF_UP);
                    
                    // Cap at 100%
                    actualPercentage = actualPercentage.min(BigDecimal.valueOf(100.0));
                }
            }
            
            Cell persenCell = row.createCell(colIndex);
            String percentageText = actualPercentage.setScale(2, RoundingMode.HALF_UP) + "%";
            persenCell.setCellValue(percentageText);
            
            // Apply bold style if capped at 100%
            if (pegawai.getIsTotalCapped() != null && pegawai.getIsTotalCapped()) {
                persenCell.setCellStyle(getCappedCurrencyStyle(workbook));
            } else {
                persenCell.setCellStyle(dataStyle);
            }
        }
        
        // Set custom column widths for better readability
        sheet.setColumnWidth(0, 1500);  // No - narrow
        sheet.setColumnWidth(1, 8000);  // Nama - wider
        sheet.setColumnWidth(2, 5000);  // Tunjangan Kinerja - medium-wide
        
        // TL columns (3-6)
        for (int i = 3; i <= 6; i++) {
            sheet.setColumnWidth(i, 2000); // TL.1, TL.2, TL.3, TL.4
        }
        
        // PSW columns (7-9)
        for (int i = 7; i <= 9; i++) {
            sheet.setColumnWidth(i, 2000); // PSW1, PSW2, PSW3
        }
        
        // Lupa Absen columns (10-11)
        for (int i = 10; i <= 11; i++) {
            sheet.setColumnWidth(i, 2500); // HADIR, PULANG
        }
        
        // Alpha and Persen columns (12-13)
        sheet.setColumnWidth(12, 2000); // Alpha
        sheet.setColumnWidth(13, 3000); // Persen Potong
    }
    
    private void createSummaryKehadiranSheet(Workbook workbook, List<LaporanTukinResponse.DetailPegawaiTukin> rincianData,
                                           LaporanTukin laporan, CellStyle titleStyle, CellStyle headerStyle, CellStyle dataStyle) {
        Sheet sheet = workbook.createSheet("Summary Kehadiran");
        
        // Create title
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("REKAP ABSENSI PEGAWAI PEMERINTAH DENGAN PERJANJIAN KERJA (PPPK)");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));
        
        Row subtitleRow = sheet.createRow(1);
        Cell subtitleCell = subtitleRow.createCell(0);
        subtitleCell.setCellValue("BAWASLU KOTA METRO");
        subtitleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));
        
        Row periodRow = sheet.createRow(2);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("BULAN " + getMonthName(laporan.getBulan()).toUpperCase() + " TAHUN " + laporan.getTahun());
        periodCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 7));
        
        // Create headers
        Row headerRow = sheet.createRow(4);
        String[] headers = {"No", "Nama", "Hadir", "Cuti", "Sakit", "Dinas Luar", "Alpha", "Jumlah Hari Kerja"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Fill employee data
        int rowIndex = 5;
        for (int i = 0; i < rincianData.size(); i++) {
            LaporanTukinResponse.DetailPegawaiTukin pegawai = rincianData.get(i);
            Row row = sheet.createRow(rowIndex++);
            
            // Calculate attendance statistics using deduction details for consistent alpha count
            int hadir = 0;
            int cuti = 0;
            int sakit = 0;
            int dinasLuar = 0;
            int alpha = 0;
            int totalHariKerja = pegawai.getHistoriAbsensi().size();

            // Count alpha from deduction details to match Rekapitulasi sheet
            Map<String, Integer> deductionCounts = new HashMap<>();
            for (LaporanTukinResponse.HistoriAbsensi attendance : pegawai.getHistoriAbsensi()) {
                String status = attendance.getStatusMasuk();
                
                // Process deduction details for accurate alpha count
                if (attendance.getDetailPemotongan() != null && !attendance.getDetailPemotongan().isEmpty()) {
                    String[] details = attendance.getDetailPemotongan().split("\n");
                    for (String detail : details) {
                        if (detail.trim().isEmpty()) continue;
                        
                        // Alpha/Tidak masuk tanpa keterangan
                        if (detail.contains("Tidak masuk") || detail.contains("Alpha")) {
                            deductionCounts.put("ALPHA", deductionCounts.getOrDefault("ALPHA", 0) + 1);
                        }
                    }
                }
                
                // Count other statuses
                if ("HADIR".equals(status) || "TERLAMBAT".equals(status)) {
                    hadir++;
                } else if ("CUTI".equals(status)) {
                    cuti++;
                } else if ("SAKIT".equals(status)) {
                    sakit++;
                } else if ("DINAS_LUAR".equals(status)) {
                    dinasLuar++;
                }
            }
            
            // Use alpha count from deduction details if available, otherwise use status-based count
            alpha = deductionCounts.getOrDefault("ALPHA", 0);
            if (alpha == 0) {
                // Fallback to status-based counting
                for (LaporanTukinResponse.HistoriAbsensi attendance : pegawai.getHistoriAbsensi()) {
                    String status = attendance.getStatusMasuk();
                    if ("ALPHA".equals(status) || "TIDAK_HADIR".equals(status)) {
                        alpha++;
                    }
                }
            }
            
            row.createCell(0).setCellValue(i + 1);
            row.createCell(1).setCellValue(pegawai.getNamaLengkap());
            row.createCell(2).setCellValue(hadir);
            row.createCell(3).setCellValue(cuti);
            row.createCell(4).setCellValue(sakit);
            row.createCell(5).setCellValue(dinasLuar);
            row.createCell(6).setCellValue(alpha);
            row.createCell(7).setCellValue(totalHariKerja);
        }
        
        // Set custom column widths for better readability
        sheet.setColumnWidth(0, 1500);  // No - narrow
        sheet.setColumnWidth(1, 8000);  // Nama - wider
        sheet.setColumnWidth(2, 2500);  // Hadir
        sheet.setColumnWidth(3, 2500);  // Cuti
        sheet.setColumnWidth(4, 2500);  // Sakit
        sheet.setColumnWidth(5, 3000);  // Dinas Luar
        sheet.setColumnWidth(6, 2500);  // Alpha
        sheet.setColumnWidth(7, 4000);  // Jumlah Hari Kerja
    }
    
    private void createDetailTunjanganSheet(Workbook workbook, LaporanTukinResponse laporanResponse,
                                          CellStyle titleStyle, CellStyle headerStyle, CellStyle dataStyle, CellStyle currencyStyle, CellStyle cappedCurrencyStyle) {
        Sheet sheet = workbook.createSheet("Detail Tunjangan Per Pegawai");
        
        // Create title
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DETAIL TUNJANGAN KINERJA PER PEGAWAI");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
        
        Row periodRow = sheet.createRow(1);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("Periode: " + getMonthName(laporanResponse.getBulan()) + " " + laporanResponse.getTahun());
        periodCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 10));
        
        // Create headers
        Row headerRow = sheet.createRow(3);
        String[] headers = {"No", "NIP", "Nama Pegawai", "Jabatan", "Lokasi", 
                           "Tunjangan Kinerja", "Total Masuk", "Potongan Absen", 
                           "Potongan Lain", "Total Potongan", "Tunjangan Bersih"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Fill employee data
        int rowIndex = 4;
        if (laporanResponse.getDetailPegawai() != null) {
            for (int i = 0; i < laporanResponse.getDetailPegawai().size(); i++) {
                LaporanTukinResponse.DetailPegawaiTukin pegawai = laporanResponse.getDetailPegawai().get(i);
                Row row = sheet.createRow(rowIndex++);
                
                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(pegawai.getNip() != null ? pegawai.getNip() : "-");
                row.createCell(2).setCellValue(pegawai.getNamaLengkap());
                row.createCell(3).setCellValue(pegawai.getJabatan());
                row.createCell(4).setCellValue(pegawai.getLokasi());
                
                Cell tunjanganCell = row.createCell(5);
                tunjanganCell.setCellValue(pegawai.getTunjanganKinerja());
                tunjanganCell.setCellStyle(currencyStyle);
                
                // Calculate total masuk from historiAbsensi if available
                int totalMasuk = 0;
                if (pegawai.getHistoriAbsensi() != null) {
                    totalMasuk = (int) pegawai.getHistoriAbsensi().stream()
                            .filter(h -> !"ALPHA".equals(h.getStatusMasuk()) && !"TIDAK_HADIR".equals(h.getStatusMasuk()) && !"MENDATANG".equals(h.getStatusMasuk()))
                            .count();
                }
                row.createCell(6).setCellValue(totalMasuk);
                
                Cell potonganAbsenCell = row.createCell(7);
                potonganAbsenCell.setCellValue(pegawai.getPotonganAbsen() != null ? pegawai.getPotonganAbsen().doubleValue() : 0);
                potonganAbsenCell.setCellStyle(pegawai.getIsAttendanceCapped() != null && pegawai.getIsAttendanceCapped() ? cappedCurrencyStyle : currencyStyle);
                
                Cell pemotonganLainCell = row.createCell(8);
                pemotonganLainCell.setCellValue(pegawai.getPemotonganLain() != null ? pegawai.getPemotonganLain().doubleValue() : 0);
                pemotonganLainCell.setCellStyle(pegawai.getIsOtherDeductionsCapped() != null && pegawai.getIsOtherDeductionsCapped() ? cappedCurrencyStyle : currencyStyle);
                
                Cell totalPotonganCell = row.createCell(9);
                totalPotonganCell.setCellValue(pegawai.getTotalPotongan() != null ? pegawai.getTotalPotongan().doubleValue() : 0);
                totalPotonganCell.setCellStyle(pegawai.getIsTotalCapped() != null && pegawai.getIsTotalCapped() ? cappedCurrencyStyle : currencyStyle);
                
                Cell tunjanganBersihCell = row.createCell(10);
                tunjanganBersihCell.setCellValue(pegawai.getTunjanganBersih() != null ? pegawai.getTunjanganBersih().doubleValue() : 0);
                tunjanganBersihCell.setCellStyle(currencyStyle);
            }
        }
        
        // Set custom column widths for better readability
        sheet.setColumnWidth(0, 1500);  // No - narrow
        sheet.setColumnWidth(1, 4000);  // NIP
        sheet.setColumnWidth(2, 8000);  // Nama Pegawai - wider
        sheet.setColumnWidth(3, 6000);  // Jabatan
        sheet.setColumnWidth(4, 4000);  // Lokasi
        sheet.setColumnWidth(5, 5000);  // Tunjangan Kinerja
        sheet.setColumnWidth(6, 3000);  // Total Masuk
        sheet.setColumnWidth(7, 4000);  // Potongan Absen
        sheet.setColumnWidth(8, 4000);  // Potongan Lain
        sheet.setColumnWidth(9, 4000);  // Total Potongan
        sheet.setColumnWidth(10, 4500); // Tunjangan Bersih
    }
    
    // Overloaded method for personal reports using filtered data
    private void createDetailTunjanganSheet(Workbook workbook, LaporanTukin laporan, 
                                          List<LaporanTukinResponse.DetailPegawaiTukin> rincianData,
                                          CellStyle titleStyle, CellStyle headerStyle, CellStyle dataStyle, 
                                          CellStyle nameStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Detail Tunjangan Per Pegawai");
        
        // Create title
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DETAIL TUNJANGAN KINERJA PER PEGAWAI");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
        
        Row periodRow = sheet.createRow(1);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("Periode: " + getMonthName(laporan.getBulan()) + " " + laporan.getTahun());
        periodCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 10));
        
        // Create headers
        Row headerRow = sheet.createRow(3);
        String[] headers = {"No", "NIP", "Nama Pegawai", "Jabatan", "Lokasi", 
                           "Tunjangan Kinerja", "Total Masuk", "Potongan Absen", 
                           "Potongan Lain", "Total Potongan", "Tunjangan Bersih"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Fill employee data using filtered rincianData
        int rowIndex = 4;
        if (rincianData != null) {
            for (int i = 0; i < rincianData.size(); i++) {
                LaporanTukinResponse.DetailPegawaiTukin pegawai = rincianData.get(i);
                Row row = sheet.createRow(rowIndex++);
                
                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(pegawai.getNip() != null ? pegawai.getNip() : "-");
                row.createCell(2).setCellValue(pegawai.getNamaLengkap());
                row.createCell(3).setCellValue(pegawai.getJabatan());
                row.createCell(4).setCellValue(pegawai.getLokasi());
                
                Cell tunjanganCell = row.createCell(5);
                tunjanganCell.setCellValue(pegawai.getTunjanganKinerja());
                tunjanganCell.setCellStyle(currencyStyle);
                
                // Calculate total masuk from historiAbsensi if available
                int totalMasuk = 0;
                if (pegawai.getHistoriAbsensi() != null) {
                    totalMasuk = (int) pegawai.getHistoriAbsensi().stream()
                            .filter(h -> !"ALPHA".equals(h.getStatusMasuk()) && !"TIDAK_HADIR".equals(h.getStatusMasuk()) && !"MENDATANG".equals(h.getStatusMasuk()))
                            .count();
                }
                row.createCell(6).setCellValue(totalMasuk);
                
                Cell potonganAbsenCell = row.createCell(7);
                potonganAbsenCell.setCellValue(pegawai.getPotonganAbsen() != null ? pegawai.getPotonganAbsen().doubleValue() : 0);
                potonganAbsenCell.setCellStyle(currencyStyle);
                
                Cell pemotonganLainCell = row.createCell(8);
                pemotonganLainCell.setCellValue(pegawai.getPemotonganLain() != null ? pegawai.getPemotonganLain().doubleValue() : 0);
                pemotonganLainCell.setCellStyle(currencyStyle);
                
                Cell totalPotonganCell = row.createCell(9);
                totalPotonganCell.setCellValue(pegawai.getTotalPotongan() != null ? pegawai.getTotalPotongan().doubleValue() : 0);
                totalPotonganCell.setCellStyle(currencyStyle);
                
                Cell tunjanganBersihCell = row.createCell(10);
                tunjanganBersihCell.setCellValue(pegawai.getTunjanganBersih() != null ? pegawai.getTunjanganBersih().doubleValue() : 0);
                tunjanganBersihCell.setCellStyle(currencyStyle);
            }
        }
        
        // Set custom column widths for better readability
        sheet.setColumnWidth(0, 1500);  // No - narrow
        sheet.setColumnWidth(1, 4000);  // NIP
        sheet.setColumnWidth(2, 8000);  // Nama Pegawai - wider
        sheet.setColumnWidth(3, 6000);  // Jabatan
        sheet.setColumnWidth(4, 4000);  // Lokasi
        sheet.setColumnWidth(5, 5000);  // Tunjangan Kinerja
        sheet.setColumnWidth(6, 3000);  // Total Masuk
        sheet.setColumnWidth(7, 4000);  // Potongan Absen
        sheet.setColumnWidth(8, 4000);  // Potongan Lain
        sheet.setColumnWidth(9, 4000);  // Total Potongan
        sheet.setColumnWidth(10, 4500); // Tunjangan Bersih
    }
    
    // PDF Generation Method
    @Transactional(timeout = 300, readOnly = true)
    public byte[] generatePDFReport(Long laporanId) throws IOException {
        LaporanTukin laporan = laporanTukinRepository.findById(laporanId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        LaporanTukinResponse response = getLaporanByIdWithDetail(laporanId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            Document document = new Document(PageSize.A4.rotate()); // Landscape untuk tabel lebar
            PdfWriter.getInstance(document, baos);
            document.open();
            
            // Header
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            com.lowagie.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            com.lowagie.text.Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            
            Paragraph title = new Paragraph(laporan.getJudul(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            
            Paragraph period = new Paragraph(
                "Periode: " + laporan.getTanggalMulai().format(DATE_FORMATTER) + 
                " - " + laporan.getTanggalAkhir().format(DATE_FORMATTER), normalFont);
            period.setAlignment(Element.ALIGN_CENTER);
            document.add(period);
            document.add(new Paragraph(" ")); // Space
            
            // Summary table
            PdfPTable summaryTable = new PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingBefore(10);
            summaryTable.setSpacingAfter(15);
            
            addSummaryCell(summaryTable, "Total Pegawai", String.valueOf(response.getTotalPegawai()), headerFont, normalFont);
            addSummaryCell(summaryTable, "Total Tunjangan Kinerja", formatCurrency(response.getTotalTunjanganKinerja()), headerFont, normalFont);
            addSummaryCell(summaryTable, "Total Potongan", formatCurrency(response.getTotalPotonganAbsen().add(response.getTotalPemotongan())), headerFont, normalFont);
            addSummaryCell(summaryTable, "Total Tunjangan Bersih", formatCurrency(response.getTotalTunjanganBersih()), headerFont, normalFont);
            
            document.add(summaryTable);
            
            // Detail pegawai table
            PdfPTable detailTable = new PdfPTable(11);
            detailTable.setWidthPercentage(100);
            detailTable.setWidths(new float[]{3, 8, 12, 10, 8, 10, 5, 8, 8, 8, 10});
            
            // Headers
            String[] headers = {"No", "NIP", "Nama Pegawai", "Jabatan", "Lokasi", 
                              "Tunjangan Kinerja", "Masuk", "Pot. Absen", "Pot. Lain", "Total Pot.", "Tunj. Bersih"};
            
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                cell.setPadding(5);
                detailTable.addCell(cell);
            }
            
            // Data rows
            if (response.getDetailPegawai() != null) {
                for (int i = 0; i < response.getDetailPegawai().size(); i++) {
                    LaporanTukinResponse.DetailPegawaiTukin pegawai = response.getDetailPegawai().get(i);
                    
                    detailTable.addCell(createDataCell(String.valueOf(i + 1), normalFont, Element.ALIGN_CENTER));
                    detailTable.addCell(createDataCell(pegawai.getNip() != null ? pegawai.getNip() : "-", normalFont, Element.ALIGN_LEFT));
                    detailTable.addCell(createDataCell(pegawai.getNamaLengkap(), normalFont, Element.ALIGN_LEFT));
                    detailTable.addCell(createDataCell(pegawai.getJabatan(), normalFont, Element.ALIGN_LEFT));
                    detailTable.addCell(createDataCell(pegawai.getLokasi(), normalFont, Element.ALIGN_LEFT));
                    detailTable.addCell(createDataCell(formatCurrency(BigDecimal.valueOf(pegawai.getTunjanganKinerja() != null ? pegawai.getTunjanganKinerja() : 0)), normalFont, Element.ALIGN_RIGHT));
                    
                    // Calculate total masuk
                    int totalMasuk = 0;
                    if (pegawai.getHistoriAbsensi() != null) {
                        totalMasuk = (int) pegawai.getHistoriAbsensi().stream()
                                .filter(h -> !"ALPHA".equals(h.getStatusMasuk()) && !"TIDAK_HADIR".equals(h.getStatusMasuk()) && !"MENDATANG".equals(h.getStatusMasuk()))
                                .count();
                    }
                    detailTable.addCell(createDataCell(String.valueOf(totalMasuk), normalFont, Element.ALIGN_CENTER));
                    
                    detailTable.addCell(createDataCell(formatCurrency(pegawai.getPotonganAbsen() != null ? pegawai.getPotonganAbsen() : BigDecimal.ZERO), normalFont, Element.ALIGN_RIGHT));
                    detailTable.addCell(createDataCell(formatCurrency(pegawai.getPemotonganLain() != null ? pegawai.getPemotonganLain() : BigDecimal.ZERO), normalFont, Element.ALIGN_RIGHT));
                    detailTable.addCell(createDataCell(formatCurrency(pegawai.getTotalPotongan() != null ? pegawai.getTotalPotongan() : BigDecimal.ZERO), normalFont, Element.ALIGN_RIGHT));
                    detailTable.addCell(createDataCell(formatCurrency(pegawai.getTunjanganBersih() != null ? pegawai.getTunjanganBersih() : BigDecimal.ZERO), normalFont, Element.ALIGN_RIGHT));
                }
            }
            
            document.add(detailTable);
            
            // Add daily breakdown table with percentage deductions
            document.add(new Paragraph(" "));
            Paragraph dailyTitle = new Paragraph("Rincian Harian dengan Persentase Pemotongan", headerFont);
            dailyTitle.setAlignment(Element.ALIGN_LEFT);
            document.add(dailyTitle);
            document.add(new Paragraph(" "));
            
            if (response.getDetailPegawai() != null && !response.getDetailPegawai().isEmpty()) {
                for (LaporanTukinResponse.DetailPegawaiTukin pegawai : response.getDetailPegawai()) {
                    // Employee header
                    Paragraph empHeader = new Paragraph(pegawai.getNamaLengkap() + " (" + (pegawai.getNip() != null ? pegawai.getNip() : "N/A") + ")", headerFont);
                    document.add(empHeader);
                    
                    // Daily breakdown table
                    PdfPTable dailyTable = new PdfPTable(7);
                    dailyTable.setWidthPercentage(100);
                    dailyTable.setWidths(new float[]{8, 6, 8, 10, 10, 12, 12});
                    dailyTable.setSpacingBefore(5);
                    dailyTable.setSpacingAfter(10);
                    
                    // Headers for daily table
                    String[] dailyHeaders = {"Tanggal", "Status", "Jam Masuk", "Jam Keluar", 
                                           "Durasi Kerja", "Potongan (Rp)", "Persentase (%)"};
                    
                    for (String header : dailyHeaders) {
                        PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                        cell.setBackgroundColor(new java.awt.Color(240, 240, 240));
                        cell.setPadding(4);
                        dailyTable.addCell(cell);
                    }
                    
                    // Calculate daily data
                    if (pegawai.getHistoriAbsensi() != null && !pegawai.getHistoriAbsensi().isEmpty()) {
                        BigDecimal totalTunjangan = pegawai.getTunjanganKinerja() != null ? 
                            BigDecimal.valueOf(pegawai.getTunjanganKinerja()) : BigDecimal.ZERO;
                        int totalHariKerja = pegawai.getHistoriAbsensi().size();
                        BigDecimal tunjanganPerHari = totalHariKerja > 0 ? 
                            totalTunjangan.divide(BigDecimal.valueOf(totalHariKerja), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                        
                        for (LaporanTukinResponse.HistoriAbsensi hari : pegawai.getHistoriAbsensi()) {
                            String tanggal = hari.getTanggal() != null ? hari.getTanggal() : "-";
                            String status = hari.getStatusMasuk() != null ? hari.getStatusMasuk() : "HADIR";
                            String jamMasuk = hari.getJamMasuk() != null ? hari.getJamMasuk() : "-";
                            String jamPulang = hari.getJamPulang() != null ? hari.getJamPulang() : "-";
                            
                            // Calculate work duration (simple string display)
                            String durasiKerja = "-";
                            if (hari.getJamMasuk() != null && hari.getJamPulang() != null && 
                                !"-".equals(jamMasuk) && !"-".equals(jamPulang)) {
                                try {
                                    LocalTime masuk = LocalTime.parse(jamMasuk.contains(":") ? jamMasuk : jamMasuk + ":00");
                                    LocalTime pulang = LocalTime.parse(jamPulang.contains(":") ? jamPulang : jamPulang + ":00");
                                    Duration duration = Duration.between(masuk, pulang);
                                    if (duration.isNegative()) {
                                        duration = duration.plusDays(1); // Handle overnight shift
                                    }
                                    long hours = duration.toHours();
                                    long minutes = duration.toMinutes() % 60;
                                    durasiKerja = String.format("%02d:%02d", hours, minutes);
                                } catch (Exception e) {
                                    durasiKerja = "-";
                                }
                            }
                            
                            // Get deduction info from HistoriAbsensi if available
                            BigDecimal potonganHari = hari.getNominalPemotongan() != null ? 
                                hari.getNominalPemotongan() : BigDecimal.ZERO;
                            BigDecimal persentasePotongan = hari.getPersentasePemotongan() != null ? 
                                hari.getPersentasePemotongan() : BigDecimal.ZERO;
                            
                            // ATURAN BARU: Apply 60% factor untuk persentase display
                            // If no specific deduction data, calculate based on status
                            if (potonganHari.equals(BigDecimal.ZERO) && persentasePotongan.equals(BigDecimal.ZERO)) {
                                if ("ALPHA".equals(status) || "TIDAK_HADIR".equals(status)) {
                                    // Rumus baru: 100% * 60% * tunjanganPerHari
                                    BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                                    potonganHari = tunjanganPerHari.multiply(defaultFactor); // 60% dari tunjangan per hari
                                    persentasePotongan = BigDecimal.valueOf(100); // Display 100% (sebelum dikali 60%)
                                } else if ("SAKIT".equals(status)) {
                                    // Rumus baru: 50% * 60% * tunjanganPerHari
                                    BigDecimal defaultFactor = BigDecimal.valueOf(60).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                                    potonganHari = tunjanganPerHari.multiply(BigDecimal.valueOf(0.5)).multiply(defaultFactor); // 50% * 60%
                                    persentasePotongan = BigDecimal.valueOf(50); // Display 50% (sebelum dikali 60%)
                                } else if ("CUTI".equals(status)) {
                                    potonganHari = BigDecimal.ZERO; // No deduction for approved leave  
                                    persentasePotongan = BigDecimal.ZERO;
                                } else if ("LIBUR".equals(status)) {
                                    potonganHari = BigDecimal.ZERO; // No deduction for holidays  
                                    persentasePotongan = BigDecimal.ZERO;
                                }
                                // Additional deduction logic can be added here
                            }
                            
                            // Add row data
                            dailyTable.addCell(createDataCell(tanggal, normalFont, Element.ALIGN_CENTER));
                            dailyTable.addCell(createDataCell(status, normalFont, Element.ALIGN_CENTER));
                            dailyTable.addCell(createDataCell(jamMasuk, normalFont, Element.ALIGN_CENTER));
                            dailyTable.addCell(createDataCell(jamPulang, normalFont, Element.ALIGN_CENTER));
                            dailyTable.addCell(createDataCell(durasiKerja, normalFont, Element.ALIGN_CENTER));
                            dailyTable.addCell(createDataCell(formatCurrency(potonganHari), normalFont, Element.ALIGN_RIGHT));
                            dailyTable.addCell(createDataCell(String.format("%.2f%%", persentasePotongan.doubleValue()), normalFont, Element.ALIGN_RIGHT));
                        }
                    } else {
                        // No attendance data
                        PdfPCell noDataCell = new PdfPCell(new Phrase("Tidak ada data absensi", normalFont));
                        noDataCell.setColspan(7);
                        noDataCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                        noDataCell.setPadding(10);
                        dailyTable.addCell(noDataCell);
                    }
                    
                    document.add(dailyTable);
                    document.add(new Paragraph(" ")); // Space between employees
                }
            }
            
            // Footer
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph(
                "Generated pada: " + (laporan.getTanggalGenerate() != null ? laporan.getTanggalGenerate().format(DATE_FORMATTER) : "-") + 
                " oleh " + laporan.getGeneratedBy().getNamaLengkap(), normalFont);
            footer.setAlignment(Element.ALIGN_LEFT);
            document.add(footer);
            
            document.close();
            
        } catch (DocumentException e) {
            throw new IOException("Error generating PDF: " + e.getMessage(), e);
        }
        
        return baos.toByteArray();
    }
    
    private void addSummaryCell(PdfPTable table, String label, String value, com.lowagie.text.Font headerFont, com.lowagie.text.Font normalFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, headerFont));
        labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        labelCell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
        labelCell.setPadding(5);
        table.addCell(labelCell);
        
        PdfPCell valueCell = new PdfPCell(new Phrase(value, normalFont));
        valueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }
    
    private PdfPCell createDataCell(String content, com.lowagie.text.Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(content, font));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(3);
        return cell;
    }
    
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) amount = BigDecimal.ZERO;
        return String.format("Rp %,d", amount.longValue());
    }
    
    public byte[] generateExcelReportPersonal(Long laporanId, Long pegawaiId) throws IOException {
        log.info("Generating personal Excel report for laporan: {}, pegawai: {}", laporanId, pegawaiId);
        
        // Use modified method that only gets data for specific pegawai
        return generateExcelReportForPegawai(laporanId, pegawaiId);
    }
    
    @Transactional(timeout = 300, readOnly = true)
    public byte[] generatePDFReportPersonal(Long laporanId, Long pegawaiId) throws IOException {
        log.info("Generating personal PDF report for laporan: {}, pegawai: {}", laporanId, pegawaiId);
        
        // Use modified method that only gets data for specific pegawai  
        return generatePDFReportForPegawai(laporanId, pegawaiId);
    }
    
    private byte[] generateExcelReportForPegawai(Long laporanId, Long pegawaiId) throws IOException {
        LaporanTukin laporan = laporanTukinRepository.findById(laporanId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        // Get data only for the specific pegawai
        List<LaporanTukinResponse.DetailPegawaiTukin> rincianData = getRincianDetailPerPegawai(laporanId, pegawaiId);
        
        // Get holidays for the period
        List<HariLibur> holidays = hariLiburRepository.findByTanggalLiburBetweenAndIsActiveTrue(
                laporan.getTanggalMulai(), laporan.getTanggalAkhir());
        
        Workbook workbook = new XSSFWorkbook();
        
        // Create styles
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle emptyHeaderStyle = createEmptyHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle dateStyle = createDateStyle(workbook);
        CellStyle holidayStyle = createHolidayStyle(workbook);
        CellStyle nameStyle = createNameStyle(workbook);
        CellStyle numberStyle = createNumberStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);
        
        // Create sheets with personal data only
        createInputAbsensiSheet(workbook, rincianData, laporan, holidays, 
                              titleStyle, headerStyle, emptyHeaderStyle, dataStyle, 
                              dateStyle, holidayStyle, nameStyle, numberStyle, currencyStyle);
        createRekapitulasiPemotonganSheet(workbook, rincianData, laporan, 
                                        titleStyle, headerStyle, dataStyle, nameStyle, currencyStyle);
        createSummaryKehadiranSheet(workbook, rincianData, laporan, 
                                  titleStyle, headerStyle, dataStyle);
        // Use overloaded method for personal reports with filtered data
        createDetailTunjanganSheet(workbook, laporan, rincianData,
                                 titleStyle, headerStyle, dataStyle, nameStyle, currencyStyle);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream.toByteArray();
    }
    
    private byte[] generatePDFReportForPegawai(Long laporanId, Long pegawaiId) throws IOException {
        LaporanTukin laporan = laporanTukinRepository.findById(laporanId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        // Get data only for the specific pegawai
        List<LaporanTukinResponse.DetailPegawaiTukin> rincianData = getRincianDetailPerPegawai(laporanId, pegawaiId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, baos);
        
        document.open();
        
        // Define fonts with formal business colors
        com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new CMYKColor(0.8f, 0.6f, 0, 0.2f)); // Dark navy
        com.lowagie.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new CMYKColor(0.6f, 0.4f, 0, 0.1f)); // Medium navy
        com.lowagie.text.Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0.4f, 0.3f, 0, 0.05f)); // Light navy
        com.lowagie.text.Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        com.lowagie.text.Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        com.lowagie.text.Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new CMYKColor(0.5f, 0.3f, 0, 0.1f)); // Formal label color
        
        // Add professional header section with formal styling
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(20f);
        
        PdfPCell headerCell = new PdfPCell();
        headerCell.setBorder(Rectangle.BOX);
        headerCell.setBorderWidth(2f);
        headerCell.setBorderColor(new CMYKColor(0, 0, 0, 0.6f)); // Dark gray border
        headerCell.setPadding(15f);
        headerCell.setBackgroundColor(new CMYKColor(0, 0, 0, 0.05f)); // Very light gray background
        
        Paragraph title = new Paragraph("LAPORAN TUNJANGAN KINERJA PRIBADI", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(8f);
        
        String[] bulanNama = {"", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                             "Juli", "Agustus", "September", "Oktober", "November", "Desember"};
        String periodText = bulanNama[laporan.getBulan()] + " " + laporan.getTahun();
        Paragraph subtitle = new Paragraph("Periode: " + periodText, headerFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(5f);
        
        Paragraph reportType = new Paragraph("LAPORAN PRIBADI", subHeaderFont);
        reportType.setAlignment(Element.ALIGN_CENTER);
        
        headerCell.addElement(title);
        headerCell.addElement(subtitle);
        headerCell.addElement(reportType);
        headerTable.addCell(headerCell);
        document.add(headerTable);
        
        // Employee Details with professional styling
        for (LaporanTukinResponse.DetailPegawaiTukin detail : rincianData) {
            // Employee information section with professional styling
            Paragraph empHeader = new Paragraph("INFORMASI PEGAWAI", headerFont);
            empHeader.setAlignment(Element.ALIGN_LEFT);
            empHeader.setSpacingBefore(15f);
            empHeader.setSpacingAfter(8f);
            document.add(empHeader);
            
            // Create professional employee info table
            PdfPTable empTable = new PdfPTable(4);
            empTable.setWidthPercentage(100);
            empTable.setSpacingBefore(5f);
            empTable.setSpacingAfter(15f);
            float[] empColumnWidths = {1.2f, 2.3f, 1.2f, 2.3f};
            empTable.setWidths(empColumnWidths);
            
            // Employee info rows with formal styling
            PdfPCell nameLabel = new PdfPCell(new Phrase("Nama:", labelFont));
            nameLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.08f)); // Light gray
            nameLabel.setPadding(8f);
            nameLabel.setBorder(Rectangle.BOX);
            empTable.addCell(nameLabel);
            
            PdfPCell nameValue = new PdfPCell(new Phrase(detail.getNamaLengkap() != null ? detail.getNamaLengkap() : "-", normalFont));
            nameValue.setPadding(8f);
            nameValue.setBorder(Rectangle.BOX);
            empTable.addCell(nameValue);
            
            PdfPCell nipLabel = new PdfPCell(new Phrase("NIP:", labelFont));
            nipLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.08f)); // Light gray
            nipLabel.setPadding(8f);
            nipLabel.setBorder(Rectangle.BOX);
            empTable.addCell(nipLabel);
            
            PdfPCell nipValue = new PdfPCell(new Phrase(detail.getNip() != null ? detail.getNip() : "-", normalFont));
            nipValue.setPadding(8f);
            nipValue.setBorder(Rectangle.BOX);
            empTable.addCell(nipValue);
            
            PdfPCell jabatanLabel = new PdfPCell(new Phrase("Jabatan:", labelFont));
            jabatanLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.08f)); // Light gray
            jabatanLabel.setPadding(8f);
            jabatanLabel.setBorder(Rectangle.BOX);
            empTable.addCell(jabatanLabel);
            
            PdfPCell jabatanValue = new PdfPCell(new Phrase(detail.getJabatan() != null ? detail.getJabatan() : "-", normalFont));
            jabatanValue.setPadding(8f);
            jabatanValue.setBorder(Rectangle.BOX);
            empTable.addCell(jabatanValue);
            
            PdfPCell unitLabel = new PdfPCell(new Phrase("Lokasi Kerja:", labelFont));
            unitLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.08f)); // Light gray
            unitLabel.setPadding(8f);
            unitLabel.setBorder(Rectangle.BOX);
            empTable.addCell(unitLabel);
            
            PdfPCell unitValue = new PdfPCell(new Phrase(detail.getLokasi() != null ? detail.getLokasi() : "-", normalFont));
            unitValue.setPadding(8f);
            unitValue.setBorder(Rectangle.BOX);
            empTable.addCell(unitValue);
            
            document.add(empTable);
            
            // Financial summary section with enhanced styling
            Paragraph finHeader = new Paragraph("RINGKASAN KEUANGAN", headerFont);
            finHeader.setAlignment(Element.ALIGN_LEFT);
            finHeader.setSpacingBefore(15f);
            finHeader.setSpacingAfter(8f);
            document.add(finHeader);
            
            // Create professional financial table
            PdfPTable finTable = new PdfPTable(2);
            finTable.setWidthPercentage(100);
            finTable.setSpacingBefore(5f);
            finTable.setSpacingAfter(15f);
            float[] finColumnWidths = {3f, 2f};
            finTable.setWidths(finColumnWidths);
            
            // Financial info rows with formal business styling
            PdfPCell tunjanganLabel = new PdfPCell(new Phrase("Tunjangan Kinerja:", labelFont));
            tunjanganLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.08f)); // Light gray
            tunjanganLabel.setPadding(10f);
            tunjanganLabel.setBorder(Rectangle.BOX);
            finTable.addCell(tunjanganLabel);
            
            PdfPCell tunjanganValue = new PdfPCell(new Phrase(formatCurrency(BigDecimal.valueOf(detail.getTunjanganKinerja())), normalFont));
            tunjanganValue.setPadding(10f);
            tunjanganValue.setBorder(Rectangle.BOX);
            tunjanganValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            finTable.addCell(tunjanganValue);
            
            PdfPCell potonganAbsenLabel = new PdfPCell(new Phrase("Potongan Absen:", labelFont));
            potonganAbsenLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.08f)); // Light gray
            potonganAbsenLabel.setPadding(10f);
            potonganAbsenLabel.setBorder(Rectangle.BOX);
            finTable.addCell(potonganAbsenLabel);
            
            com.lowagie.text.Font redFont = FontFactory.getFont(FontFactory.HELVETICA, 11, new CMYKColor(0, 0.6f, 0.6f, 0.2f)); // Formal dark red
            PdfPCell potonganAbsenValue = new PdfPCell(new Phrase(formatCurrency(detail.getPotonganAbsen()), redFont));
            potonganAbsenValue.setPadding(10f);
            potonganAbsenValue.setBorder(Rectangle.BOX);
            potonganAbsenValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            finTable.addCell(potonganAbsenValue);
            
            PdfPCell potonganLainLabel = new PdfPCell(new Phrase("Potongan Lain:", labelFont));
            potonganLainLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.08f)); // Light gray
            potonganLainLabel.setPadding(10f);
            potonganLainLabel.setBorder(Rectangle.BOX);
            finTable.addCell(potonganLainLabel);
            
            PdfPCell potonganLainValue = new PdfPCell(new Phrase(formatCurrency(detail.getPemotonganLain()), redFont));
            potonganLainValue.setPadding(10f);
            potonganLainValue.setBorder(Rectangle.BOX);
            potonganLainValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            finTable.addCell(potonganLainValue);
            
            PdfPCell totalPotonganLabel = new PdfPCell(new Phrase("Total Potongan:", labelFont));
            totalPotonganLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.12f)); // Medium gray
            totalPotonganLabel.setPadding(10f);
            totalPotonganLabel.setBorder(Rectangle.BOX);
            finTable.addCell(totalPotonganLabel);
            
            PdfPCell totalPotonganValue = new PdfPCell(new Phrase(formatCurrency(detail.getTotalPotongan()), redFont));
            totalPotonganValue.setPadding(10f);
            totalPotonganValue.setBorder(Rectangle.BOX);
            totalPotonganValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            finTable.addCell(totalPotonganValue);
            
            PdfPCell totalLabel = new PdfPCell(new Phrase("Tunjangan Bersih:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0, 0, 0, 0.8f))));
            totalLabel.setBackgroundColor(new CMYKColor(0, 0, 0, 0.15f)); // Darker gray for emphasis
            totalLabel.setPadding(12f);
            totalLabel.setBorder(Rectangle.BOX);
            totalLabel.setBorderWidth(2f);
            finTable.addCell(totalLabel);
            
            com.lowagie.text.Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0, 0, 0, 0.8f)); // Dark gray
            PdfPCell totalValue = new PdfPCell(new Phrase(formatCurrency(detail.getTunjanganBersih()), boldFont));
            totalValue.setPadding(12f);
            totalValue.setBorder(Rectangle.BOX);
            totalValue.setBorderWidth(2f);
            totalValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            finTable.addCell(totalValue);
            
            document.add(finTable);
            
            // Attendance statistics section with enhanced styling
            if (detail.getStatistikAbsen() != null) {
                Paragraph statsHeader = new Paragraph("STATISTIK KEHADIRAN", headerFont);
                statsHeader.setAlignment(Element.ALIGN_LEFT);
                statsHeader.setSpacingBefore(15f);
                statsHeader.setSpacingAfter(8f);
                document.add(statsHeader);
                
                // Create professional statistics table
                Map<String, Object> stats = detail.getStatistikAbsen();
                PdfPTable statsTable = new PdfPTable(5);
                statsTable.setWidthPercentage(100);
                statsTable.setSpacingBefore(5f);
                statsTable.setSpacingAfter(15f);
                float[] statsColumnWidths = {1f, 1f, 1f, 1f, 1f};
                statsTable.setWidths(statsColumnWidths);
                
                // Statistics headers with formal business colors
                String[] headers = {"Hadir", "Alpha", "Cuti", "Libur", "Mendatang"};
                CMYKColor[] headerColors = {
                    new CMYKColor(0, 0, 0, 0.5f), // Dark gray for Hadir
                    new CMYKColor(0, 0, 0, 0.6f), // Darker gray for Alpha
                    new CMYKColor(0, 0, 0, 0.45f), // Medium dark gray for Cuti
                    new CMYKColor(0, 0, 0, 0.4f), // Medium gray for Libur
                    new CMYKColor(0, 0, 0, 0.35f)  // Light dark gray for Mendatang
                };
                
                for (int i = 0; i < headers.length; i++) {
                    PdfPCell cell = new PdfPCell(new Phrase(headers[i], FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, CMYKColor.WHITE)));
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cell.setBackgroundColor(headerColors[i]);
                    cell.setPadding(8f);
                    cell.setBorder(Rectangle.BOX);
                    statsTable.addCell(cell);
                }
                
                // Statistics values with formal colors
                // Hadir - Dark green
                Object hadirObj = stats.get("hadir");
                int hadir = hadirObj != null ? Integer.parseInt(hadirObj.toString()) : 0;
                PdfPCell hadirCell = new PdfPCell(new Phrase(String.valueOf(hadir), 
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0.4f, 0, 0.4f, 0.2f))));
                hadirCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                hadirCell.setPadding(10f);
                hadirCell.setBorder(Rectangle.BOX);
                statsTable.addCell(hadirCell);
                
                // Alpha - Dark red
                Object alphaObj = stats.get("alpha");
                int alpha = alphaObj != null ? Integer.parseInt(alphaObj.toString()) : 0;
                PdfPCell alphaCell = new PdfPCell(new Phrase(String.valueOf(alpha), 
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0, 0.6f, 0.6f, 0.3f))));
                alphaCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                alphaCell.setPadding(10f);
                alphaCell.setBorder(Rectangle.BOX);
                statsTable.addCell(alphaCell);
                
                // Cuti - Dark blue
                Object cutiObj = stats.get("cuti");
                int cuti = cutiObj != null ? Integer.parseInt(cutiObj.toString()) : 0;
                PdfPCell cutiCell = new PdfPCell(new Phrase(String.valueOf(cuti), 
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0.6f, 0.3f, 0, 0.2f))));
                cutiCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cutiCell.setPadding(10f);
                cutiCell.setBorder(Rectangle.BOX);
                statsTable.addCell(cutiCell);
                
                // Libur - Dark gray
                Object liburObj = stats.get("libur");
                int libur = liburObj != null ? Integer.parseInt(liburObj.toString()) : 0;
                PdfPCell liburCell = new PdfPCell(new Phrase(String.valueOf(libur), 
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0, 0, 0, 0.7f))));
                liburCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                liburCell.setPadding(10f);
                liburCell.setBorder(Rectangle.BOX);
                statsTable.addCell(liburCell);
                
                // Mendatang - Dark brown
                Object mendatangObj = stats.get("mendatang");
                int mendatang = mendatangObj != null ? Integer.parseInt(mendatangObj.toString()) : 0;
                PdfPCell mendatangCell = new PdfPCell(new Phrase(String.valueOf(mendatang), 
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new CMYKColor(0.2f, 0.4f, 0.6f, 0.2f))));
                mendatangCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                mendatangCell.setPadding(10f);
                mendatangCell.setBorder(Rectangle.BOX);
                statsTable.addCell(mendatangCell);
                
                document.add(statsTable);
            }
            
            // Attendance Details if available
            if (detail.getHistoriAbsensi() != null && !detail.getHistoriAbsensi().isEmpty()) {
                Paragraph histHeader = new Paragraph("RINCIAN KEHADIRAN", headerFont);
                histHeader.setAlignment(Element.ALIGN_LEFT);
                histHeader.setSpacingBefore(15f);
                histHeader.setSpacingAfter(8f);
                document.add(histHeader);
                
                // Create professional attendance table
                PdfPTable histTable = new PdfPTable(6);
                histTable.setWidthPercentage(100);
                histTable.setSpacingBefore(5f);
                histTable.setSpacingAfter(10f);
                float[] columnWidths = {2.2f, 1.8f, 1.8f, 1.8f, 1.8f, 2.6f};
                histTable.setWidths(columnWidths);
                
                // Professional headers with formal business styling
                String[] histHeaders = {"Tanggal", "Jam Masuk", "Jam Pulang", "Status Masuk", "Status Pulang", "Keterangan"};
                for (String header : histHeaders) {
                    PdfPCell cell = new PdfPCell(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, CMYKColor.WHITE)));
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cell.setBackgroundColor(new CMYKColor(0, 0, 0, 0.7f)); // Dark gray header
                    cell.setPadding(6f);
                    cell.setBorder(Rectangle.BOX);
                    cell.setBorderWidth(1f);
                    histTable.addCell(cell);
                }
                
                // Data rows with subtle alternating colors (limit to first 15 for better visibility)
                int maxRows = Math.min(15, detail.getHistoriAbsensi().size());
                for (int i = 0; i < maxRows; i++) {
                    LaporanTukinResponse.HistoriAbsensi hist = detail.getHistoriAbsensi().get(i);
                    
                    // Subtle alternating row colors for better readability
                    CMYKColor rowColor = (i % 2 == 0) ? new CMYKColor(0, 0, 0, 0.02f) : new CMYKColor(0, 0, 0, 0.05f);
                    
                    PdfPCell tanggalCell = new PdfPCell(new Phrase(hist.getTanggal() != null ? hist.getTanggal() : "-", smallFont));
                    tanggalCell.setPadding(5f);
                    tanggalCell.setBorder(Rectangle.BOX);
                    tanggalCell.setBackgroundColor(rowColor);
                    tanggalCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    histTable.addCell(tanggalCell);
                    
                    PdfPCell masukCell = new PdfPCell(new Phrase(hist.getJamMasuk() != null ? hist.getJamMasuk() : "-", smallFont));
                    masukCell.setPadding(5f);
                    masukCell.setBorder(Rectangle.BOX);
                    masukCell.setBackgroundColor(rowColor);
                    masukCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    histTable.addCell(masukCell);
                    
                    PdfPCell pulangCell = new PdfPCell(new Phrase(hist.getJamPulang() != null ? hist.getJamPulang() : "-", smallFont));
                    pulangCell.setPadding(5f);
                    pulangCell.setBorder(Rectangle.BOX);
                    pulangCell.setBackgroundColor(rowColor);
                    pulangCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    histTable.addCell(pulangCell);
                    
                    // Status cells with color coding
                    String statusMasuk = hist.getStatusMasuk() != null ? hist.getStatusMasuk() : "-";
                    com.lowagie.text.Font statusMasukFont = getStatusFont(statusMasuk);
                    PdfPCell statusMasukCell = new PdfPCell(new Phrase(statusMasuk, statusMasukFont));
                    statusMasukCell.setPadding(5f);
                    statusMasukCell.setBorder(Rectangle.BOX);
                    statusMasukCell.setBackgroundColor(rowColor);
                    statusMasukCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    histTable.addCell(statusMasukCell);
                    
                    String statusPulang = hist.getStatusPulang() != null ? hist.getStatusPulang() : "-";
                    com.lowagie.text.Font statusPulangFont = getStatusFont(statusPulang);
                    PdfPCell statusPulangCell = new PdfPCell(new Phrase(statusPulang, statusPulangFont));
                    statusPulangCell.setPadding(5f);
                    statusPulangCell.setBorder(Rectangle.BOX);
                    statusPulangCell.setBackgroundColor(rowColor);
                    statusPulangCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    histTable.addCell(statusPulangCell);
                    
                    PdfPCell keteranganCell = new PdfPCell(new Phrase(hist.getKeterangan() != null ? hist.getKeterangan() : "-", smallFont));
                    keteranganCell.setPadding(5f);
                    keteranganCell.setBorder(Rectangle.BOX);
                    keteranganCell.setBackgroundColor(rowColor);
                    histTable.addCell(keteranganCell);
                }
                
                document.add(histTable);
                
                if (detail.getHistoriAbsensi().size() > 15) {
                    Paragraph note = new Paragraph("* Menampilkan 15 data teratas dari total " + detail.getHistoriAbsensi().size() + " hari kehadiran", 
                        FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new CMYKColor(0, 0, 0, 0.6f)));
                    note.setAlignment(Element.ALIGN_LEFT);
                    note.setSpacingBefore(5f);
                    document.add(note);
                }
            }
        }
        
        // Add professional footer
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));
        
        PdfPTable footerTable = new PdfPTable(1);
        footerTable.setWidthPercentage(100);
        footerTable.setSpacingBefore(20f);
        
        PdfPCell footerCell = new PdfPCell();
        footerCell.setBorder(Rectangle.TOP);
        footerCell.setBorderWidth(1f);
        footerCell.setBorderColor(new CMYKColor(0, 0, 0, 0.3f));
        footerCell.setPadding(10f);
        
        Paragraph footerText = new Paragraph("Laporan ini digenerate secara otomatis pada " + 
            new java.text.SimpleDateFormat("dd MMMM yyyy 'pukul' HH:mm", java.util.Locale.forLanguageTag("id-ID")).format(new java.util.Date()), 
            FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new CMYKColor(0, 0, 0, 0.6f)));
        footerText.setAlignment(Element.ALIGN_CENTER);
        
        footerCell.addElement(footerText);
        footerTable.addCell(footerCell);
        document.add(footerTable);
        
        document.close();
        return baos.toByteArray();
    }
    
    public void deleteLaporan(Long id) {
        log.info("Deleting laporan tukin with id: {}", id);
        
        LaporanTukin laporan = laporanTukinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        laporanTukinRepository.delete(laporan);
        log.info("Laporan tukin dengan id {} berhasil dihapus", id);
    }
    
    // Personal report methods for pegawai
    
    public LaporanTukinResponse generateLaporanTukinPribadi(LaporanTukinRequest request, Pegawai currentUser) {
        log.info("Generating personal laporan tukin for pegawai: {} for period: {}/{}", 
                currentUser.getNamaLengkap(), request.getBulan(), request.getTahun());
        
        // Force request to be for current user only
        request.setPegawaiId(currentUser.getId());
        
        // Check if a personal report already exists for this period and user
        List<LaporanTukin> existingReports = laporanTukinRepository.findByBulanAndTahunOrderByTanggalGenerateDesc(
                request.getBulan(), request.getTahun());
        
        // Check if current user already has a personal report for this period
        boolean userHasReport = existingReports.stream()
                .anyMatch(report -> report.getGeneratedBy().getId().equals(currentUser.getId()) 
                         && Boolean.TRUE.equals(report.getIsPersonalReport()));
        
        if (userHasReport) {
            throw new RuntimeException("Anda sudah memiliki laporan pribadi untuk periode ini. Silakan hapus laporan lama jika ingin membuat yang baru.");
        }
        
        return generateLaporanTukin(request, currentUser);
    }
    
    public Page<LaporanTukinResponse> getHistoriLaporanPribadi(int page, int size, Integer bulan, Integer tahun, String status, Long pegawaiId) {
        log.info("Getting personal laporan tukin history for pegawai: {}", pegawaiId);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<LaporanTukin> laporanPage;
        
        if (bulan != null && tahun != null && status != null && !status.trim().isEmpty()) {
            laporanPage = laporanTukinRepository.findByBulanAndTahunAndStatusAndGeneratedByIdOrderByTanggalGenerateDesc(
                    bulan, tahun, status, pegawaiId, pageable);
        } else if (bulan != null && tahun != null) {
            laporanPage = laporanTukinRepository.findByBulanAndTahunAndGeneratedByIdOrderByTanggalGenerateDesc(
                    bulan, tahun, pegawaiId, pageable);
        } else if (bulan != null) {
            laporanPage = laporanTukinRepository.findByBulanAndGeneratedByIdOrderByTanggalGenerateDesc(
                    bulan, pegawaiId, pageable);
        } else if (tahun != null) {
            laporanPage = laporanTukinRepository.findByTahunAndGeneratedByIdOrderByTanggalGenerateDesc(
                    tahun, pegawaiId, pageable);
        } else if (status != null && !status.trim().isEmpty()) {
            laporanPage = laporanTukinRepository.findByStatusAndGeneratedByIdOrderByTanggalGenerateDesc(
                    status, pegawaiId, pageable);
        } else {
            laporanPage = laporanTukinRepository.findByGeneratedByIdOrderByTanggalGenerateDesc(
                    pegawaiId, pageable);
        }
        
        return laporanPage.map(this::convertToResponse);
    }
    
    public LaporanTukinResponse getLaporanByIdPribadi(Long id, Long pegawaiId) {
        log.info("Getting personal laporan tukin by id: {} for pegawai: {}", id, pegawaiId);
        
        LaporanTukin laporan = laporanTukinRepository.findByIdAndGeneratedById(id, pegawaiId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan atau tidak memiliki akses"));
        
        return convertToResponse(laporan);
    }
    
    public LaporanTukinResponse getDetailLaporanByIdPribadi(Long id, Long pegawaiId) {
        log.info("Getting personal laporan tukin detail by id: {} for pegawai: {}", id, pegawaiId);
        
        LaporanTukin laporan = laporanTukinRepository.findByIdAndGeneratedById(id, pegawaiId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan atau tidak memiliki akses"));
        
        return convertToResponseWithDetail(laporan, pegawaiId);
    }
    
    public byte[] downloadLaporanPribadi(Long id, Long pegawaiId) throws IOException {
        log.info("Downloading personal laporan tukin file by id: {} for pegawai: {}", id, pegawaiId);
        
        // Verify access
        laporanTukinRepository.findByIdAndGeneratedById(id, pegawaiId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan atau tidak memiliki akses"));
        
        return generateExcelReportPersonal(id, pegawaiId);
    }
    
    public byte[] downloadLaporanPribadiPDF(Long id, Long pegawaiId) throws IOException {
        log.info("Downloading personal laporan tukin PDF by id: {} for pegawai: {}", id, pegawaiId);
        
        // Verify access
        laporanTukinRepository.findByIdAndGeneratedById(id, pegawaiId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan atau tidak memiliki akses"));
        
        return generatePDFReportPersonal(id, pegawaiId);
    }
    
    public List<LaporanTukinResponse.DetailPegawaiTukin> getRincianDetailLaporanPribadi(Long laporanId, Long pegawaiId, Long currentUserId) {
        log.info("Getting rincian detail personal laporan tukin for laporan: {}, pegawai: {}, by user: {}", 
                laporanId, pegawaiId, currentUserId);
        
        // Verify access - ensure the laporan belongs to current user
        laporanTukinRepository.findByIdAndGeneratedById(laporanId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan atau tidak memiliki akses"));
        
        // For personal reports, only return data for current user (pegawaiId should equal currentUserId)
        if (!pegawaiId.equals(currentUserId)) {
            throw new RuntimeException("Access denied - can only view own data");
        }
        
        return getRincianDetailPerPegawai(laporanId, pegawaiId);
    }
    
    public List<Object> getPegawaiListLaporanPribadi(Long laporanId, Long currentUserId) {
        log.info("Getting pegawai list for personal laporan tukin: {} by user: {}", laporanId, currentUserId);
        
        // Verify access - ensure the laporan belongs to current user
        laporanTukinRepository.findByIdAndGeneratedById(laporanId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan atau tidak memiliki akses"));
        
        // For personal reports, only return current user in the list
        Pegawai currentUser = pegawaiRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        Map<String, Object> pegawaiInfo = new HashMap<>();
        pegawaiInfo.put("id", currentUser.getId());
        pegawaiInfo.put("nip", currentUser.getNip());
        pegawaiInfo.put("namaLengkap", currentUser.getNamaLengkap());
        pegawaiInfo.put("jabatan", currentUser.getJabatan() != null ? currentUser.getJabatan().getNama() : "N/A");
        pegawaiInfo.put("lokasi", currentUser.getLokasi() != null ? currentUser.getLokasi().getNamaLokasi() : "N/A");
        
        return List.of(pegawaiInfo);
    }

    public void deleteLaporanPribadi(Long id, Long pegawaiId) {
        log.info("Deleting personal laporan tukin: {} by pegawai: {}", id, pegawaiId);
        
        // Verify the laporan exists and belongs to the current user
        LaporanTukin laporan = laporanTukinRepository.findByIdAndGeneratedById(id, pegawaiId)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan atau tidak memiliki akses untuk menghapus"));
        
        // Only allow deletion of personal reports
        if (!Boolean.TRUE.equals(laporan.getIsPersonalReport())) {
            throw new RuntimeException("Hanya laporan pribadi yang dapat dihapus");
        }
        
        // Delete the main laporan
        laporanTukinRepository.delete(laporan);
        
        log.info("Successfully deleted personal laporan tukin with id: {}", id);
    }
    
    // Helper method for status font coloring in PDF with formal colors
    private com.lowagie.text.Font getStatusFont(String status) {
        if (status == null) {
            return FontFactory.getFont(FontFactory.HELVETICA, 9);
        }
        
        switch (status.toUpperCase()) {
            case "HADIR":
            case "TEPAT WAKTU":
                return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new CMYKColor(0.4f, 0, 0.4f, 0.3f)); // Dark green
            case "ALPHA":
            case "TERLAMBAT":
                return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new CMYKColor(0, 0.6f, 0.6f, 0.4f)); // Dark red
            case "CUTI":
                return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new CMYKColor(0.6f, 0.3f, 0, 0.3f)); // Dark blue
            case "LIBUR":
                return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new CMYKColor(0, 0, 0, 0.6f)); // Dark gray
            case "MENDATANG":
                return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new CMYKColor(0.2f, 0.4f, 0.6f, 0.3f)); // Dark brown
            default:
                return FontFactory.getFont(FontFactory.HELVETICA, 9);
        }
    }
}
