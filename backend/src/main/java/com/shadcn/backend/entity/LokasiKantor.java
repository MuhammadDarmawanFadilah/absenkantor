package com.shadcn.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "lokasi_kantor")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LokasiKantor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String namaLokasi;
    
    @Column(length = 500)
    private String alamat;
    
    private Double latitude;
    
    private Double longitude;
    
    private String kota;
    
    private String provinsi;
    
    @Column(length = 255)
    private String deskripsi;
}
