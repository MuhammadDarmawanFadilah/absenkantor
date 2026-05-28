package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PegawaiWithoutFaceResponse {
    private Long id;
    private String namaLengkap;
    private String nip;
    private String email;
    private String nomorTelepon;
    private JabatanDto jabatan;
    private String status;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JabatanDto {
        private Long id;
        private String nama;
    }
}