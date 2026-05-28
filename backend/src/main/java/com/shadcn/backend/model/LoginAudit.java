package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_audit", indexes = {
    @Index(name = "idx_login_audit_created", columnList = "createdAt"),
    @Index(name = "idx_login_audit_username", columnList = "username"),
    @Index(name = "idx_login_audit_year_month", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAudit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String username;
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(name = "user_role")
    private String userRole;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginStatus status;
    
    @Column(name = "login_timestamp", nullable = false)
    private LocalDateTime loginTimestamp;
    
    @Column(name = "logout_timestamp")
    private LocalDateTime logoutTimestamp;
    
    @Column(name = "session_duration")
    private Long sessionDuration; // in minutes
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public enum LoginStatus {
        SUCCESS,
        FAILED,
        LOGOUT
    }
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.loginTimestamp == null) {
            this.loginTimestamp = LocalDateTime.now();
        }
    }
}
