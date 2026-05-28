package com.shadcn.backend.repository;

import com.shadcn.backend.model.Pemotongan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface PemotonganRepository extends JpaRepository<Pemotongan, Long> {
    
    Page<Pemotongan> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);
    
    List<Pemotongan> findByPegawaiIdAndBulanPemotonganAndTahunPemotonganAndIsActiveTrue(
        Long pegawaiId, Integer bulan, Integer tahun);
    
    List<Pemotongan> findByBulanPemotonganAndTahunPemotonganAndIsActiveTrueOrderByCreatedAtDesc(
        Integer bulan, Integer tahun);
    
    List<Pemotongan> findByPegawaiIdAndIsActiveTrueOrderByTahunPemotonganDescBulanPemotonganDesc(
        Long pegawaiId);
    
    @Query("SELECT p FROM Pemotongan p JOIN p.pegawai pg WHERE p.isActive = true AND " +
           "(:namaPegawai IS NULL OR LOWER(pg.namaLengkap) LIKE LOWER(CONCAT('%', :namaPegawai, '%'))) AND " +
           "(:bulan IS NULL OR p.bulanPemotongan = :bulan) AND " +
           "(:tahun IS NULL OR p.tahunPemotongan = :tahun) " +
           "ORDER BY p.createdAt DESC")
    Page<Pemotongan> findWithFilters(@Param("namaPegawai") String namaPegawai,
                                    @Param("bulan") Integer bulan,
                                    @Param("tahun") Integer tahun,
                                    Pageable pageable);
    
    @Query("SELECT COUNT(p) FROM Pemotongan p WHERE p.bulanPemotongan = :bulan AND p.tahunPemotongan = :tahun AND p.isActive = true")
    Long countByBulanAndTahun(@Param("bulan") Integer bulan, @Param("tahun") Integer tahun);
    
    boolean existsByPegawaiIdAndBulanPemotonganAndTahunPemotonganAndIsActiveTrue(
        Long pegawaiId, Integer bulan, Integer tahun);
}
