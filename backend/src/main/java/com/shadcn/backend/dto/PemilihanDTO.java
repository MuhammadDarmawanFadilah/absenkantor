package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PemilihanDTO {
    private Long pemilihanId;
    private String judulPemilihan;
    private String deskripsi;
    private Integer tahun;
    private LocalDateTime tanggalMulai;
    private LocalDateTime tanggalSelesai;
    private LocalDateTime tanggalAktif;
    private LocalDateTime tanggalBerakhir;
    private String tingkatPemilihan;
    private String status;
    private String provinsi;
    private String provinsiNama;
    private String kota;
    private String kotaNama;
    private String kecamatan;
    private String kecamatanNama;
    private String kelurahan;
    private String kelurahanNama;
    private String rt;
    private String rw;
    private Double latitude;
    private Double longitude;
    private String alamatLokasi;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Detail pemilihan dengan laporan terpilih
    private List<DetailPemilihanDTO> detailLaporan;
    
    // Data tambahan untuk frontend
    private Integer totalLaporan;
    private Integer totalPegawai;
    private Integer totalJenisLaporan;
    private Integer totalTahapan;
    private String alamatLengkap;
    private String wilayahTingkat; // Nama wilayah berdasarkan tingkat pemilihan
    
    // Alias getters for frontend compatibility
    public LocalDateTime getTanggalAktif() {
        return this.tanggalMulai;
    }
    
    public LocalDateTime getTanggalBerakhir() {
        return this.tanggalSelesai;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailPemilihanDTO {
        private Long detailPemilihanId;
        private Long laporanId;
        private String laporanJudul;
        private String namaCandidat;
        private String partai;
        private String fotoPath;
        private Integer urutanTampil;
        private Integer posisiLayout;
        private String keterangan;
        
        // Informasi laporan
        private String jenisLaporan;
        private String status;
    }
}
