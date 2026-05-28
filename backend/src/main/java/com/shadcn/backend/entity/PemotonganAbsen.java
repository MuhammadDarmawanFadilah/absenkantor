package com.shadcn.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pemotongan_absen")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PemotonganAbsen {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Kode tidak boleh kosong")
    @Size(max = 10, message = "Kode maksimal 10 karakter")
    @Column(unique = true, nullable = false, length = 10)
    private String kode;
    
    @NotBlank(message = "Nama tidak boleh kosong")
    @Size(max = 100, message = "Nama maksimal 100 karakter")
    @Column(nullable = false, length = 100)
    private String nama;
    
    @NotBlank(message = "Deskripsi tidak boleh kosong")
    @Size(max = 200, message = "Deskripsi maksimal 200 karakter")
    @Column(nullable = false, length = 200)
    private String deskripsi;
    
    @NotNull(message = "Persentase tidak boleh kosong")
    @DecimalMin(value = "0.0", message = "Persentase minimal 0%")
    @DecimalMax(value = "100.0", message = "Persentase maksimal 100%")
    @Digits(integer = 3, fraction = 2, message = "Format persentase tidak valid")
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal persentase;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
