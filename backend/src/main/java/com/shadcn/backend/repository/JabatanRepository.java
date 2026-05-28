package com.shadcn.backend.repository;

import com.shadcn.backend.model.Jabatan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JabatanRepository extends JpaRepository<Jabatan, Long> {
    
    @Query("SELECT j FROM Jabatan j WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(j.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(j.deskripsi) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Jabatan> findBySearchTerm(@Param("search") String search, Pageable pageable);
    
    List<Jabatan> findByIsActiveTrueOrderByNamaAsc();
    
    List<Jabatan> findAllByOrderByNamaAsc();
    
    Optional<Jabatan> findByNamaIgnoreCase(String nama);
    
    boolean existsByNamaIgnoreCase(String nama);
    
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
}
