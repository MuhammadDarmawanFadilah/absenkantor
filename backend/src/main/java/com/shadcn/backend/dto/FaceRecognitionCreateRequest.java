package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionCreateRequest {
    private Long pegawaiId;
    private String faceImageBase64; // Backward compatibility - main image
    private String faceEncoding; // Backward compatibility - main descriptor
    private Double faceConfidence; // Backward compatibility
    private String notes;
    
    // New MediaPipe 2024-2025 fields
    private List<FaceDescriptorData> faceDescriptors;
    private List<CapturedImageData> capturedImages;
    private List<CaptureStepData> captureSteps;
    private TestResultData testResult;
    private String technology;
    private String version;
    private Integer landmarkPoints;
    private String captureMethod;
    private String createdAt;
    private Map<String, Object> statistics;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FaceDescriptorData {
        private String position;
        private String stepId;
        private List<Double> descriptor;
        private Integer landmarks;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CapturedImageData {
        private String position;
        private String stepId;
        private String imageBase64;
        private String timestamp;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CaptureStepData {
        private String stepId;
        private String stepName;
        private String instruction;
        private Boolean completed;
        private String expectedOrientation;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestResultData {
        private Boolean recognized;
        private Integer confidence;
        private String message;
        private String testDate;
    }
}