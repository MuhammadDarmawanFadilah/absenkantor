package com.shadcn.backend.repository;

import com.shadcn.backend.model.HariLibur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HariLiburRepository extends JpaRepository<HariLibur, Long> {
    
    Page<HariLibur> findByIsActiveTrueOrderByTanggalLiburAsc(Pageable pageable);
    
    List<HariLibur> findByTahunLiburAndIsActiveTrueOrderByTanggalLiburAsc(Integer tahun);
    
    List<HariLibur> findByBulanLiburAndTahunLiburAndIsActiveTrueOrderByTanggalLiburAsc(Integer bulan, Integer tahun);
    
    Optional<HariLibur> findByTanggalLiburAndIsActiveTrue(LocalDate tanggalLibur);
    
    boolean existsByTanggalLiburAndIsActiveTrue(LocalDate tanggalLibur);
    
    List<HariLibur> findByTanggalLiburBetweenAndIsActiveTrue(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT h FROM HariLibur h WHERE h.isActive = true AND " +
           "(:namaLibur IS NULL OR LOWER(h.namaLibur) LIKE LOWER(CONCAT('%', :namaLibur, '%'))) AND " +
           "(:tahun IS NULL OR h.tahunLibur = :tahun) AND " +
           "(:bulan IS NULL OR h.bulanLibur = :bulan) " +
           "ORDER BY h.tanggalLibur ASC")
    Page<HariLibur> findWithFilters(@Param("namaLibur") String namaLibur,
                                   @Param("tahun") Integer tahun,
                                   @Param("bulan") Integer bulan,
                                   Pageable pageable);
    
    @Query("SELECT COUNT(h) FROM HariLibur h WHERE h.tahunLibur = :tahun AND h.isActive = true")
    Long countByTahunLibur(@Param("tahun") Integer tahun);
    
    void deleteByTahunLiburAndIsNasionalTrue(Integer tahun);
    
    void deleteByTahunLibur(Integer tahun);
    
    void deleteByTahunLiburAndIsNasionalFalseAndNamaLiburContaining(Integer tahun, String namaLibur);
    
    boolean existsByTanggalLiburAndIsNasionalTrueAndIsActiveTrue(LocalDate tanggalLibur);
}
