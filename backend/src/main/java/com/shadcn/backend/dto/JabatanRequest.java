package com.shadcn.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JabatanRequest {
    
    @NotBlank(message = "Nama jabatan is required")
    @Size(max = 100, message = "Nama jabatan must not exceed 100 characters")
    private String nama;
    
    @Size(max = 500, message = "Deskripsi must not exceed 500 characters")
    private String deskripsi;
    
    private Long managerId;
    
    @NotNull(message = "Status is required")
    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private Integer sortOrder = 0;
}
