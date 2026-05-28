package com.shadcn.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PegawaiCutiQuotaDto {
    
    private Long jenisCutiId;
    private String jenisCutiNama;
    private Integer tahun;
    private Integer jatahHari;
    private Integer cutiTerpakai;
    private Integer sisaCuti;
}
