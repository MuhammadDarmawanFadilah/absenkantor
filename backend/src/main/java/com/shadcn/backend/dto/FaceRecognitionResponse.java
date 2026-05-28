package com.shadcn.backend.dto;

import com.shadcn.backend.entity.FaceRecognition.FaceRecognitionStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceRecognitionResponse {
    private Long id;
    private PegawaiSummaryDto pegawai;
    
    // Backward compatibility
    private String faceImageBase64;
    private Double faceConfidence;
    private Integer trainingImagesCount;
    
    // New MediaPipe 2024-2025 fields (parsed from JSON)
    private List<FaceRecognitionCreateRequest.FaceDescriptorData> faceDescriptors;
    private List<FaceRecognitionCreateRequest.CapturedImageData> capturedImages;
    private List<FaceRecognitionCreateRequest.CaptureStepData> captureSteps;
    private FaceRecognitionCreateRequest.TestResultData testResult;
    private String technology;
    private String version;
    private Integer landmarkPoints;
    private String captureMethod;
    private Map<String, Object> statistics;
    
    private FaceRecognitionStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PegawaiSummaryDto {
        private Long id;
        private String namaLengkap;
        private String nip;
        private String email;
        private String nomorTelepon;
        private JabatanDto jabatan;
        private String status;
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class JabatanDto {
            private Long id;
            private String nama;
        }
    }
}
