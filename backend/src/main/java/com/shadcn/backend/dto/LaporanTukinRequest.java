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
public class LaporanTukinRequest {
    
    @NotNull(message = "Bulan tidak boleh kosong")
    @Min(value = 1, message = "Bulan harus antara 1-12")
    @Max(value = 12, message = "Bulan harus antara 1-12")
    private Integer bulan;
    
    @NotNull(message = "Tahun tidak boleh kosong")
    @Min(value = 2020, message = "Tahun minimal 2020")
    private Integer tahun;
    
    private String tanggalMulai; // Format: yyyy-MM-dd
    
    private String tanggalAkhir;  // Format: yyyy-MM-dd
    
    @NotBlank(message = "Format laporan tidak boleh kosong")
    @Pattern(regexp = "PDF|EXCEL|WEB", message = "Format laporan harus PDF, EXCEL, atau WEB")
    private String formatLaporan;
    
    private Long pegawaiId; // For personal reports
}
