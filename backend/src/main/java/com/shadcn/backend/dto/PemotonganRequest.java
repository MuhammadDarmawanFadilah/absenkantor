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
public class PemotonganRequest {
    
    @NotNull(message = "ID Pegawai tidak boleh kosong")
    private Long pegawaiId;
    
    @NotNull(message = "Bulan pemotongan tidak boleh kosong")
    @Min(value = 1, message = "Bulan harus antara 1-12")
    @Max(value = 12, message = "Bulan harus antara 1-12")
    private Integer bulanPemotongan;
    
    @NotNull(message = "Tahun pemotongan tidak boleh kosong")
    @Min(value = 2020, message = "Tahun minimal 2020")
    @Max(value = 2030, message = "Tahun maksimal 2030")
    private Integer tahunPemotongan;
    
    @NotNull(message = "Persentase pemotongan tidak boleh kosong")
    @DecimalMin(value = "0.01", message = "Persentase minimal 0.01%")
    @DecimalMax(value = "100.00", message = "Persentase maksimal 100%")
    @Digits(integer = 3, fraction = 2, message = "Format persentase tidak valid")
    private BigDecimal persentasePemotongan;
    
    @NotBlank(message = "Alasan pemotongan tidak boleh kosong")
    @Size(min = 5, max = 500, message = "Alasan pemotongan harus antara 5-500 karakter")
    private String alasanPemotongan;
    
    @DecimalMin(value = "0", message = "Tunjangan kinerja tidak boleh negatif")
    @Digits(integer = 13, fraction = 2, message = "Format tunjangan kinerja tidak valid")
    private BigDecimal tunjanganKinerja;
}
