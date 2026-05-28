package com.shadcn.backend.dto;

import com.shadcn.backend.model.Lokasi;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LokasiResponse {
    
    private Long id;
    private String namaLokasi;
    private String alamat;
    private String latitude;
    private String longitude;
    private String radius;
    private String status;
    private PegawaiSummary createdBy;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PegawaiSummary {
        private Long id;
        private String username;
        private String namaLengkap;
        private String email;
    }
    
    // Constructor from entity
    public LokasiResponse(Lokasi lokasi) {
        this.id = lokasi.getId();
        this.namaLokasi = lokasi.getNamaLokasi();
        this.alamat = lokasi.getAlamat();
        this.latitude = lokasi.getLatitude();
        this.longitude = lokasi.getLongitude();
        this.radius = lokasi.getRadius();
        this.status = lokasi.getStatus();
        this.createdBy = lokasi.getCreatedBy() != null ? 
            PegawaiSummary.builder()
                .id(lokasi.getCreatedBy().getId())
                .username(lokasi.getCreatedBy().getUsername())
                .namaLengkap(lokasi.getCreatedBy().getNamaLengkap())
                .email(lokasi.getCreatedBy().getEmail())
                .build() : null;
        this.isActive = lokasi.getIsActive();
        this.createdAt = lokasi.getCreatedAt();
        this.updatedAt = lokasi.getUpdatedAt();
    }
}
