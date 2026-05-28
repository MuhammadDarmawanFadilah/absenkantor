package com.shadcn.backend.repository;

import com.shadcn.backend.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    Optional<Role> findByRoleName(String roleName);
    
    boolean existsByRoleName(String roleName);
    
    @Query("SELECT r FROM Role r ORDER BY r.roleName")
    List<Role> findAllOrderByName();
    
    @Query("SELECT r FROM Role r WHERE r.roleName LIKE %:name% ORDER BY r.roleName")
    List<Role> findByRoleNameContainingIgnoreCase(String name);
    
    Page<Role> findByRoleNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
        String roleName, String description, Pageable pageable);
}
