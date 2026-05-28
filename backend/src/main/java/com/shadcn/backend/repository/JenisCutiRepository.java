package com.shadcn.backend.repository;

import com.shadcn.backend.model.JenisCuti;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JenisCutiRepository extends JpaRepository<JenisCuti, Long> {
    
    Page<JenisCuti> findByIsActive(Boolean isActive, Pageable pageable);
    
    @Query("SELECT jc FROM JenisCuti jc WHERE jc.isActive = true AND " +
           "(:search IS NULL OR LOWER(jc.namaCuti) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(jc.deskripsi) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<JenisCuti> findBySearchAndActive(@Param("search") String search, Pageable pageable);
    
    List<JenisCuti> findByIsActiveOrderByNamaCuti(Boolean isActive);
    
    Optional<JenisCuti> findByNamaCutiAndIsActive(String namaCuti, Boolean isActive);
    
    @Query("SELECT CASE WHEN COUNT(jc) > 0 THEN true ELSE false END FROM JenisCuti jc " +
           "WHERE jc.namaCuti = :namaCuti AND jc.id != :excludeId AND jc.isActive = true")
    boolean existsByNamaCutiAndIdNotAndIsActive(@Param("namaCuti") String namaCuti, 
                                               @Param("excludeId") Long excludeId);
    
    @Query("SELECT DISTINCT jc FROM JenisCuti jc " +
           "INNER JOIN PegawaiCuti pc ON pc.jenisCuti.id = jc.id " +
           "WHERE jc.isActive = true AND pc.isActive = true AND pc.tahun = :tahun " +
           "ORDER BY jc.namaCuti")
    List<JenisCuti> findActiveJenisCutiForCurrentYear(@Param("tahun") Integer tahun);
}
