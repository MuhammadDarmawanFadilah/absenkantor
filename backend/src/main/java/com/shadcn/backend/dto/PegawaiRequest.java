package com.shadcn.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PegawaiRequest {
    
    @NotBlank(message = "Username tidak boleh kosong")
    @Size(min = 3, max = 50, message = "Username harus antara 3-50 karakter")
    private String username;
    
    @Size(min = 6, message = "Password minimal 6 karakter")
    private String password; // Optional for updates
    
    @NotBlank(message = "Nama lengkap tidak boleh kosong")
    @Size(max = 100, message = "Nama lengkap maksimal 100 karakter")
    private String namaLengkap;
    
    @Size(max = 500, message = "URL foto karyawan maksimal 500 karakter")
    private String fotoKaryawan;
    
    @Size(max = 500, message = "URL foto face recognition maksimal 500 karakter")
    private String fotoFaceRecognition;
    
    @NotBlank(message = "Email tidak boleh kosong")
    @Email(message = "Format email tidak valid")
    private String email;
    
    @Size(max = 20, message = "Nomor telepon maksimal 20 karakter")
    private String noTelp;
    
    private String tanggalLahir;
    
    @Size(max = 1, message = "Jenis kelamin maksimal 1 karakter")
    @Pattern(regexp = "L|P", message = "Jenis kelamin harus L atau P")
    private String jenisKelamin;
    
    private String tanggalMasuk;
    
    @Size(max = 50, message = "Status nikah maksimal 50 karakter")
    private String statusNikah;
    
    @Size(max = 500, message = "Alamat maksimal 500 karakter")
    private String alamat;
    
    @Builder.Default
    private Integer izinCuti = 0;
    @Builder.Default
    private Integer izinLainnya = 0;
    @Builder.Default
    private Integer izinTelat = 0;
    @Builder.Default
    private Integer izinPulangCepat = 0;
    
    @Size(max = 1, message = "Is admin maksimal 1 karakter")
    @Pattern(regexp = "0|1", message = "Is admin harus 0 atau 1")
    @Builder.Default
    private String isAdmin = "0";
    
    @Size(max = 50, message = "Rekening maksimal 50 karakter")
    private String rekening;
    
    private Integer gajiPokok;
    private Integer makanTransport;
    private Integer lembur;
    private Integer kehadiran;
    private Integer thr;
    private Integer bonus;
    private Integer izin;
    private Integer terlambat;
    private Integer mangkir;
    private Integer saldoKasbon;
    private Integer potonganBpjs;
    private Integer potonganPajak;
    
    // Tunjangan fields
    private Long tunjanganKinerja;
    private Integer tunjanganTransportasi;
    
    @Size(max = 50, message = "NIP maksimal 50 karakter")
    private String nip;
    
    @Size(max = 100, message = "Pendidikan maksimal 100 karakter")
    private String pendidikan;
    
    @Size(max = 100, message = "Tempat lahir maksimal 100 karakter")
    private String tempatLahir;
    
    @NotBlank(message = "Role tidak boleh kosong")
    @Size(max = 100, message = "Role maksimal 100 karakter")
    private String role;
    
    @NotNull(message = "Jabatan ID tidak boleh kosong")
    private Long jabatanId;
    
    @NotNull(message = "Lokasi ID tidak boleh kosong")
    private Long lokasiId;
    
    @Builder.Default
    private Boolean isActive = true;
    
    // Location fields (optional)
    @Size(max = 100, message = "Provinsi maksimal 100 karakter")
    private String provinsi;
    
    @Size(max = 100, message = "Kota maksimal 100 karakter")
    private String kota;
    
    @Size(max = 100, message = "Kecamatan maksimal 100 karakter")
    private String kecamatan;
    
    @Size(max = 100, message = "Kelurahan maksimal 100 karakter")
    private String kelurahan;
    
    @Size(max = 10, message = "Kode pos maksimal 10 karakter")
    private String kodePos;
    
    private Double latitude;
    private Double longitude;
    
    // Photo URL field
    @Size(max = 500, message = "URL foto maksimal 500 karakter")
    private String photoUrl;
    
    // Pemilihan assignment
    private List<Long> selectedPemilihanIds;
    
    // Note: totalTps is automatically calculated based on selectedPemilihanIds
}
