package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceTestResponse {
    @JsonProperty("isMatch")
    private boolean isMatch;
    private double confidence;
    private PegawaiResponse pegawai; // If matched
    private String message;
    private Long matchedFaceRecognitionId; // ID of matched face recognition record
}