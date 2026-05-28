package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilePegawaiGroupResponse {
    
    private Long id; // This will be the ID of the first file in the group
    private Long pegawaiId;
    private String pegawaiNama;
    private Long kategoriId;
    private String kategoriNama;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<FilePegawaiFileInfo> files;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilePegawaiFileInfo {
        private Long id;
        private String judul;
        private String deskripsi;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}