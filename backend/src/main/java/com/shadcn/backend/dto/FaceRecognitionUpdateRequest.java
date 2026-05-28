package com.shadcn.backend.dto;

import com.shadcn.backend.entity.FaceRecognition.FaceRecognitionStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionUpdateRequest {
    private FaceRecognitionStatus status;
    private String notes;
    
    // Backward compatibility
    private String faceImageBase64; // Optional: for updating face image
    private String faceEncoding; // Optional: for updating face encoding
    private Double faceConfidence; // Optional: for updating confidence
    
    // New MediaPipe 2024-2025 fields (for full update)
    private List<FaceRecognitionCreateRequest.FaceDescriptorData> faceDescriptors;
    private List<FaceRecognitionCreateRequest.CapturedImageData> capturedImages;
    private List<FaceRecognitionCreateRequest.CaptureStepData> captureSteps;
    private FaceRecognitionCreateRequest.TestResultData testResult;
    private String technology;
    private String version;
}