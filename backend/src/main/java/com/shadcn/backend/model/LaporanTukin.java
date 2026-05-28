package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "laporan_tukin")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class LaporanTukin {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "judul", nullable = false, length = 200)
    private String judul;
    
    @Column(name = "bulan", nullable = false)
    private Integer bulan;
    
    @Column(name = "tahun", nullable = false)
    private Integer tahun;
    
    @Column(name = "tanggal_mulai", nullable = false)
    private LocalDate tanggalMulai;
    
    @Column(name = "tanggal_akhir", nullable = false)
    private LocalDate tanggalAkhir;
    
    // Legacy columns for backward compatibility
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date", nullable = false) 
    private LocalDate endDate;
    
    @Column(name = "total_tukin", nullable = false)
    private BigDecimal totalTukin;
    
    @Column(name = "jenis_laporan", nullable = false)
    private String jenisLaporan;
    
    @Column(name = "judul_laporan", nullable = false)
    private String judulLaporan;
    
    @Column(name = "periode", nullable = false)
    private String periode;
    
    @Column(name = "status_laporan", nullable = false)
    private String statusLaporan;
    
    @Column(name = "format_laporan", nullable = false, length = 10)
    private String formatLaporan;
    
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "GENERATED";
    
    @Column(name = "file_path", length = 500)
    private String filePath;
    
    @Column(name = "total_pegawai")
    private Integer totalPegawai;
    
    @Column(name = "total_tunjangan_kinerja", precision = 15, scale = 2)
    private BigDecimal totalTunjanganKinerja;
    
    @Column(name = "total_potongan_absen", precision = 15, scale = 2)
    private BigDecimal totalPotonganAbsen;
    
    @Column(name = "total_pemotongan", precision = 15, scale = 2)
    private BigDecimal totalPemotongan;
    
    @Column(name = "total_tunjangan_bersih", precision = 15, scale = 2)
    private BigDecimal totalTunjanganBersih;
    
    @Column(name = "is_personal_report", nullable = false)
    @Builder.Default
    private Boolean isPersonalReport = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by", nullable = false)
    private Pegawai generatedBy;
    
    @CreatedDate
    @Column(name = "tanggal_generate", nullable = false, updatable = false)
    private LocalDateTime tanggalGenerate;
    
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
