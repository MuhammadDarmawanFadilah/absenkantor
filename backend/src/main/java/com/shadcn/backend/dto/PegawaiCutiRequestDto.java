package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class PegawaiCutiRequestDto {
    
    @NotNull(message = "Pegawai ID tidak boleh kosong")
    private Long pegawaiId;
    
    @NotNull(message = "Jenis cuti ID tidak boleh kosong")
    private Long jenisCutiId;
    
    @NotNull(message = "Jatah hari tidak boleh kosong")
    @Min(value = 0, message = "Jatah hari tidak boleh negatif")
    private Integer jatahHari;
    
    @NotNull(message = "Tahun tidak boleh kosong")
    private Integer tahun;
}
