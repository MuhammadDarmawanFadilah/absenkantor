package com.shadcn.backend.seeder;

import com.shadcn.backend.model.Role;
import com.shadcn.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(3) // Run after UserDataSeeder and AdminUserSeeder
public class RoleSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Value("${app.seeder.role.enabled:false}")
    private boolean roleSeederEnabled;

    @Override
    public void run(String... args) throws Exception {
        if (!roleSeederEnabled) {
            log.info("Role seeder is disabled. Skipping role seeding.");
            return;
        }

        log.info("🔐 Starting Role seeding...");
        
        seedRole("ADMIN", "Administrator dengan akses penuh");
        seedRole("PEGAWAI", "Pegawai dengan akses terbatas");
        seedRole("VERIFICATOR", "Verificator dengan akses tertentu");
        
        log.info("✅ Role seeding completed.");
    }

    private void seedRole(String roleName, String description) {
        if (roleRepository.findAll().stream().noneMatch(r -> r.getRoleName().equals(roleName))) {
            Role role = new Role();
            role.setRoleName(roleName);
            role.setDescription(description);
            roleRepository.save(role);
            log.info("Created role: {}", roleName);
        } else {
            log.info("Role {} already exists. Skipping.", roleName);
        }
    }
}
