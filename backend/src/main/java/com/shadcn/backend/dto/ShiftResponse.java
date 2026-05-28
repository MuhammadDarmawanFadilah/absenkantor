package com.shadcn.backend.dto;

import com.shadcn.backend.entity.Shift;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftResponse {
    
    private Long id;
    private String namaShift;
    private String jamMasuk;
    private String jamKeluar;
    private String deskripsi;
    private String lockLokasi;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor from entity
    public ShiftResponse(Shift shift) {
        this.id = shift.getId();
        this.namaShift = shift.getNamaShift();
        this.jamMasuk = shift.getJamMasuk();
        this.jamKeluar = shift.getJamKeluar();
        this.deskripsi = shift.getDeskripsi();
        this.lockLokasi = shift.getLockLokasi();
        this.isActive = shift.getIsActive();
        this.createdAt = shift.getCreatedAt();
        this.updatedAt = shift.getUpdatedAt();
    }
}
