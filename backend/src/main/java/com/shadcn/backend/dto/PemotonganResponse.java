package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PemotonganResponse {
    
    private Long id;
    private Long pegawaiId;
    private String namaPegawai;
    private String nip;
    private String jabatan;
    private Integer bulanPemotongan;
    private Integer tahunPemotongan;
    private BigDecimal persentasePemotongan;
    private String alasanPemotongan;
    private BigDecimal nominalPemotongan;
    private BigDecimal tunjanganKinerja;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Helper method to get month name in Indonesian
    public String getNamaBulan() {
        if (bulanPemotongan == null) return null;
        
        String[] months = {
            "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        };
        
        return bulanPemotongan >= 1 && bulanPemotongan <= 12 
            ? months[bulanPemotongan] 
            : bulanPemotongan.toString();
    }
    
    // Helper method for period display
    public String getPeriodePemotongan() {
        return getNamaBulan() + " " + tahunPemotongan;
    }
}
