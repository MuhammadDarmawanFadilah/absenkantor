package com.shadcn.backend.seeder;

import com.shadcn.backend.model.Lokasi;
import com.shadcn.backend.repository.LokasiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(4) // Run after RoleSeeder
public class LokasiKantorSeeder implements CommandLineRunner {

    private final LokasiRepository lokasiRepository;

    @Value("${app.seeder.lokasi-kantor.enabled:false}")
    private boolean lokasiKantorSeederEnabled;

    @Override
    public void run(String... args) throws Exception {
        if (!lokasiKantorSeederEnabled) {
            log.info("Lokasi Kantor seeder is disabled. Skipping seeding.");
            return;
        }

        log.info("🏢 Starting Lokasi Kantor seeding...");
        
        if (lokasiRepository.count() == 0) {
            Lokasi bawasluLampung = Lokasi.builder()
                .namaLokasi("Kantor Bawaslu Lampung")
                .alamat("Jl. ZA. Pagar Alam No. 26A, Gedong Meneng, Kec. Rajabasa, Kota Bandar Lampung, Lampung 35145")
                .latitude("-5.381316")
                .longitude("105.266792")
                .radius("100")
                .status("aktif")
                .isActive(true)
                .build();
            
            lokasiRepository.save(bawasluLampung);
            log.info("Created Lokasi Kantor: Kantor Bawaslu Lampung");
        } else {
            log.info("Lokasi Kantor data already exists. Skipping seeding.");
        }
        
        log.info("✅ Lokasi Kantor seeding completed.");
    }
}
