package com.shadcn.backend.repository;

import com.shadcn.backend.model.LoginAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {
    
    // Count successful logins by month
    @Query("SELECT COUNT(la) FROM LoginAudit la WHERE la.status = 'SUCCESS' AND YEAR(la.createdAt) = :year AND MONTH(la.createdAt) = :month")
    Long countSuccessfulLoginsByYearAndMonth(@Param("year") int year, @Param("month") int month);
    
    // Count total logins by month
    @Query("SELECT COUNT(la) FROM LoginAudit la WHERE YEAR(la.createdAt) = :year AND MONTH(la.createdAt) = :month")
    Long countByCreatedAtYearAndMonth(@Param("year") int year, @Param("month") int month);
    
    // Find recent logins
    List<LoginAudit> findTop10ByStatusOrderByCreatedAtDesc(LoginAudit.LoginStatus status);
    
    // Find logins by username
    List<LoginAudit> findByUsernameOrderByCreatedAtDesc(String username);
    
    // Find logins by date range
    List<LoginAudit> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Count daily logins for a specific month
    @Query("SELECT DAY(la.createdAt), COUNT(la) FROM LoginAudit la WHERE YEAR(la.createdAt) = :year AND MONTH(la.createdAt) = :month GROUP BY DAY(la.createdAt) ORDER BY DAY(la.createdAt)")
    List<Object[]> getDailyLoginCountForMonth(@Param("year") int year, @Param("month") int month);
    
    // Count by status and created after date
    Long countByStatusAndCreatedAtAfter(LoginAudit.LoginStatus status, LocalDateTime createdAt);
}
