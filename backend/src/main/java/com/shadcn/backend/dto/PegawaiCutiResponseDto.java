package com.shadcn.backend.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class PegawaiCutiResponseDto {
    
    private Long id;
    private Long pegawaiId;
    private String namaPegawai;
    private Long jenisCutiId;
    private String namaCuti;
    private Integer jatahHari;
    private Integer tahun;
    private Boolean isActive;
}
