package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbsensiResponse {
    
    private Long id;
    private String tanggal; // LocalDate formatted as string
    private String waktu; // LocalTime formatted as string
    private String type; // "masuk" or "pulang"
    private String shift;
    private String shiftLockLokasi; // shift lock location info
    private String lokasi;
    private Double jarak;
    private String photoUrl;
    private String status;
    private String keterangan;
    private Double latitude;
    private Double longitude;
    private String createdAt; // LocalDateTime formatted as string
    
    // Pegawai info (for admin views)
    private Long pegawaiId;
    private String pegawaiNama;
    private String pegawaiNip;
}
