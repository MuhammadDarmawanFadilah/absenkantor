package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "pemotongan")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Pemotongan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pegawai_id", nullable = false)
    private Pegawai pegawai;
    
    @Column(name = "bulan_pemotongan", nullable = false)
    private Integer bulanPemotongan;
    
    @Column(name = "tahun_pemotongan", nullable = false)
    private Integer tahunPemotongan;
    
    @Column(name = "persentase_pemotongan", nullable = false, precision = 5, scale = 2)
    private BigDecimal persentasePemotongan;
    
    @Column(name = "alasan_pemotongan", nullable = false, length = 500)
    private String alasanPemotongan;
    
    @Column(name = "nominal_pemotongan", precision = 15, scale = 2)
    private BigDecimal nominalPemotongan;
    
    @Column(name = "tunjangan_kinerja", precision = 15, scale = 2)
    private BigDecimal tunjanganKinerja;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    @PreUpdate
    private void calculateValues() {
        // Auto-calculate nominal pemotongan if tunjangan kinerja is available
        if (this.tunjanganKinerja != null && this.persentasePemotongan != null) {
            this.nominalPemotongan = this.tunjanganKinerja
                .multiply(this.persentasePemotongan)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
    }
}
