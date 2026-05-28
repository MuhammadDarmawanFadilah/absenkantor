package com.shadcn.backend.seeder;

import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Run this seeder first
public class UserDataSeeder implements CommandLineRunner {

    private final PegawaiRepository pegawaiRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (shouldSeedData()) {
            seedUsers();
        }
    }

    private boolean shouldSeedData() {
        // Only seed if there are no users in the database
        long userCount = pegawaiRepository.count();
        log.info("Current user count in database: {}", userCount);
        return userCount == 0;
    }

    private void seedUsers() {
        try {
            log.info("Starting user data seeding...");

            List<Pegawai> users = createTestUsers();
            
            for (Pegawai user : users) {
                Optional<Pegawai> existing = pegawaiRepository.findByUsername(user.getUsername());
                if (existing.isEmpty()) {
                    pegawaiRepository.save(user);
                    log.info("Created user: {} ({})", user.getUsername(), user.getRole());
                } else {
                    log.info("User already exists: {}", user.getUsername());
                }
            }

            log.info("=== USER DATA SEEDING COMPLETED ===");
            log.info("ADMIN LOGIN:");
            log.info("  Username: admin");
            log.info("  Password: admin123");
            log.info("  Role: ADMIN");
            log.info("");
            log.info("EMPLOYEE LOGIN EXAMPLES:");
            log.info("  Username: pegawai1 | Password: password123 | Role: PEGAWAI");
            log.info("  Username: pegawai2 | Password: password123 | Role: PEGAWAI");
            log.info("====================================");

        } catch (Exception e) {
            log.error("Error seeding user data", e);
        }
    }

    private List<Pegawai> createTestUsers() {
        List<Pegawai> users = new ArrayList<>();

        // 1. Admin User
        users.add(Pegawai.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .namaLengkap("Administrator System")
                .email("admin@absenlampung.com")
                .noTelp("081234567890")
                .role("ADMIN")
                .isAdmin("1") // Admin flag
                .isActive(true)
                .nip("ADM001")
                .jenisKelamin("L")
                .statusNikah("Menikah")
                .alamat("Jl. Admin No. 1, Bandar Lampung")
                .tanggalMasuk("2023-01-01")
                .tanggalLahir("1985-01-01")
                .tempatLahir("Bandar Lampung")
                .pendidikan("S1 Sistem Informasi")
                .gajiPokok(15000000)
                .tunjanganKinerja(7500000L)
                .tunjanganKeluarga(2000000)
                .tunjanganTransportasi(1000000)
                .izinCuti(12)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        // 2. Sample Employee 1
        users.add(Pegawai.builder()
                .username("pegawai1")
                .password(passwordEncoder.encode("password123"))
                .namaLengkap("Budi Santoso")
                .email("budi.santoso@absenlampung.com")
                .noTelp("081234567891")
                .role("PEGAWAI")
                .isAdmin("0") // Regular employee
                .isActive(true)
                .nip("PGW001")
                .jenisKelamin("L")
                .statusNikah("Menikah")
                .alamat("Jl. Pegawai No. 1, Bandar Lampung")
                .tanggalMasuk("2023-02-01")
                .tanggalLahir("1990-05-15")
                .tempatLahir("Lampung Timur")
                .pendidikan("S1 Akuntansi")
                .gajiPokok(8000000)
                .tunjanganKinerja(4000000L)
                .tunjanganKeluarga(1500000)
                .tunjanganTransportasi(500000)
                .izinCuti(12)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        // 3. Sample Employee 2
        users.add(Pegawai.builder()
                .username("pegawai2")
                .password(passwordEncoder.encode("password123"))
                .namaLengkap("Siti Nurhaliza")
                .email("siti.nurhaliza@absenlampung.com")
                .noTelp("081234567892")
                .role("PEGAWAI")
                .isAdmin("0") // Regular employee
                .isActive(true)
                .nip("PGW002")
                .jenisKelamin("P")
                .statusNikah("Belum Menikah")
                .alamat("Jl. Pegawai No. 2, Bandar Lampung")
                .tanggalMasuk("2023-03-01")
                .tanggalLahir("1992-08-20")
                .tempatLahir("Lampung Selatan")
                .pendidikan("S1 Manajemen")
                .gajiPokok(7500000)
                .tunjanganKinerja(3750000L)
                .tunjanganKeluarga(0) // Belum menikah
                .tunjanganTransportasi(500000)
                .izinCuti(12)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        // 4. Sample Supervisor
        users.add(Pegawai.builder()
                .username("supervisor1")
                .password(passwordEncoder.encode("supervisor123"))
                .namaLengkap("Ahmad Fauzi")
                .email("ahmad.fauzi@absenlampung.com")
                .noTelp("081234567893")
                .role("SUPERVISOR")
                .isAdmin("0") // Not admin, but supervisor
                .isActive(true)
                .nip("SPV001")
                .jenisKelamin("L")
                .statusNikah("Menikah")
                .alamat("Jl. Supervisor No. 1, Bandar Lampung")
                .tanggalMasuk("2022-06-01")
                .tanggalLahir("1988-12-10")
                .tempatLahir("Bandar Lampung")
                .pendidikan("S1 Teknik Industri")
                .gajiPokok(12000000)
                .tunjanganKinerja(6000000L)
                .tunjanganKeluarga(2000000)
                .tunjanganTransportasi(750000)
                .izinCuti(12)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        return users;
    }
}
