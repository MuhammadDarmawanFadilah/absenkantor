package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cuti")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cuti {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pegawai_id", nullable = false)
    private Pegawai pegawai;
    
    @Column(name = "tanggal_cuti", nullable = false)
    private LocalDate tanggalCuti;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jenis_cuti_id", nullable = true)
    private JenisCuti jenisCuti;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipe_cuti", nullable = false)
    @Builder.Default
    private TipeCuti tipeCuti = TipeCuti.CUTI;
    
    @Column(name = "alasan_cuti", columnDefinition = "TEXT")
    private String alasanCuti;
    
    @Column(name = "lampiran_cuti")
    private String lampiranCuti; // file path for attachment
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status_approval", nullable = false)
    @Builder.Default
    private StatusApproval statusApproval = StatusApproval.PENDING;
    
    @Column(name = "catatan_approval", columnDefinition = "TEXT")
    private String catatanApproval;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Pegawai approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum StatusApproval {
        PENDING,
        DIAJUKAN,
        DISETUJUI,
        DITOLAK
    }
    
    public enum TipeCuti {
        CUTI,
        SAKIT
    }
}
