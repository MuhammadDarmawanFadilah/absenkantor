package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CutiResponseDto {
    
    private Long id;
    private Long pegawaiId;
    private String namaPegawai;
    private LocalDate tanggalCuti;
    private String tipeCuti; // CUTI or SAKIT
    private Long jenisCutiId;
    private String jenisCutiNama;
    private String alasanCuti;
    private String lampiranCuti;
    private String statusApproval;
    private String catatanApproval;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
