package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.*;
import com.shadcn.backend.entity.FaceRecognition;
import com.shadcn.backend.entity.FaceRecognition.FaceRecognitionStatus;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.FaceRecognitionRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FaceRecognitionService {
    
    private final FaceRecognitionRepository faceRecognitionRepository;
    private final PegawaiRepository pegawaiRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Thresholds configurable via application properties
    @Value("${app.face.threshold.self:0.75}")
    private double selfConfidenceThreshold; // similarity in [0..1]

    @Value("${app.face.threshold.global:0.85}")
    private double globalConfidenceThreshold; // similarity in [0..1]

    @Value("${app.face.threshold.specific:0.75}")
    private double specificConfidenceThreshold; // similarity in [0..1]

    public double getSelfConfidenceThreshold() { return selfConfidenceThreshold; }
    public double getGlobalConfidenceThreshold() { return globalConfidenceThreshold; }
    public double getSpecificConfidenceThreshold() { return specificConfidenceThreshold; }
    
    // Get all face recognitions with pagination and filters
    public Page<FaceRecognitionResponse> getAllFaceRecognitions(int page, int size, String search, FaceRecognitionStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FaceRecognition> faceRecognitions = faceRecognitionRepository.findWithFilters(search, status, pageable);
        return faceRecognitions.map(this::convertToResponse);
    }
    
    // Get face recognition by ID
    public Optional<FaceRecognitionResponse> getFaceRecognitionById(Long id) {
        return faceRecognitionRepository.findById(id)
                .map(this::convertToResponse);
    }
    
    // Get face recognition by pegawai ID
    public Optional<FaceRecognitionResponse> getFaceRecognitionByPegawaiId(Long pegawaiId) {
        return faceRecognitionRepository.findByPegawaiId(pegawaiId)
                .map(this::convertToResponse);
    }
    
    // Create new face recognition
    public FaceRecognitionResponse createFaceRecognition(FaceRecognitionCreateRequest request) {
        // Check if pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new RuntimeException("Pegawai not found with ID: " + request.getPegawaiId()));
        
        // Check if pegawai already has face recognition
        if (faceRecognitionRepository.existsByPegawaiId(request.getPegawaiId())) {
            throw new RuntimeException("Pegawai already has face recognition registered");
        }
        
        FaceRecognition faceRecognition = new FaceRecognition();
        faceRecognition.setPegawai(pegawai);
        
        // Handle both old and new data structures
        try {
            // New MediaPipe structure
            if (request.getFaceDescriptors() != null && !request.getFaceDescriptors().isEmpty()) {
                faceRecognition.setFaceDescriptors(objectMapper.writeValueAsString(request.getFaceDescriptors()));
                faceRecognition.setTrainingImagesCount(request.getFaceDescriptors().size());
                
                // Use first image as main image for backward compatibility
                if (request.getCapturedImages() != null && !request.getCapturedImages().isEmpty()) {
                    faceRecognition.setFaceImageBase64(request.getCapturedImages().get(0).getImageBase64());
                    faceRecognition.setCapturedImages(objectMapper.writeValueAsString(request.getCapturedImages()));
                }
                
                // Use test result confidence for backward compatibility
                if (request.getTestResult() != null) {
                    faceRecognition.setFaceConfidence(request.getTestResult().getConfidence() / 100.0);
                    faceRecognition.setTestResult(objectMapper.writeValueAsString(request.getTestResult()));
                }
                
                if (request.getCaptureSteps() != null) {
                    faceRecognition.setCaptureSteps(objectMapper.writeValueAsString(request.getCaptureSteps()));
                }
                
                if (request.getStatistics() != null) {
                    faceRecognition.setStatistics(objectMapper.writeValueAsString(request.getStatistics()));
                }
                
                faceRecognition.setTechnology(request.getTechnology());
                faceRecognition.setVersion(request.getVersion());
                faceRecognition.setLandmarkPoints(request.getLandmarkPoints());
                faceRecognition.setCaptureMethod(request.getCaptureMethod());
                
                log.info("Creating MediaPipe face recognition for pegawai ID: {} with {} descriptors", 
                        request.getPegawaiId(), request.getFaceDescriptors().size());
            }
            // Backward compatibility - old structure
            else {
                faceRecognition.setFaceImageBase64(request.getFaceImageBase64());
                faceRecognition.setFaceEncoding(request.getFaceEncoding());
                faceRecognition.setFaceConfidence(request.getFaceConfidence());
                faceRecognition.setTrainingImagesCount(1);
                
                log.info("Creating legacy face recognition for pegawai ID: {}", request.getPegawaiId());
            }
            
            faceRecognition.setNotes(request.getNotes());
            faceRecognition.setStatus(FaceRecognitionStatus.ACTIVE);
            
            FaceRecognition saved = faceRecognitionRepository.save(faceRecognition);
            log.info("Successfully created face recognition with ID: {}", saved.getId());
            
            return convertToResponse(saved);
            
        } catch (Exception e) {
            log.error("Error creating face recognition: ", e);
            throw new RuntimeException("Failed to create face recognition: " + e.getMessage());
        }
    }
    
    // Update face recognition
    public FaceRecognitionResponse updateFaceRecognition(Long id, FaceRecognitionUpdateRequest request) {
        FaceRecognition faceRecognition = faceRecognitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Face recognition not found with ID: " + id));
        
        try {
            // Handle both old and new data structures
            if (request.getFaceDescriptors() != null && !request.getFaceDescriptors().isEmpty()) {
                // New MediaPipe structure
                faceRecognition.setFaceDescriptors(objectMapper.writeValueAsString(request.getFaceDescriptors()));
                faceRecognition.setTrainingImagesCount(request.getFaceDescriptors().size());
                
                if (request.getCapturedImages() != null && !request.getCapturedImages().isEmpty()) {
                    // Use first image as main image for backward compatibility
                    faceRecognition.setFaceImageBase64(request.getCapturedImages().get(0).getImageBase64());
                    faceRecognition.setCapturedImages(objectMapper.writeValueAsString(request.getCapturedImages()));
                }
                
                if (request.getTestResult() != null) {
                    // Use test result confidence for backward compatibility
                    faceRecognition.setFaceConfidence(request.getTestResult().getConfidence() / 100.0);
                    faceRecognition.setTestResult(objectMapper.writeValueAsString(request.getTestResult()));
                }
                
                if (request.getCaptureSteps() != null) {
                    faceRecognition.setCaptureSteps(objectMapper.writeValueAsString(request.getCaptureSteps()));
                }
                
                if (request.getTechnology() != null) {
                    faceRecognition.setTechnology(request.getTechnology());
                }
                if (request.getVersion() != null) {
                    faceRecognition.setVersion(request.getVersion());
                }
                
                log.info("Updating MediaPipe face recognition ID: {} with {} descriptors", 
                        id, request.getFaceDescriptors().size());
            }
            // Backward compatibility - old structure
            else {
                if (request.getFaceImageBase64() != null) {
                    faceRecognition.setFaceImageBase64(request.getFaceImageBase64());
                }
                if (request.getFaceEncoding() != null) {
                    faceRecognition.setFaceEncoding(request.getFaceEncoding());
                }
                if (request.getFaceConfidence() != null) {
                    faceRecognition.setFaceConfidence(request.getFaceConfidence());
                }
                
                log.info("Updating legacy face recognition ID: {}", id);
            }
            
            // Common fields
            if (request.getNotes() != null) {
                faceRecognition.setNotes(request.getNotes());
            }
            if (request.getStatus() != null) {
                faceRecognition.setStatus(request.getStatus());
            }
            
            FaceRecognition updated = faceRecognitionRepository.save(faceRecognition);
            log.info("Successfully updated face recognition with ID: {}", updated.getId());
            
            return convertToResponse(updated);
            
        } catch (Exception e) {
            log.error("Error updating face recognition: ", e);
            throw new RuntimeException("Failed to update face recognition: " + e.getMessage());
        }
    }
    
    // Delete face recognition
    public void deleteFaceRecognition(Long id) {
        if (!faceRecognitionRepository.existsById(id)) {
            throw new RuntimeException("Face recognition not found with ID: " + id);
        }
        
        faceRecognitionRepository.deleteById(id);
        log.info("Deleted face recognition ID: {}", id);
    }
    
    // Get statistics
    public FaceRecognitionStatsResponse getStatistics() {
        long totalRegistered = faceRecognitionRepository.count();
        long totalActive = faceRecognitionRepository.countByStatus(FaceRecognitionStatus.ACTIVE);
        long totalInactive = faceRecognitionRepository.countByStatus(FaceRecognitionStatus.INACTIVE);
        Double averageConfidence = faceRecognitionRepository.getAverageConfidence();
        
        return FaceRecognitionStatsResponse.builder()
                .totalRegistered(totalRegistered)
                .totalActive(totalActive)
                .totalInactive(totalInactive)
                .averageConfidence(averageConfidence != null ? averageConfidence : 0.0)
                .build();
    }
    
    // Get pegawai without face recognition
    public List<PegawaiWithoutFaceResponse> getPegawaiWithoutFaceRecognition() {
        List<Long> pegawaiIdsWithFace = faceRecognitionRepository.findAllPegawaiIdsWithFaceRecognition();
        List<Pegawai> allPegawai = pegawaiRepository.findAll();
        
        return allPegawai.stream()
                .filter(pegawai -> !pegawaiIdsWithFace.contains(pegawai.getId()))
                // Note: Pegawai doesn't have status field, so we'll include all
                .map(this::convertToPegawaiWithoutFaceResponse)
                .collect(Collectors.toList());
    }
    
    // Match face descriptor with existing face recognitions
    public Optional<FaceRecognitionResponse> matchFaceDescriptor(FaceMatchRequest request) {
        try {
            if (request.getFaceDescriptor() == null || request.getFaceDescriptor().trim().isEmpty()) {
                return Optional.empty();
            }

            // Parse incoming descriptor JSON to double[]
            double[] inputDescriptor = objectMapper.readValue(request.getFaceDescriptor(), double[].class);

            // Reuse the all-face recognition logic to find best match
            List<FaceRecognition> allFaceRecognitions = faceRecognitionRepository.findByStatus(FaceRecognitionStatus.ACTIVE);
            if (allFaceRecognitions.isEmpty()) {
                return Optional.empty();
            }

            double maxSimilarity = 0.0;
            FaceRecognition bestMatch = null;

            for (FaceRecognition fr : allFaceRecognitions) {
                if (fr.getFaceDescriptors() == null || fr.getFaceDescriptors().trim().isEmpty()) continue;
                double similarity = calculateSimilarity(inputDescriptor, fr.getFaceDescriptors());
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestMatch = fr;
                }
            }

            if (bestMatch != null && maxSimilarity >= globalConfidenceThreshold) {
                return Optional.of(convertToResponse(bestMatch));
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error during matchFaceDescriptor: ", e);
            return Optional.empty();
        }
    }

    public FaceTopKResponse topKMatches(FaceTopKRequest request) {
        if (request == null || request.getFaceDescriptor() == null || request.getFaceDescriptor().length == 0) {
            return FaceTopKResponse.builder().candidates(java.util.Collections.emptyList()).build();
        }

        List<FaceRecognition> allFaceRecognitions = faceRecognitionRepository.findByStatus(FaceRecognitionStatus.ACTIVE);
        if (allFaceRecognitions.isEmpty()) {
            return FaceTopKResponse.builder().candidates(java.util.Collections.emptyList()).build();
        }

        int k = request.getK() != null && request.getK() > 0 ? request.getK() : 5;

        java.util.PriorityQueue<FaceTopKResponse.Candidate> pq = new java.util.PriorityQueue<>(k,
            java.util.Comparator.comparingDouble(FaceTopKResponse.Candidate::getConfidence));

        for (FaceRecognition fr : allFaceRecognitions) {
            if (fr.getFaceDescriptors() == null || fr.getFaceDescriptors().trim().isEmpty()) continue;
            double sim = calculateSimilarity(request.getFaceDescriptor(), fr.getFaceDescriptors());
            FaceTopKResponse.Candidate cand = FaceTopKResponse.Candidate.builder()
                .faceRecognitionId(fr.getId())
                .pegawai(convertToPegawaiResponse(fr.getPegawai()))
                .confidence(sim)
                .build();
            if (pq.size() < k) {
                pq.offer(cand);
            } else if (pq.peek().getConfidence() < sim) {
                pq.poll();
                pq.offer(cand);
            }
        }

        java.util.List<FaceTopKResponse.Candidate> list = new java.util.ArrayList<>(pq);
        list.sort((a, b) -> Double.compare(b.getConfidence(), a.getConfidence()));
        return FaceTopKResponse.builder().candidates(list).build();
    }
    
    // Convert entity to response DTO
    private FaceRecognitionResponse convertToResponse(FaceRecognition faceRecognition) {
        Pegawai pegawai = faceRecognition.getPegawai();
        
        FaceRecognitionResponse.PegawaiSummaryDto.JabatanDto jabatanDto = null;
        if (pegawai.getJabatan() != null) {
            jabatanDto = FaceRecognitionResponse.PegawaiSummaryDto.JabatanDto.builder()
                    .id(pegawai.getJabatan().getId())
                    .nama(pegawai.getJabatan().getNama())
                    .build();
        }
        
        FaceRecognitionResponse.PegawaiSummaryDto pegawaiDto = FaceRecognitionResponse.PegawaiSummaryDto.builder()
                .id(pegawai.getId())
                .namaLengkap(pegawai.getNamaLengkap())
                .nip(pegawai.getNip())
                .email(pegawai.getEmail())
                .nomorTelepon(pegawai.getNoTelp())
                .jabatan(jabatanDto)
                .status("ACTIVE") // Default since Pegawai doesn't have status field
                .build();
        
        // Build the response with all available fields
        return FaceRecognitionResponse.builder()
                .id(faceRecognition.getId())
                .pegawai(pegawaiDto)
                .faceImageBase64(faceRecognition.getFaceImageBase64())
                .faceConfidence(faceRecognition.getFaceConfidence())
                .trainingImagesCount(faceRecognition.getTrainingImagesCount())
                .status(faceRecognition.getStatus())
                .notes(faceRecognition.getNotes())
                .createdAt(faceRecognition.getCreatedAt())
                .updatedAt(faceRecognition.getUpdatedAt())
                // Add MediaPipe specific fields (parsed from JSON)
                .faceDescriptors(parseJsonToFaceDescriptors(faceRecognition.getFaceDescriptors()))
                .capturedImages(parseJsonToCapturedImages(faceRecognition.getCapturedImages()))
                .captureSteps(parseJsonToCaptureSteps(faceRecognition.getCaptureSteps()))
                .testResult(parseJsonToTestResult(faceRecognition.getTestResult()))
                .statistics(parseJsonToStatistics(faceRecognition.getStatistics()))
                .technology(faceRecognition.getTechnology())
                .version(faceRecognition.getVersion())
                .landmarkPoints(faceRecognition.getLandmarkPoints())
                .captureMethod(faceRecognition.getCaptureMethod())
                .build();
    }
    
    // Helper methods to parse JSON strings to specific types
    private List<FaceRecognitionCreateRequest.FaceDescriptorData> parseJsonToFaceDescriptors(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(jsonString, 
                objectMapper.getTypeFactory().constructCollectionType(List.class, FaceRecognitionCreateRequest.FaceDescriptorData.class));
        } catch (Exception e) {
            log.warn("Failed to parse JSON to FaceDescriptors: {}", e.getMessage());
            return null;
        }
    }
    
    private List<FaceRecognitionCreateRequest.CapturedImageData> parseJsonToCapturedImages(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(jsonString, 
                objectMapper.getTypeFactory().constructCollectionType(List.class, FaceRecognitionCreateRequest.CapturedImageData.class));
        } catch (Exception e) {
            log.warn("Failed to parse JSON to CapturedImages: {}", e.getMessage());
            return null;
        }
    }
    
    private List<FaceRecognitionCreateRequest.CaptureStepData> parseJsonToCaptureSteps(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(jsonString, 
                objectMapper.getTypeFactory().constructCollectionType(List.class, FaceRecognitionCreateRequest.CaptureStepData.class));
        } catch (Exception e) {
            log.warn("Failed to parse JSON to CaptureSteps: {}", e.getMessage());
            return null;
        }
    }
    
    private FaceRecognitionCreateRequest.TestResultData parseJsonToTestResult(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(jsonString, FaceRecognitionCreateRequest.TestResultData.class);
        } catch (Exception e) {
            log.warn("Failed to parse JSON to TestResult: {}", e.getMessage());
            return null;
        }
    }
    
    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> parseJsonToStatistics(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(jsonString, java.util.Map.class);
        } catch (Exception e) {
            log.warn("Failed to parse JSON to Statistics: {}", e.getMessage());
            return null;
        }
    }
    
    // Convert pegawai to response DTO
    private PegawaiWithoutFaceResponse convertToPegawaiWithoutFaceResponse(Pegawai pegawai) {
        PegawaiWithoutFaceResponse.JabatanDto jabatanDto = null;
        if (pegawai.getJabatan() != null) {
            jabatanDto = PegawaiWithoutFaceResponse.JabatanDto.builder()
                    .id(pegawai.getJabatan().getId())
                    .nama(pegawai.getJabatan().getNama())
                    .build();
        }
        
        return PegawaiWithoutFaceResponse.builder()
                .id(pegawai.getId())
                .namaLengkap(pegawai.getNamaLengkap())
                .nip(pegawai.getNip())
                .email(pegawai.getEmail())
                .nomorTelepon(pegawai.getNoTelp())
                .jabatan(jabatanDto)
                .status("ACTIVE") // Default since Pegawai doesn't have status field
                .build();
    }
    
    // Test face recognition
    public FaceTestResponse testFaceRecognition(FaceTestRequest request) {
        log.info("Testing face recognition with descriptor length: {}", 
            request.getFaceDescriptor() != null ? request.getFaceDescriptor().length : 0);
        
        if (request.getFaceDescriptor() == null || request.getFaceDescriptor().length == 0) {
            log.warn("Empty or null face descriptor provided");
            return FaceTestResponse.builder()
                .isMatch(false)
                .confidence(0.0)
                .message("Face descriptor kosong atau tidak valid")
                .build();
        }
        
        try {
            // If testing against specific pegawai's face recognition (for attendance)
            if (request.getPegawaiId() != null) {
                return testAgainstPegawaiFaceRecognition(request);
            }
            
            // If testing against specific face recognition
            if (request.getTargetFaceRecognitionId() != null) {
                return testAgainstSpecificFaceRecognition(request);
            }
            
            // Test against all face recognitions
            return testAgainstAllFaceRecognitions(request);
            
        } catch (Exception e) {
            log.error("Error during face recognition test: ", e);
            return FaceTestResponse.builder()
                .isMatch(false)
                .confidence(0.0)
                .message("Test gagal: " + e.getMessage())
                .build();
        }
    }
    
    private FaceTestResponse testAgainstPegawaiFaceRecognition(FaceTestRequest request) {
        log.info("Testing against pegawai face recognition ID: {}", request.getPegawaiId());
        
        Optional<FaceRecognition> faceRecognitionOpt = faceRecognitionRepository.findByPegawaiIdAndStatus(
            request.getPegawaiId(), FaceRecognition.FaceRecognitionStatus.ACTIVE);
        
        if (!faceRecognitionOpt.isPresent()) {
            log.warn("No active face recognition found for pegawai ID: {}", request.getPegawaiId());
            return FaceTestResponse.builder()
                .isMatch(false)
                .confidence(0.0)
                .message("Pegawai belum memiliki data face recognition yang aktif")
                .build();
        }
        
        FaceRecognition faceRecognition = faceRecognitionOpt.get();
        if (faceRecognition.getFaceDescriptors() == null || faceRecognition.getFaceDescriptors().trim().isEmpty()) {
            log.warn("No face descriptors found for pegawai ID: {}", request.getPegawaiId());
            return FaceTestResponse.builder()
                .isMatch(false)
                .confidence(0.0)
                .message("Tidak ada data face descriptor untuk pegawai ini")
                .build();
        }
        
        log.info("Found stored descriptors for pegawai: {}", faceRecognition.getPegawai().getNamaLengkap());
        log.debug("Stored descriptors JSON length: {}", faceRecognition.getFaceDescriptors().length());
        
        // Parse stored descriptors and compare
    double similarity = calculateSimilarity(request.getFaceDescriptor(), faceRecognition.getFaceDescriptors());
    double confidence = similarity; // confidence is similarity in [0..1]
    boolean isMatch = similarity >= selfConfidenceThreshold;
        
        log.info("=== PEGAWAI FACE RECOGNITION TEST RESULT ===");
        log.info("Pegawai: {}", faceRecognition.getPegawai().getNamaLengkap());
    log.info("Similarity: {}", similarity);
    log.info("Confidence: {}%", confidence * 100);
    log.info("Threshold (self): {}", selfConfidenceThreshold);
    log.info("Is Match: {} (similarity {} >= {})", isMatch, similarity, selfConfidenceThreshold);
        log.info("==========================================");
        
        String message = isMatch 
            ? String.format("Wajah berhasil dikenali sebagai %s dengan confidence %.1f%%", 
                faceRecognition.getPegawai().getNamaLengkap(), confidence * 100)
            : String.format("Wajah tidak sesuai dengan %s. Confidence: %.1f%%", 
                faceRecognition.getPegawai().getNamaLengkap(), confidence * 100);
        
    log.info("Pegawai face recognition test result: match={}, confidence={}%, similarity={}", isMatch, confidence * 100, similarity);
        
        FaceTestResponse.FaceTestResponseBuilder responseBuilder = FaceTestResponse.builder()
            .isMatch(isMatch)
            .confidence(confidence) // Keep as decimal for consistency
            .message(message)
            .matchedFaceRecognitionId(faceRecognition.getId());
        
        if (isMatch) {
            responseBuilder.pegawai(convertToPegawaiResponse(faceRecognition.getPegawai()));
        }
        
        return responseBuilder.build();
    }
    
    private FaceTestResponse testAgainstSpecificFaceRecognition(FaceTestRequest request) {
        log.info("Testing against specific face recognition ID: {}", request.getTargetFaceRecognitionId());
        
        Optional<FaceRecognition> faceRecognitionOpt = faceRecognitionRepository.findById(request.getTargetFaceRecognitionId());
        
        if (!faceRecognitionOpt.isPresent()) {
            log.warn("Face recognition not found for ID: {}", request.getTargetFaceRecognitionId());
            return FaceTestResponse.builder()
                .isMatch(false)
                .confidence(0.0)
                .message("Face recognition data tidak ditemukan")
                .build();
        }
        
        FaceRecognition faceRecognition = faceRecognitionOpt.get();
        if (faceRecognition.getFaceDescriptors() == null || faceRecognition.getFaceDescriptors().trim().isEmpty()) {
            log.warn("No face descriptors found for face recognition ID: {}", request.getTargetFaceRecognitionId());
            return FaceTestResponse.builder()
                .isMatch(false)
                .confidence(0.0)
                .message("Tidak ada data face descriptor untuk dibandingkan")
                .build();
        }
        
        log.info("Found stored descriptors for pegawai: {}", faceRecognition.getPegawai().getNamaLengkap());
        log.debug("Stored descriptors JSON length: {}", faceRecognition.getFaceDescriptors().length());
        
        // Parse stored descriptors and compare
    double similarity = calculateSimilarity(request.getFaceDescriptor(), faceRecognition.getFaceDescriptors());
    double confidence = similarity; // [0..1]
    boolean isMatch = similarity >= specificConfidenceThreshold;
        
        log.info("=== FACE RECOGNITION TEST RESULT ===");
    log.info("Similarity: {}", similarity);
    log.info("Confidence: {}%", confidence * 100);
    log.info("Threshold (specific): {}", specificConfidenceThreshold);
    log.info("Is Match: {} (similarity {} >= {})", isMatch, similarity, specificConfidenceThreshold);
        log.info("===================================");
        
        String message = isMatch 
            ? String.format("Wajah berhasil dikenali dengan confidence %.1f%%", confidence * 100)
            : String.format("Wajah tidak dikenali. Confidence: %.1f%%", confidence * 100);
        
    log.info("Face recognition test result: match={}, confidence={}%, similarity={}", isMatch, confidence * 100, similarity);
        
        FaceTestResponse.FaceTestResponseBuilder responseBuilder = FaceTestResponse.builder()
            .isMatch(isMatch)
            .confidence(confidence) // already decimal
            .message(message)
            .matchedFaceRecognitionId(faceRecognition.getId());
        
        if (isMatch) {
            responseBuilder.pegawai(convertToPegawaiResponse(faceRecognition.getPegawai()));
        }
        
        return responseBuilder.build();
    }
    
    private FaceTestResponse testAgainstAllFaceRecognitions(FaceTestRequest request) {
        // Get all active face recognitions
        List<FaceRecognition> allFaceRecognitions = faceRecognitionRepository.findByStatus(FaceRecognitionStatus.ACTIVE);
        
        if (allFaceRecognitions.isEmpty()) {
            return FaceTestResponse.builder()
                .isMatch(false)
                .confidence(0.0)
                .message("Tidak ada data face recognition yang tersedia")
                .build();
        }
        
        double maxSimilarity = 0.0;
        FaceRecognition bestMatch = null;
        
        // Compare against all face recognitions
        for (FaceRecognition faceRecognition : allFaceRecognitions) {
            if (faceRecognition.getFaceDescriptors() == null || faceRecognition.getFaceDescriptors().trim().isEmpty()) {
                continue;
            }
            
            double similarity = calculateSimilarity(request.getFaceDescriptor(), faceRecognition.getFaceDescriptors());
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                bestMatch = faceRecognition;
            }
        }
        
        // Convert similarity to distance for threshold comparison
    double confidence = maxSimilarity; // [0..1]
    boolean isMatch = maxSimilarity >= globalConfidenceThreshold;
        
        log.info("=== FACE RECOGNITION ALL TEST RESULT ===");
    log.info("Max Similarity: {}", maxSimilarity);
    log.info("Confidence: {}%", confidence * 100);
    log.info("Threshold (global): {}", globalConfidenceThreshold);
    log.info("Is Match: {} (similarity {} >= {})", isMatch, maxSimilarity, globalConfidenceThreshold);
        log.info("Best Match: {}", bestMatch != null ? bestMatch.getPegawai().getNamaLengkap() : "None");
        log.info("=======================================");
        
        String message = isMatch 
            ? String.format("Wajah berhasil dikenali dengan confidence %.1f%%", confidence * 100)
            : String.format("Wajah tidak dikenali. Confidence: %.1f%%", confidence * 100);
        
        FaceTestResponse.FaceTestResponseBuilder responseBuilder = FaceTestResponse.builder()
            .isMatch(isMatch)
            .confidence(confidence) // decimal [0..1]
            .message(message);
        
        if (isMatch && bestMatch != null) {
            responseBuilder
                .pegawai(convertToPegawaiResponse(bestMatch.getPegawai()))
                .matchedFaceRecognitionId(bestMatch.getId());
        }
        
        return responseBuilder.build();
    }
    
    private double calculateSimilarity(double[] inputDescriptor, String storedDescriptorsJson) {
        try {
            log.debug("Calculating similarity for input descriptor length: {}", inputDescriptor.length);
            log.debug("Stored descriptors JSON: {}", storedDescriptorsJson);
            
            // Try to parse as MediaPipe structure first (array of descriptor objects)
            try {
                FaceDescriptorDto[] descriptorObjects = objectMapper.readValue(storedDescriptorsJson, FaceDescriptorDto[].class);
                
                double minDistance = Double.MAX_VALUE;
                
                // Compare against each stored descriptor using Euclidean distance (same as frontend)
                for (FaceDescriptorDto descriptorObj : descriptorObjects) {
                    if (descriptorObj.getDescriptor() != null) {
                        double[] storedDescriptor = descriptorObj.getDescriptor();
                        double distance = euclideanDistance(inputDescriptor, storedDescriptor);
                        minDistance = Math.min(minDistance, distance);
                        log.debug("Distance to descriptor {}: {}", descriptorObj.getPosition(), distance);
                    }
                }
                
                // Convert distance to similarity (lower distance = higher similarity)
                // Use same threshold logic as frontend (0.65 threshold)
                double similarity = Math.max(0.0, 1.0 - (minDistance / 2.0)); // Normalize distance to similarity
                log.debug("Final similarity score: {}", similarity);
                return similarity;
                
            } catch (Exception e) {
                log.warn("Failed to parse as MediaPipe structure, trying legacy format: {}", e.getMessage());
                
                // Fallback to legacy format (simple double array)
                double[][] storedDescriptors = objectMapper.readValue(storedDescriptorsJson, double[][].class);
                
                double minDistance = Double.MAX_VALUE;
                
                for (double[] storedDescriptor : storedDescriptors) {
                    double distance = euclideanDistance(inputDescriptor, storedDescriptor);
                    minDistance = Math.min(minDistance, distance);
                }
                
                return Math.max(0.0, 1.0 - (minDistance / 2.0));
            }
            
        } catch (Exception e) {
            log.error("Error calculating similarity: ", e);
            return 0.0;
        }
    }
    
    private double euclideanDistance(double[] desc1, double[] desc2) {
        if (desc1.length != desc2.length) {
            log.warn("Descriptor length mismatch: {} vs {}", desc1.length, desc2.length);
            return Double.MAX_VALUE;
        }
        
        double distance = 0.0;
        int minLength = Math.min(desc1.length, desc2.length);
        
        for (int i = 0; i < minLength; i++) {
            distance += Math.pow(desc1[i] - desc2[i], 2);
        }
        
        return Math.sqrt(distance);
    }
    
    // DTO for MediaPipe descriptor structure
    public static class FaceDescriptorDto {
        private String position;
        private String stepId;
        private double[] descriptor;
        private int landmarks;
        
        // Getters and setters
        public String getPosition() { return position; }
        public void setPosition(String position) { this.position = position; }
        
        public String getStepId() { return stepId; }
        public void setStepId(String stepId) { this.stepId = stepId; }
        
        public double[] getDescriptor() { return descriptor; }
        public void setDescriptor(double[] descriptor) { this.descriptor = descriptor; }
        
        public int getLandmarks() { return landmarks; }
        public void setLandmarks(int landmarks) { this.landmarks = landmarks; }
    }
    
    private PegawaiResponse convertToPegawaiResponse(Pegawai pegawai) {
        return PegawaiResponse.from(pegawai);
    }
}
