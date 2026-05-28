package com.shadcn.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PemotonganAbsenRequest {
    
    @NotBlank(message = "Nama tidak boleh kosong")
    @Size(min = 5, max = 100, message = "Nama harus antara 5-100 karakter")
    private String nama;
    
    @NotBlank(message = "Deskripsi tidak boleh kosong")
    @Size(min = 10, max = 200, message = "Deskripsi harus antara 10-200 karakter")
    private String deskripsi;
    
    @NotNull(message = "Persentase tidak boleh kosong")
    @DecimalMin(value = "0.0", message = "Persentase minimal 0%")
    @DecimalMax(value = "100.0", message = "Persentase maksimal 100%")
    @Digits(integer = 3, fraction = 2, message = "Format persentase tidak valid")
    private BigDecimal persentase;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class PemotonganAbsenResponse {
    private Long id;
    private String kode;
    private String nama;
    private String deskripsi;
    private BigDecimal persentase;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}
