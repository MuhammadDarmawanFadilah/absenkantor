package com.shadcn.backend.entity;

import com.shadcn.backend.model.Pegawai;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "face_recognition")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognition {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pegawai_id", nullable = false)
    private Pegawai pegawai;
    
    // Backward compatibility fields
    @Column(name = "face_image_base64", columnDefinition = "LONGTEXT", nullable = true)
    private String faceImageBase64;
    
    @Column(name = "face_encoding", columnDefinition = "TEXT", nullable = true)
    private String faceEncoding; // JSON string of face descriptor array
    
    @Column(name = "face_confidence", nullable = true)
    private Double faceConfidence;
    
    @Column(name = "training_images_count")
    private Integer trainingImagesCount = 1;
    
    // New MediaPipe 2024-2025 fields
    @Column(name = "face_descriptors", columnDefinition = "LONGTEXT", nullable = true)
    private String faceDescriptors; // JSON array of all face descriptors from multiple positions
    
    @Column(name = "captured_images", columnDefinition = "LONGTEXT", nullable = true)
    private String capturedImages; // JSON array of all captured images with positions
    
    @Column(name = "capture_steps", columnDefinition = "TEXT", nullable = true)
    private String captureSteps; // JSON array of capture step definitions
    
    @Column(name = "test_result", columnDefinition = "TEXT", nullable = true)
    private String testResult; // JSON object of test validation result
    
    @Column(name = "technology", nullable = true)
    private String technology; // e.g., "MediaPipe FaceLandmarker 2024-2025"
    
    @Column(name = "version", nullable = true)
    private String version; // e.g., "0.10.22"
    
    @Column(name = "landmark_points", nullable = true)
    private Integer landmarkPoints; // e.g., 468 for MediaPipe
    
    @Column(name = "capture_method", nullable = true)
    private String captureMethod; // e.g., "Auto-capture with orientation detection"
    
    @Column(name = "statistics", columnDefinition = "TEXT", nullable = true)
    private String statistics; // JSON object of capture statistics
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private FaceRecognitionStatus status = FaceRecognitionStatus.ACTIVE;
    
    @Column(name = "notes", columnDefinition = "TEXT", nullable = true)
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum FaceRecognitionStatus {
        ACTIVE, INACTIVE
    }
}