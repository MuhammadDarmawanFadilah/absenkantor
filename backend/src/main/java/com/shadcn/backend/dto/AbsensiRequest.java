package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbsensiRequest {
    
    @NotNull(message = "Pegawai ID tidak boleh kosong")
    private Long pegawaiId;
    
    @NotBlank(message = "Type absensi tidak boleh kosong")
    private String type; // "masuk" or "pulang"
    
    @NotNull(message = "Shift ID tidak boleh kosong")
    private Long shiftId;
    
    @NotNull(message = "Latitude tidak boleh kosong")
    private Double latitude;
    
    @NotNull(message = "Longitude tidak boleh kosong")
    private Double longitude;
    
    private String photoBase64;
    private String keterangan;
}
