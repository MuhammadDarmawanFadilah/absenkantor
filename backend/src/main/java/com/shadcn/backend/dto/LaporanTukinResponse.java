package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaporanTukinResponse {
    
    private Long id;
    private String judul;
    private Integer bulan;
    private Integer tahun;
    private String tanggalMulai;
    private String tanggalAkhir;
    private String formatLaporan;
    private String status;
    private String filePath;
    private LocalDateTime tanggalGenerate;
    private String generatedBy;
    
    // Summary data
    private Integer totalPegawai;
    private BigDecimal totalTunjanganKinerja;
    private BigDecimal totalPotonganAbsen;
    private BigDecimal totalPemotongan;
    private BigDecimal totalTunjanganBersih;
    
    // Detail data
    private List<DetailPegawaiTukin> detailPegawai;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailPegawaiTukin {
        private Long pegawaiId;
        private String nip;
        private String namaLengkap;
        private String jabatan;
        private String lokasi;
        
        // Tunjangan Kinerja
        private Long tunjanganKinerja;
        
        // Perhitungan Absen
        private Map<String, Object> statistikAbsen;
        private BigDecimal potonganAbsen;
        private String detailPotonganAbsen;
        
        // Pemotongan Lain
        private BigDecimal pemotonganLain;
        private String detailPemotonganLain;
        
        // Total
        private BigDecimal totalPotongan;
        private BigDecimal tunjanganBersih;
        
        // Deduction Cap Status (for bold styling when 100% cap with 60% factor reached)
        private Boolean isAttendanceCapped;
        private Boolean isOtherDeductionsCapped; 
        private Boolean isTotalCapped;
        
        // Maximum possible deduction (60% of tunjangan kinerja)
        private BigDecimal maxPossibleDeduction;
        
        // Enhanced Detail - Attendance History & Deduction Breakdown
        private List<HistoriAbsensi> historiAbsensi;
        private List<DetailPemotonganAbsen> detailPemotonganAbsenList;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoriAbsensi {
        private String tanggal;
        private String hari;
        private String jamMasuk;
        private String jamPulang;
        private String statusMasuk;
        private String statusPulang;
        private Integer menitTerlambat;
        private Integer menitPulangCepat;
        private String keterangan;
        private Boolean hasPemotongan;
        
        // Shift information for determining work location status
        private String namaShift;
        private String lockLokasi; // "DIMANA_SAJA", "KANTOR", etc.
        
        // Enhanced fields for daily deduction details
        private BigDecimal nominalPemotongan;
        private BigDecimal persentasePemotongan;
        private String detailPemotongan;
        private String status; // Combined status for display
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailPemotonganAbsen {
        private String kodePemotongan;
        private String namaPemotongan;
        private String deskripsiPemotongan;
        private BigDecimal persentasePemotongan;
        private Integer jumlahKejadian;
        private BigDecimal nominalPemotongan;
        private String detailKejadian; // e.g., "Tanggal: 2025-08-01, 2025-08-03"
        private List<String> tanggalKejadian;
    }
}
