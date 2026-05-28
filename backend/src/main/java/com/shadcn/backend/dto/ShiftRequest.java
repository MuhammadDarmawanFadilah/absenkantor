package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRequest {
    
    @NotBlank(message = "Nama shift tidak boleh kosong")
    private String namaShift;
    
    @NotBlank(message = "Jam masuk tidak boleh kosong")
    private String jamMasuk;
    
    @NotBlank(message = "Jam keluar tidak boleh kosong")
    private String jamKeluar;
    
    private String deskripsi;
    
    @NotNull(message = "Lock lokasi tidak boleh kosong")
    private String lockLokasi;
    
    private Boolean isActive = true;
}
