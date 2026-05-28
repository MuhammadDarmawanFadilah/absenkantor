package com.shadcn.backend.repository;

import com.shadcn.backend.entity.PemotonganAbsen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PemotonganAbsenRepository extends JpaRepository<PemotonganAbsen, Long> {
    
    @Query("SELECT p FROM PemotonganAbsen p WHERE p.isActive = true ORDER BY p.kode ASC")
    List<PemotonganAbsen> findAllActiveOrderByKode();
    
    Optional<PemotonganAbsen> findByKodeAndIsActive(String kode, Boolean isActive);
    
    @Query("SELECT COUNT(p) FROM PemotonganAbsen p WHERE p.isActive = true")
    long countActive();
}
