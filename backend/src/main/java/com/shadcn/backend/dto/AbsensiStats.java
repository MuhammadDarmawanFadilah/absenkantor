package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbsensiStats {
    
    private Long totalHadir;
    private Long totalTerlambat;
    private Long totalPulangCepat;
    private Long totalAlpha;
    private Long bulanIni;
}
