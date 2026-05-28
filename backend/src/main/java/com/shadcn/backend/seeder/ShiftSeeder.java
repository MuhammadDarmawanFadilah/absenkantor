package com.shadcn.backend.seeder;

import com.shadcn.backend.entity.Shift;
import com.shadcn.backend.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(5) // Run after LokasiKantorSeeder
public class ShiftSeeder implements CommandLineRunner {

    private final ShiftRepository shiftRepository;

    @Value("${app.seeder.shift.enabled:false}")
    private boolean shiftSeederEnabled;

    @Override
    public void run(String... args) throws Exception {
        if (!shiftSeederEnabled) {
            log.info("Shift seeder is disabled. Skipping shift seeding.");
            return;
        }

        log.info("⏰ Starting Shift seeding...");
        
        seedShift("WFO", "08:00", "17:00", "Work From Office - Bekerja dari kantor", "HARUS_DI_KANTOR");
        seedShift("WFH", "08:00", "17:00", "Work From Home - Bekerja dari rumah", "DIMANA_SAJA");
        seedShift("Dinas", "08:00", "17:00", "Tugas Dinas - Bekerja di lokasi tugas dinas", "DIMANA_SAJA");
        
        log.info("✅ Shift seeding completed.");
    }

    private void seedShift(String namaShift, String jamMasuk, String jamKeluar, String deskripsi, String lockLokasi) {
        if (!shiftRepository.existsByNamaShiftIgnoreCase(namaShift)) {
            Shift shift = Shift.builder()
                .namaShift(namaShift)
                .jamMasuk(jamMasuk)
                .jamKeluar(jamKeluar)
                .deskripsi(deskripsi)
                .lockLokasi(lockLokasi)
                .isActive(true)
                .build();
            
            shiftRepository.save(shift);
            log.info("Created shift: {} ({} - {})", namaShift, jamMasuk, jamKeluar);
        } else {
            log.info("Shift {} already exists. Skipping.", namaShift);
        }
    }
}
