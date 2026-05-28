package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilePegawaiResponse {
    private Long id;
    private String judul;
    private String deskripsi;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private Long pegawaiId;
    private String pegawaiNama;
    private Long kategoriId;
    private String kategoriNama;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
