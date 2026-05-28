package com.shadcn.backend.seeder;

import com.shadcn.backend.model.LaporanTukin;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.LaporanTukinRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
@Order(105) // Run after AbsensiSeptember2025Seeder
public class LaporanTukinSeptember2025Seeder implements CommandLineRunner {

    private final LaporanTukinRepository laporanTukinRepository;
    private final PegawaiRepository pegawaiRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("📊 Starting Laporan Tukin September 2025 Seeder...");
        
        // Check if September 2025 laporan already exists
        List<LaporanTukin> existingReports = laporanTukinRepository.findByBulanAndTahunOrderByTanggalGenerateDesc(9, 2025);
        if (!existingReports.isEmpty()) {
            log.info("📋 Laporan Tukin September 2025 already exists, skipping seeder...");
            return;
        }

        // Get admin user to set as generator
        Pegawai admin = pegawaiRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        // Create September 2025 Laporan Tukin
        LaporanTukin laporan = LaporanTukin.builder()
                .judul("Laporan Tunjangan Kinerja September 2025")
                .bulan(9)
                .tahun(2025)
                .tanggalMulai(LocalDate.of(2025, 9, 1))
                .tanggalAkhir(LocalDate.of(2025, 9, 30))
                .startDate(LocalDate.of(2025, 9, 1))
                .endDate(LocalDate.of(2025, 9, 30))
                .totalTukin(BigDecimal.ZERO)
                .jenisLaporan("BULANAN")
                .judulLaporan("Laporan Tunjangan Kinerja September 2025")
                .periode("September 2025")
                .statusLaporan("DRAFT")
                .formatLaporan("PDF")
                .status("GENERATED")
                .totalPegawai(0)
                .totalTunjanganKinerja(BigDecimal.ZERO)
                .totalPotonganAbsen(BigDecimal.ZERO)
                .totalPemotongan(BigDecimal.ZERO)
                .totalTunjanganBersih(BigDecimal.ZERO)
                .generatedBy(admin)
                .tanggalGenerate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        laporanTukinRepository.save(laporan);
        
        log.info("✅ Created Laporan Tukin September 2025 with ID: {}", laporan.getId());
        log.info("🎯 LaporanTukin September 2025 Seeder completed successfully!");
    }
}
