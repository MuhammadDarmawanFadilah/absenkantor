package com.shadcn.backend.repository;

import com.shadcn.backend.entity.LokasiKantor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LokasiKantorRepository extends JpaRepository<LokasiKantor, Long> {
}
