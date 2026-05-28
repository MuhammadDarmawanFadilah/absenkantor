package com.shadcn.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nama_shift", nullable = false)
    private String namaShift;
    
    @Column(name = "jam_masuk", nullable = false)
    private String jamMasuk;
    
    @Column(name = "jam_keluar", nullable = false)
    private String jamKeluar;
    
    @Column(name = "deskripsi")
    private String deskripsi;
    
    @Column(name = "lock_lokasi", nullable = false)
    @Builder.Default
    private String lockLokasi = "DIMANA_SAJA";
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
