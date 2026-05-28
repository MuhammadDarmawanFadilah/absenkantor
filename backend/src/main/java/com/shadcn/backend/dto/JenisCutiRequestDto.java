package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JenisCutiRequestDto {
    
    @NotBlank(message = "Nama cuti tidak boleh kosong")
    private String namaCuti;
    
    private String deskripsi;
    
    private Boolean isActive = true;
}
