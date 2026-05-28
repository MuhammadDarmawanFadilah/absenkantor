package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hari_libur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HariLibur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nama_libur", nullable = false)
    private String namaLibur;
    
    @Column(name = "tanggal_libur", nullable = false)
    private LocalDate tanggalLibur;
    
    @Column(name = "bulan_libur", nullable = false)
    private Integer bulanLibur;
    
    @Column(name = "tahun_libur", nullable = false)
    private Integer tahunLibur;
    
    @Column(name = "is_nasional")
    @Builder.Default
    private Boolean isNasional = false;
    
    @Column(name = "keterangan")
    private String keterangan;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.isNasional == null) {
            this.isNasional = false;
        }
        if (this.tanggalLibur != null) {
            this.bulanLibur = this.tanggalLibur.getMonthValue();
            this.tahunLibur = this.tanggalLibur.getYear();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.tanggalLibur != null) {
            this.bulanLibur = this.tanggalLibur.getMonthValue();
            this.tahunLibur = this.tanggalLibur.getYear();
        }
    }
}
