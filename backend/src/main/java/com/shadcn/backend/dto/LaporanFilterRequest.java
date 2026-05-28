package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LaporanFilterRequest {
    
    @Min(value = 0, message = "Page tidak boleh negatif")
    private int page = 0;
    
    @Min(value = 1, message = "Size minimal 1")
    private int size = 10;
    
    @Size(max = 50, message = "Sort field maksimal 50 karakter")
    private String sortBy = "createdAt";
    
    @Size(max = 4, message = "Sort direction harus 'asc' atau 'desc'")
    private String sortDirection = "desc";
    
    @Size(max = 200, message = "Nama laporan maksimal 200 karakter")
    private String namaLaporan;
    
    private String jenisLaporanNama;
    
    private Long jenisLaporanId;
    
    private String status;
    
    private LocalDateTime startDate;
    
    private LocalDateTime endDate;
    
    private Long userId; // For filtering by specific user
}
