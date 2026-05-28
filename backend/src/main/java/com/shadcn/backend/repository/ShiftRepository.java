package com.shadcn.backend.repository;

import com.shadcn.backend.entity.Shift;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    
    // Find by nama
    Optional<Shift> findByNamaShiftIgnoreCase(String namaShift);
    
    // Check if nama exists
    boolean existsByNamaShiftIgnoreCase(String namaShift);
    
    // Find active shifts
    List<Shift> findByIsActiveTrueOrderByNamaShiftAsc();
    
    // Find all ordered
    List<Shift> findAllByOrderByNamaShiftAsc();
    
    // Search with pagination
    @Query("SELECT s FROM Shift s WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(s.namaShift) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.deskripsi) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.lockLokasi) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Shift> findBySearchTerm(@Param("search") String search, Pageable pageable);
}
