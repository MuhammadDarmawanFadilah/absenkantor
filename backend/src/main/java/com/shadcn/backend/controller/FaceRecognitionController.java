package com.shadcn.backend.controller;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.entity.FaceRecognition.FaceRecognitionStatus;
import com.shadcn.backend.service.FaceRecognitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/face-recognition")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class FaceRecognitionController {
    
    private final FaceRecognitionService faceRecognitionService;
    
    // Get all face recognitions with pagination and filters
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllFaceRecognitions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) FaceRecognitionStatus status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        
        try {
            Page<FaceRecognitionResponse> faceRecognitions = faceRecognitionService.getAllFaceRecognitions(page, size, search, status);
            
            Map<String, Object> pagination = Map.of(
                "currentPage", faceRecognitions.getNumber(),
                "totalPages", faceRecognitions.getTotalPages(),
                "totalItems", faceRecognitions.getTotalElements(),
                "pageSize", faceRecognitions.getSize()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Face recognitions retrieved successfully",
                "data", faceRecognitions.getContent(),
                "pagination", pagination
            ));
        } catch (Exception e) {
            log.error("Error getting face recognitions: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Get face recognition by ID
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFaceRecognitionById(@PathVariable Long id) {
        try {
            Optional<FaceRecognitionResponse> faceRecognition = faceRecognitionService.getFaceRecognitionById(id);
            
            if (faceRecognition.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Face recognition retrieved successfully",
                    "data", faceRecognition.get()
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Face recognition not found"
                ));
            }
        } catch (Exception e) {
            log.error("Error getting face recognition by ID: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Get face recognition by pegawai ID
    @GetMapping("/pegawai/{pegawaiId}")
    public ResponseEntity<Map<String, Object>> getFaceRecognitionByPegawaiId(@PathVariable Long pegawaiId) {
        try {
            Optional<FaceRecognitionResponse> faceRecognition = faceRecognitionService.getFaceRecognitionByPegawaiId(pegawaiId);
            
            if (faceRecognition.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Face recognition retrieved successfully",
                    "data", faceRecognition.get()
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Face recognition not found for this pegawai"
                ));
            }
        } catch (Exception e) {
            log.error("Error getting face recognition by pegawai ID: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Create new face recognition
    @PostMapping
    public ResponseEntity<Map<String, Object>> createFaceRecognition(@RequestBody FaceRecognitionCreateRequest request) {
        try {
            FaceRecognitionResponse created = faceRecognitionService.createFaceRecognition(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Face recognition created successfully",
                "data", created
            ));
        } catch (RuntimeException e) {
            log.error("Error creating face recognition: ", e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error creating face recognition: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Update face recognition
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateFaceRecognition(
            @PathVariable Long id, 
            @RequestBody FaceRecognitionUpdateRequest request) {
        try {
            FaceRecognitionResponse updated = faceRecognitionService.updateFaceRecognition(id, request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Face recognition updated successfully",
                "data", updated
            ));
        } catch (RuntimeException e) {
            log.error("Error updating face recognition: ", e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error updating face recognition: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Delete face recognition
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFaceRecognition(@PathVariable Long id) {
        try {
            faceRecognitionService.deleteFaceRecognition(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Face recognition deleted successfully"
            ));
        } catch (RuntimeException e) {
            log.error("Error deleting face recognition: ", e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error deleting face recognition: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Get statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getFaceRecognitionStats() {
        try {
            FaceRecognitionStatsResponse stats = faceRecognitionService.getStatistics();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Statistics retrieved successfully",
                "data", stats
            ));
        } catch (Exception e) {
            log.error("Error getting statistics: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Get pegawai without face recognition
    @GetMapping("/pegawai-without-face")
    public ResponseEntity<Map<String, Object>> getPegawaiWithoutFaceRecognition() {
        try {
            List<PegawaiWithoutFaceResponse> pegawai = faceRecognitionService.getPegawaiWithoutFaceRecognition();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Pegawai without face recognition retrieved successfully",
                "data", pegawai
            ));
        } catch (Exception e) {
            log.error("Error getting pegawai without face recognition: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Match face descriptor - for attendance face recognition
    @PostMapping("/match")
    public ResponseEntity<Map<String, Object>> matchFaceDescriptor(@RequestBody FaceMatchRequest request) {
        try {
            Optional<FaceRecognitionResponse> match = faceRecognitionService.matchFaceDescriptor(request);
            
            if (match.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Face matched successfully",
                    "data", match.get()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Face not recognized",
                    "data", null
                ));
            }
        } catch (Exception e) {
            log.error("Error matching face descriptor: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // Get top-K matches for a descriptor
    @PostMapping("/topk")
    public ResponseEntity<Map<String, Object>> topK(@RequestBody FaceTopKRequest request) {
        try {
            FaceTopKResponse resp = faceRecognitionService.topKMatches(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Top-K matches retrieved",
                "data", resp,
                "threshold", faceRecognitionService.getGlobalConfidenceThreshold()
            ));
        } catch (Exception e) {
            log.error("Error retrieving top-K matches: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Test face recognition - for testing purposes
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testFaceRecognition(@RequestBody FaceTestRequest request) {
        try {
            log.info("Testing face recognition with descriptor length: {}", 
                request.getFaceDescriptor() != null ? request.getFaceDescriptor().length : 0);
            
            FaceTestResponse testResult = faceRecognitionService.testFaceRecognition(request);
            
            log.info("=== CONTROLLER RESPONSE ===");
            log.info("Test Result isMatch: {}", testResult.isMatch());
            log.info("Test Result confidence: {}", testResult.getConfidence());
            log.info("Test Result message: {}", testResult.getMessage());
            log.info("==========================");
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Face recognition test completed",
                "data", testResult
            );
            
            log.info("Final response: {}", response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error testing face recognition: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
}
