package com.shadcn.backend.dto;

import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
public class JenisCutiResponseDto {
    
    private Long id;
    private String namaCuti;
    private String deskripsi;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
