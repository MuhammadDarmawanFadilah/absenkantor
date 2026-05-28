package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@Entity
@Table(name = "lokasi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lokasi {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nama_lokasi", nullable = false, unique = true)
    @NotBlank(message = "Nama lokasi tidak boleh kosong")
    private String namaLokasi;
    
    @Column(columnDefinition = "TEXT")
    private String alamat;
    
    @Column(name = "lat_kantor")
    private String latitude;
    
    @Column(name = "long_kantor")
    private String longitude;
    
    @Column(name = "radius")
    private String radius;
    
    @Column(name = "status")
    private String status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Pegawai createdBy;
    
    @Column(name = "is_active", nullable = false)
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
        if (this.status == null) {
            this.status = "aktif";
        }
        if (this.radius == null) {
            this.radius = "100"; // Default radius 100 meters
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
