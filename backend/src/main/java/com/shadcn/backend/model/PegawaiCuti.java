package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "pegawai_cuti", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"pegawai_id", "jenis_cuti_id", "tahun"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PegawaiCuti {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pegawai_id", nullable = false)
    private Pegawai pegawai;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jenis_cuti_id", nullable = false)
    private JenisCuti jenisCuti;
    
    @Column(name = "jatah_hari", nullable = false)
    private Integer jatahHari;
    
    @Column(name = "tahun", nullable = false)
    private Integer tahun;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
