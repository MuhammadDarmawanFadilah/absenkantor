package com.shadcn.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SelfUpdatePegawaiRequest {
    
    @NotBlank(message = "Nama lengkap tidak boleh kosong")
    @Size(max = 100, message = "Nama lengkap maksimal 100 karakter")
    private String namaLengkap;
    
    @NotBlank(message = "Email tidak boleh kosong")
    @Email(message = "Format email tidak valid")
    private String email;
    
    @Size(max = 20, message = "Nomor telepon maksimal 20 karakter")
    private String noTelp;
    
    @Size(max = 50, message = "NIP maksimal 50 karakter")
    private String nip;
    
    // Date fields
    private String tanggalLahir;
    private String tanggalMasuk;
    private String statusNikah;
    private String jenisKelamin;
    private String rekening;
    
    // Photo URL field
    @Size(max = 500, message = "URL foto maksimal 500 karakter")
    private String photoUrl;
    
    // Location fields
    @Size(max = 500, message = "Alamat maksimal 500 karakter")
    private String alamat;
    
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
}
