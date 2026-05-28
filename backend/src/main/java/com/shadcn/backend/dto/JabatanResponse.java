package com.shadcn.backend.dto;

import com.shadcn.backend.model.Jabatan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JabatanResponse {
    
    private Long id;
    private String nama;
    private String deskripsi;
    private PegawaiSummary manager;
    private Boolean isActive;
    private Integer sortOrder;
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
    
    // Constructor from Jabatan entity
    public JabatanResponse(Jabatan jabatan) {
        this.id = jabatan.getId();
        this.nama = jabatan.getNama();
        this.deskripsi = jabatan.getDeskripsi();
        this.manager = jabatan.getManager() != null ? 
            PegawaiSummary.builder()
                .id(jabatan.getManager().getId())
                .username(jabatan.getManager().getUsername())
                .namaLengkap(jabatan.getManager().getNamaLengkap())
                .email(jabatan.getManager().getEmail())
                .build() : null;
        this.isActive = jabatan.getIsActive();
        this.sortOrder = jabatan.getSortOrder();
        this.createdAt = jabatan.getCreatedAt();
        this.updatedAt = jabatan.getUpdatedAt();
    }
    
    // Static factory method
    public static JabatanResponse from(Jabatan jabatan) {
        return new JabatanResponse(jabatan);
    }
}
