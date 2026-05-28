package com.shadcn.backend.seeder;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
// import org.springframework.stereotype.Component;

/**
 * DISABLED: Seeder ini sudah tidak diperlukan karena masalah corrupt time data sudah teratasi
 * Dinonaktifkan untuk mencegah perubahan data yang tidak diinginkan
 * 
 * Untuk mengaktifkan kembali, uncomment @Component annotation dan restore implementation dari git history
 */
// @Component
@Slf4j
@Order(1) // Run first to fix corrupt data
public class FixCorruptTimeDataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        log.info("🔧 FixCorruptTimeDataSeeder is DISABLED - skipping execution");
        log.info("ℹ️ Corrupt time data fix sudah tidak diperlukan lagi");
        log.info("ℹ️ Jika perlu mengaktifkan kembali, uncomment @Component annotation");
        
        // DISABLED - Implementation removed to prevent accidental data modification
        // Original implementation available in git history if needed
    }
}
