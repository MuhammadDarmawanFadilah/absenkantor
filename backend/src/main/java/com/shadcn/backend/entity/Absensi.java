package com.shadcn.backend.entity;

import com.shadcn.backend.model.Pegawai;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "absensi")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Absensi {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pegawai_id", nullable = false)
    private Pegawai pegawai;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private AbsensiType type;
    
    @Column(name = "tanggal", nullable = false)
    private LocalDate tanggal;
    
    @Column(name = "waktu", nullable = false)
    private LocalTime waktu;
    
    @Column(name = "latitude", nullable = false)
    private Double latitude;
    
    @Column(name = "longitude", nullable = false)
    private Double longitude;
    
    @Column(name = "jarak", nullable = false)
    private Double jarak; // Distance in meters
    
    @Column(name = "photo_url")
    private String photoUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AbsensiStatus status;
    
    @Column(name = "keterangan")
    private String keterangan;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum AbsensiType {
        MASUK, PULANG
    }
    
    public enum AbsensiStatus {
        HADIR, TERLAMBAT, PULANG_CEPAT, ALPHA, IZIN, SAKIT, SAKIT_TANPA_SURAT, CUTI
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        
        if (tanggal == null) {
            tanggal = LocalDate.now();
        }
        
        if (waktu == null) {
            waktu = LocalTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
