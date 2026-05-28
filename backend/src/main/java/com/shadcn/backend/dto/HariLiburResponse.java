package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HariLiburResponse {
    
    private Long id;
    private String namaLibur;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tanggalLibur;
    
    private Integer bulanLibur;
    private Integer tahunLibur;
    private Boolean isNasional;
    private String keterangan;
    private Boolean isActive;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Utility methods
    public String getNamaBulan() {
        if (bulanLibur == null) return "";
        String[] namaBulan = {
            "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        };
        return bulanLibur > 0 && bulanLibur <= 12 ? namaBulan[bulanLibur] : "";
    }
    
    public String getStatusLibur() {
        return Boolean.TRUE.equals(isNasional) ? "Nasional" : "Lokal";
    }
}
