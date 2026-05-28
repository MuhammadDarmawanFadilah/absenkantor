package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilePegawaiRequest {
    
    @NotBlank(message = "Judul file tidak boleh kosong")
    @Size(max = 255, message = "Judul file maksimal 255 karakter")
    private String judul;
    
    @Size(max = 500, message = "Deskripsi maksimal 500 karakter")
    private String deskripsi;
    
    @NotBlank(message = "Nama file tidak boleh kosong")
    @Size(max = 255, message = "Nama file maksimal 255 karakter")
    private String fileName;
    
    @Size(max = 100, message = "Tipe file maksimal 100 karakter")
    private String fileType;
    
    private Long fileSize;
    
    @NotNull(message = "Pegawai harus dipilih")
    private Long pegawaiId;
    
    @NotNull(message = "Kategori harus dipilih")
    private Long kategoriId;
    
    private Boolean isActive = true;
}
