package com.shadcn.backend.seeder;

import com.shadcn.backend.repository.AbsensiRepository;
import com.shadcn.backend.repository.LaporanTukinRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
@Order(103) // Run before September seeders
public class DeleteSeptember2025DataSeeder implements CommandLineRunner {

    private final AbsensiRepository absensiRepository;
    private final LaporanTukinRepository laporanTukinRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("🗑️ Starting deletion of September 2025 data...");
        
        // Define September 2025 date range
        LocalDate septemberStart = LocalDate.of(2025, 9, 1);
        LocalDate septemberEnd = LocalDate.of(2025, 9, 30);
        
        // Delete absensi records for September 2025
        log.info("📅 Deleting absensi records for September 2025...");
        long deletedAbsensi = absensiRepository.deleteByTanggalBetween(septemberStart, septemberEnd);
        log.info("✅ Deleted {} absensi records", deletedAbsensi);
        
        // Delete laporan_tukin records for September 2025
        log.info("📊 Deleting laporan_tukin records for September 2025...");
        long deletedLaporan = laporanTukinRepository.deleteByBulanAndTahun(9, 2025);
        log.info("✅ Deleted {} laporan_tukin records", deletedLaporan);
        
        log.info("🎯 September 2025 data deletion completed!");
    }
}