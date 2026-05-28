package com.shadcn.backend.seeder;

import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserSeeder implements CommandLineRunner {

    private final PegawaiRepository pegawaiRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
    }

    private void seedAdminUser() {
        try {
            log.info("Starting admin user seeder...");

            // Check if admin user already exists
            Optional<Pegawai> existingAdmin = pegawaiRepository.findByUsername("admin");
            
            if (existingAdmin.isPresent()) {
                Pegawai admin = existingAdmin.get();
                log.info("Admin user already exists with ID: {}", admin.getId());
                
                // Update admin user to ensure it has correct admin role and active status
                admin.setIsAdmin("1"); // Set as admin
                admin.setRole("ADMIN"); // Make sure role is ADMIN
                admin.setIsActive(true);
                
                // Update password if needed (uncomment if you want to reset password)
                admin.setPassword(passwordEncoder.encode("admin123"));
                
                pegawaiRepository.save(admin);
                log.info("Admin user updated successfully - Role: {}, IsAdmin: {}", admin.getRole(), admin.getIsAdmin());
                return;
            }

            // Create new admin user
            Pegawai adminUser = Pegawai.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .namaLengkap("Administrator")
                    .email("admin@absenlampung.com")
                    .noTelp("081234567890")
                    .role("ADMIN")
                    .isAdmin("1") // Set as admin
                    .isActive(true)
                    .nip("ADM001")
                    .jenisKelamin("L")
                    .statusNikah("Single")
                    .alamat("Kantor Pusat")
                    .tanggalMasuk(LocalDateTime.now().toString())
                    .tanggalLahir("1990-01-01")
                    .tempatLahir("Jakarta")
                    .pendidikan("S1")
                    .gajiPokok(10000000)
                    .tunjanganKinerja(5000000L)
                    .izinCuti(12)
                    .izinLainnya(0)
                    .izinTelat(0)
                    .izinPulangCepat(0)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            pegawaiRepository.save(adminUser);
            
            log.info("=== ADMIN USER CREATED SUCCESSFULLY ===");
            log.info("Username: admin");
            log.info("Password: admin123");
            log.info("Role: ADMIN");
            log.info("NIP: ADM001");
            log.info("Email: admin@absenlampung.com");
            log.info("Status: ACTIVE");
            log.info("========================================");

        } catch (Exception e) {
            log.error("Error creating admin user", e);
        }
    }
}
