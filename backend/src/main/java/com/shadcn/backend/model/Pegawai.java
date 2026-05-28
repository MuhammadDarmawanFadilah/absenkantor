package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "pegawai")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pegawai implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @JsonIgnore
    @Column(nullable = false)
    private String password;
    
    @Column(name = "name", nullable = false)
    private String namaLengkap;
    
    @Column(name = "foto_karyawan")
    private String fotoKaryawan;
    
    @Column(name = "foto_face_recognition")
    private String fotoFaceRecognition;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "telepon")
    private String noTelp;
    
    @Column(name = "tgl_lahir")
    private String tanggalLahir;
    
    @Column(name = "gender")
    private String jenisKelamin;
    
    @Column(name = "tgl_join")
    private String tanggalMasuk;
    
    @Column(name = "status_nikah")
    private String statusNikah;
    
    @Column(name = "alamat", columnDefinition = "TEXT")
    private String alamat;
    
    @Column(name = "izin_cuti")
    @Builder.Default
    private Integer izinCuti = 12;
    
    @Column(name = "izin_lainnya")
    @Builder.Default
    private Integer izinLainnya = 0;

    @Column(name = "izin_telat")
    @Builder.Default
    private Integer izinTelat = 0;

    @Column(name = "izin_pulang_cepat")
    @Builder.Default
    private Integer izinPulangCepat = 0;

    @Column(name = "is_admin")
    @Builder.Default
    private String isAdmin = "0";
    
    @Column(name = "rekening")
    private String rekening;
    
    @Column(name = "gaji_pokok")
    private Integer gajiPokok;
    
    @Column(name = "makan_transport")
    private Integer makanTransport;
    
    @Column(name = "lembur")
    private Integer lembur;
    
    @Column(name = "kehadiran")
    private Integer kehadiran;
    
    @Column(name = "thr")
    private Integer thr;
    
    @Column(name = "bonus")
    private Integer bonus;
    
    // Tunjangan fields
    @Column(name = "tunjangan_keluarga")
    private Integer tunjanganKeluarga;
    
    @Column(name = "tunjangan_kinerja")
    private Long tunjanganKinerja;
    
    @Column(name = "tunjangan_transportasi")
    private Integer tunjanganTransportasi;
    
    @Column(name = "izin")
    private Integer izin;
    
    @Column(name = "terlambat")
    private Integer terlambat;
    
    @Column(name = "mangkir")
    private Integer mangkir;
    
    @Column(name = "saldo_kasbon")
    private Integer saldoKasbon;
    
    // BPJS and Tax deductions
    @Column(name = "potongan_bpjs")
    private Integer potonganBpjs;
    
    @Column(name = "potongan_pajak")
    private Integer potonganPajak;
    
    // NIP is additional field for employee identification
    @Column(name = "nip", unique = true)
    private String nip;
    
    // Education field
    @Column(name = "pendidikan")
    private String pendidikan;
    
    // Birth place field
    @Column(name = "tempat_lahir")
    private String tempatLahir;
    
    @Column(nullable = false)
    private String role;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jabatan_id")
    private Jabatan jabatan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lokasi_id")  
    private Lokasi lokasi;
    
    // Remove shift relationship as it's handled via MappingShift
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "shift_id")
    // private Shift shift;
    
    // Convenience fields for backward compatibility and API responses
    @Transient
    private String namaJabatan;
    
    @Transient
    private String namaLokasi;
    
    @PostLoad
    private void populateTransientFields() {
        if (jabatan != null) {
            this.namaJabatan = jabatan.getNama();
        }
        if (lokasi != null) {
            this.namaLokasi = lokasi.getNamaLokasi();
        }
    }
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    // Location fields - remove as alamat is already defined above
    private String provinsi;
    private String kota;
    private String kecamatan;
    private String kelurahan;
    
    @Column(name = "kode_pos")
    private String kodePos;
    
    private Double latitude;
    private Double longitude;
    
    // Photo field - use fotoKaryawan instead
    @Column(name = "photo_url")
    private String photoUrl;
    
    // TPS related fields
    @Column(name = "total_tps")
    private Integer totalTps;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Use the actual role field instead of hardcoded PEGAWAI
        String actualRole = this.role != null ? this.role : "PEGAWAI";
        return List.of(new SimpleGrantedAuthority("ROLE_" + actualRole));
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public String getUsername() {
        return username;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return isActive != null && isActive;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return isActive != null && isActive;
    }
    
    // Helper methods
    public Integer getTotalPemilihan() {
        return totalTps != null ? totalTps : 0;
    }
    
    public void clearPemilihan() {
        this.totalTps = 0;
    }
}
