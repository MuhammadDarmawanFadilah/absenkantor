package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.shadcn.backend.model.Pegawai;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PegawaiResponse {
    
    private Long id;
    private String username;
    private String namaLengkap;
    private String fullName; // Alias for frontend compatibility
    private String fotoKaryawan;
    private String fotoFaceRecognition;
    private String email;
    private String noTelp;
    private String phoneNumber; // Alias for frontend compatibility
    private String tanggalLahir;
    private String jenisKelamin;
    private String tanggalMasuk;
    private String statusNikah;
    private String alamat;
    private Integer izinCuti;
    private Integer izinLainnya;
    private Integer izinTelat;
    private Integer izinPulangCepat;
    private String isAdmin;
    private String rekening;
    private Integer gajiPokok;
    private Integer makanTransport;
    private Integer lembur;
    private Integer kehadiran;
    private Integer thr;
    private Integer bonus;
    private Long tunjanganKinerja;
    private Integer tunjanganTransportasi;
    private Integer izin;
    private Integer terlambat;
    private Integer mangkir;
    private Integer saldoKasbon;
    private Integer potonganBpjs;
    private Integer potonganPajak;
    private String nip;
    private String pendidikan;
    private String tempatLahir;
    private String role;
    private JabatanResponse jabatan;
    private LokasiResponse lokasi;
    private Boolean isActive;
    private String status; // Alias for frontend compatibility
    
    // Location information
    private String provinsi;
    private String provinsiNama;
    private String kota;
    private String kotaNama;
    private String kecamatan;
    private String kecamatanNama;
    private String kelurahan;
    private String kelurahanNama;
    private String kodePos;
    private Double latitude;
    private Double longitude;
    
    // Photo URL
    private String photoUrl;
    
    // TPS and Pemilihan information
    private Integer totalTps;
    private Integer totalPemilihan;
    private List<PemilihanSummary> pemilihanList;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PemilihanSummary {
        private Long id;
        private String judulPemilihan;
        private String deskripsi;
        private String status;
        private String tingkatPemilihan;
        private Integer totalLaporan;
        private Integer totalJenisLaporan;
        private String provinsiNama;
        private String kotaNama;
        private String kecamatanNama;
        private String kelurahanNama;
        private LocalDateTime createdAt;
    }
    
    // Constructor from Pegawai entity
    public PegawaiResponse(Pegawai pegawai) {
        this.id = pegawai.getId();
        this.username = pegawai.getUsername();
        this.namaLengkap = pegawai.getNamaLengkap();
        this.fullName = pegawai.getNamaLengkap(); // Set fullName for frontend compatibility
        // Use photoUrl as primary, fallback to fotoKaryawan for backward compatibility
        String finalPhotoUrl = pegawai.getPhotoUrl() != null ? pegawai.getPhotoUrl() : pegawai.getFotoKaryawan();
        this.fotoKaryawan = finalPhotoUrl;
        this.fotoFaceRecognition = pegawai.getFotoFaceRecognition();
        
        // Debug logging for photo field sync
        if (pegawai.getId() != null && pegawai.getId() == 4L) {
            System.out.println("DEBUG: Pegawai ID 4 photo fields - photoUrl: " + pegawai.getPhotoUrl() + ", fotoKaryawan: " + pegawai.getFotoKaryawan() + ", final: " + finalPhotoUrl);
        }
        this.email = pegawai.getEmail();
        this.noTelp = pegawai.getNoTelp();
        this.phoneNumber = pegawai.getNoTelp(); // Set phoneNumber for frontend compatibility
        this.tanggalLahir = pegawai.getTanggalLahir();
        this.jenisKelamin = pegawai.getJenisKelamin();
        this.tanggalMasuk = pegawai.getTanggalMasuk();
        this.statusNikah = pegawai.getStatusNikah();
        this.alamat = pegawai.getAlamat();
        this.izinCuti = pegawai.getIzinCuti();
        this.izinLainnya = pegawai.getIzinLainnya();
        this.izinTelat = pegawai.getIzinTelat();
        this.izinPulangCepat = pegawai.getIzinPulangCepat();
        this.isAdmin = pegawai.getIsAdmin();
        this.rekening = pegawai.getRekening();
        this.gajiPokok = pegawai.getGajiPokok();
        this.makanTransport = pegawai.getMakanTransport();
        this.lembur = pegawai.getLembur();
        this.kehadiran = pegawai.getKehadiran();
        this.thr = pegawai.getThr();
        this.bonus = pegawai.getBonus();
        this.tunjanganKinerja = pegawai.getTunjanganKinerja();
        this.tunjanganTransportasi = pegawai.getTunjanganTransportasi();
        this.izin = pegawai.getIzin();
        this.terlambat = pegawai.getTerlambat();
        this.mangkir = pegawai.getMangkir();
        this.saldoKasbon = pegawai.getSaldoKasbon();
        this.potonganBpjs = pegawai.getPotonganBpjs();
        this.potonganPajak = pegawai.getPotonganPajak();
        this.nip = pegawai.getNip();
        this.pendidikan = pegawai.getPendidikan();
        this.tempatLahir = pegawai.getTempatLahir();
        this.role = pegawai.getRole();
        this.jabatan = pegawai.getJabatan() != null ? new JabatanResponse(pegawai.getJabatan()) : null;
        this.lokasi = pegawai.getLokasi() != null ? new LokasiResponse(pegawai.getLokasi()) : null;
        this.isActive = pegawai.getIsActive();
        this.status = pegawai.getIsActive() != null && pegawai.getIsActive() ? "AKTIF" : "TIDAK_AKTIF";
        
        this.provinsi = pegawai.getProvinsi();
        this.kota = pegawai.getKota();
        this.kecamatan = pegawai.getKecamatan();
        this.kelurahan = pegawai.getKelurahan();
        this.kodePos = pegawai.getKodePos();
        this.latitude = pegawai.getLatitude();
        this.longitude = pegawai.getLongitude();
        
        this.photoUrl = pegawai.getPhotoUrl();
        
        this.totalTps = pegawai.getTotalTps();
        this.totalPemilihan = pegawai.getTotalPemilihan();
        
        // Pemilihan functionality removed - set empty list
        this.pemilihanList = new ArrayList<>();
        
        this.createdAt = pegawai.getCreatedAt();
        this.updatedAt = pegawai.getUpdatedAt();
    }
    
    // Static factory method
    public static PegawaiResponse from(Pegawai pegawai) {
        return new PegawaiResponse(pegawai);
    }
    
    // Convert to Map for simple responses
    public Map<String, Object> toMap() {
        return Map.of(
            "id", this.id,
            "username", this.username,
            "namaLengkap", this.namaLengkap,
            "email", this.email,
            "noTelp", this.noTelp != null ? this.noTelp : "",
            "jabatan", this.jabatan != null ? this.jabatan.getNama() : "",
            "isActive", this.isActive,
            "totalTps", this.totalTps != null ? this.totalTps : 0,
            "totalPemilihan", this.totalPemilihan != null ? this.totalPemilihan : 0,
            "createdAt", this.createdAt
        );
    }
}
