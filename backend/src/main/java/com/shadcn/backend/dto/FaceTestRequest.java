package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceTestRequest {
    private double[] faceDescriptor;
    private String imageBase64;
    private Long targetFaceRecognitionId; // Optional - if testing against specific face recognition
    private Long pegawaiId; // For testing against specific pegawai's face recognition
}