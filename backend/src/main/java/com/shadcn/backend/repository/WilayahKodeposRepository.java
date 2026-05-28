package com.shadcn.backend.repository;

import com.shadcn.backend.entity.WilayahKodepos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WilayahKodeposRepository extends JpaRepository<WilayahKodepos, String> {
    
    @Query("SELECT w.kodepos FROM WilayahKodepos w WHERE w.kode = :kodeWilayah")
    Optional<String> findKodeposByKodeWilayah(@Param("kodeWilayah") String kodeWilayah);
}
