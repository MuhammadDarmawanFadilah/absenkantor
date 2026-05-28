package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HariLiburRequest {
    
    @NotBlank(message = "Nama libur tidak boleh kosong")
    @Size(max = 255, message = "Nama libur maksimal 255 karakter")
    private String namaLibur;
    
    @NotNull(message = "Tanggal libur tidak boleh kosong")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tanggalLibur;
    
    @Builder.Default
    private Boolean isNasional = false;
    
    @Size(max = 500, message = "Keterangan maksimal 500 karakter")
    private String keterangan;
}
