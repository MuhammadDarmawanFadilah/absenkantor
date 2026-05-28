package com.shadcn.backend.repository;

import com.shadcn.backend.entity.FaceRecognition;
import com.shadcn.backend.entity.FaceRecognition.FaceRecognitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaceRecognitionRepository extends JpaRepository<FaceRecognition, Long> {
    
    // Find by pegawai ID
    Optional<FaceRecognition> findByPegawaiId(Long pegawaiId);
    
    // Find by pegawai ID and status
    Optional<FaceRecognition> findByPegawaiIdAndStatus(Long pegawaiId, FaceRecognitionStatus status);
    
    // Check if pegawai already has face recognition
    boolean existsByPegawaiId(Long pegawaiId);
    
    // Find by status
    List<FaceRecognition> findByStatus(FaceRecognitionStatus status);
    
    // Search with pagination
    @Query("SELECT fr FROM FaceRecognition fr WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(fr.pegawai.namaLengkap) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(fr.pegawai.nip) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR fr.status = :status)")
    Page<FaceRecognition> findWithFilters(@Param("search") String search,
                                          @Param("status") FaceRecognitionStatus status,
                                          Pageable pageable);
    
    // Count by status
    long countByStatus(FaceRecognitionStatus status);
    
    // Get average confidence
    @Query("SELECT AVG(fr.faceConfidence) FROM FaceRecognition fr WHERE fr.faceConfidence IS NOT NULL")
    Double getAverageConfidence();
    
    // Find all active face recognitions for matching
    @Query("SELECT fr FROM FaceRecognition fr WHERE fr.status = 'ACTIVE' AND fr.faceEncoding IS NOT NULL")
    List<FaceRecognition> findAllActiveWithEncoding();
    
    // Get pegawai IDs that already have face recognition
    @Query("SELECT fr.pegawai.id FROM FaceRecognition fr")
    List<Long> findAllPegawaiIdsWithFaceRecognition();
}
