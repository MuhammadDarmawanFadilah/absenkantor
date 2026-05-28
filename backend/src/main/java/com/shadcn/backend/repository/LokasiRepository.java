package com.shadcn.backend.repository;

import com.shadcn.backend.model.Lokasi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LokasiRepository extends JpaRepository<Lokasi, Long> {
    
    // Find by nama
    Optional<Lokasi> findByNamaLokasiIgnoreCase(String namaLokasi);
    
    // Check if nama exists
    boolean existsByNamaLokasiIgnoreCase(String namaLokasi);
    
    // Find active locations
    List<Lokasi> findByIsActiveTrueOrderByNamaLokasiAsc();
    
    // Find all ordered
    List<Lokasi> findAllByOrderByNamaLokasiAsc();
    
    // Search with pagination
    @Query("SELECT l FROM Lokasi l WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(l.namaLokasi) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.alamat) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.status) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Lokasi> findBySearchTerm(@Param("search") String search, Pageable pageable);
}
