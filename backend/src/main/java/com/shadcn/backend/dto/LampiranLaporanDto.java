package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LampiranLaporanDto {
    private Long lampiranId;
    
    private String namaFile;
    
    private String pathFile;
    
    private String jenisFile;
    
    private Long ukuranFile;
    
    private String ukuranFileFormatted; // "1.5 MB"
    
    private LocalDateTime createdAt;
    
    private Long detailLaporanId;
    
    private String downloadUrl;
}
