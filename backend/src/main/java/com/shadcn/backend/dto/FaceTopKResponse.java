package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceTopKResponse {
    private List<Candidate> candidates; // Sorted by confidence desc

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Candidate {
        private Long faceRecognitionId;
        private PegawaiResponse pegawai;
        private double confidence; // similarity [0..1]
    }
}
