package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LaporanWizardDto {
    
    @NotBlank(message = "Nama laporan tidak boleh kosong")
    @Size(max = 200, message = "Nama laporan maksimal 200 karakter")
    private String namaLaporan;
    
    private String deskripsi;
    
    private String status; // Status laporan: AKTIF, TIDAK_AKTIF, DRAFT
    
    @NotEmpty(message = "Minimal satu jenis laporan harus dipilih")
    private List<Long> jenisLaporanIds;
    
    private Long userId;
}
