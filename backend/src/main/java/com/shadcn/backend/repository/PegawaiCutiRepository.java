package com.shadcn.backend.repository;

import com.shadcn.backend.model.PegawaiCuti;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PegawaiCutiRepository extends JpaRepository<PegawaiCuti, Long> {
    
    List<PegawaiCuti> findByPegawaiIdAndIsActive(Long pegawaiId, Boolean isActive);
    
    List<PegawaiCuti> findByPegawaiIdAndTahunAndIsActive(Long pegawaiId, Integer tahun, Boolean isActive);
    
    Optional<PegawaiCuti> findByPegawaiIdAndJenisCutiIdAndTahunAndIsActive(
        Long pegawaiId, Long jenisCutiId, Integer tahun, Boolean isActive);
    
    Optional<PegawaiCuti> findByPegawaiIdAndJenisCutiIdAndTahun(
        Long pegawaiId, Long jenisCutiId, Integer tahun);
    
    @Query("SELECT pc FROM PegawaiCuti pc JOIN FETCH pc.jenisCuti " +
           "WHERE pc.pegawai.id = :pegawaiId AND pc.tahun = :tahun AND pc.isActive = true " +
           "ORDER BY pc.jenisCuti.namaCuti")
    List<PegawaiCuti> findPegawaiCutiWithJenisCuti(@Param("pegawaiId") Long pegawaiId, 
                                                   @Param("tahun") Integer tahun);
    
    void deleteByPegawaiIdAndJenisCutiIdAndTahun(Long pegawaiId, Long jenisCutiId, Integer tahun);
}
