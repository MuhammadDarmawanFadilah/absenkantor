package com.shadcn.backend.repository;

import com.shadcn.backend.model.FileKategori;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileKategoriRepository extends JpaRepository<FileKategori, Long> {
    
    // Find by name (case insensitive)
    Optional<FileKategori> findByNamaIgnoreCase(String nama);
    
    // Find all active categories ordered by sort order and name
    List<FileKategori> findByIsActiveTrueOrderBySortOrderAscNamaAsc();
    
    // Search with pagination and filtering - derived queries
    Page<FileKategori> findByNamaContainingIgnoreCaseOrderBySortOrderAscNamaAsc(String nama, Pageable pageable);
    Page<FileKategori> findByIsActiveOrderBySortOrderAscNamaAsc(Boolean isActive, Pageable pageable);
    Page<FileKategori> findByNamaContainingIgnoreCaseAndIsActiveOrderBySortOrderAscNamaAsc(String nama, Boolean isActive, Pageable pageable);
    Page<FileKategori> findAllByOrderBySortOrderAscNamaAsc(Pageable pageable);
    
    // Check if name exists (for validation, excluding current id)
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
    
    // Count active categories
    long countByIsActiveTrue();
}
