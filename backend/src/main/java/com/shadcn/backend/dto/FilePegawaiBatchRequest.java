package com.shadcn.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilePegawaiBatchRequest {
    
    @NotNull(message = "Pegawai ID tidak boleh kosong")
    private Long pegawaiId;
    
    @NotNull(message = "Kategori ID tidak boleh kosong")
    private Long kategoriId;
    
    @NotEmpty(message = "Daftar file tidak boleh kosong")
    @Valid
    private List<FilePegawaiFileRequest> files;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilePegawaiFileRequest {
        @NotNull(message = "Judul file tidak boleh kosong")
        private String judul;
        
        private String deskripsi;
        
        @NotNull(message = "Nama file tidak boleh kosong")
        private String fileName;
        
        private String fileType;
        
        private Long fileSize;
        
        private Boolean isActive = true;
    }
}
