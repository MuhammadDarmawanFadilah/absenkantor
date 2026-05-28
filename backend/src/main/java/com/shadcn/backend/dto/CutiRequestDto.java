package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CutiRequestDto {
    
    private LocalDate tanggalDari;
    private LocalDate tanggalKe;
    private String tipeCuti; // CUTI or SAKIT
    private Long jenisCutiId; // optional for SAKIT
    private String alasanCuti;
    private String lampiranCuti; // base64 encoded file or file path
    
    // Helper method to get all dates between tanggalDari and tanggalKe
    public List<LocalDate> getAllDates() {
        return tanggalDari.datesUntil(tanggalKe.plusDays(1)).toList();
    }
}
