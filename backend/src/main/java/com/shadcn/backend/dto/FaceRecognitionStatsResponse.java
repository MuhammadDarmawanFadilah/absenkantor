package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceRecognitionStatsResponse {
    private Long totalRegistered;
    private Long totalActive;
    private Long totalInactive;
    private Double averageConfidence;
}