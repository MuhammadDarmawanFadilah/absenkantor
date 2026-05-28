package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LokasiRequest {
    
    @NotBlank(message = "Nama lokasi tidak boleh kosong")
    private String namaLokasi;
    
    private String alamat;
    
    private String latitude;
    
    private String longitude;
    
    private String radius;
    
    private String status;
    
    private Long createdById;
    
    private Boolean isActive = true;
}
