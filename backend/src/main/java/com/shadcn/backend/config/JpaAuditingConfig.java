package com.shadcn.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
    // JPA Auditing configuration untuk automatic timestamp management
    // Ini akan mengaktifkan @CreatedDate dan @LastModifiedDate annotations
}
