package com.shadcn.backend.service;

import com.shadcn.backend.model.LoginAudit;
import com.shadcn.backend.repository.LoginAuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginAuditService {
    
    private final LoginAuditRepository loginAuditRepository;
    
    @Transactional
    public void recordSuccessfulLogin(String username, String fullName, String role, HttpServletRequest request) {
        try {
            LoginAudit audit = LoginAudit.builder()
                .username(username)
                .fullName(fullName)
                .userRole(role)
                .ipAddress(getClientIpAddress(request))
                .userAgent(request.getHeader("User-Agent"))
                .status(LoginAudit.LoginStatus.SUCCESS)
                .loginTimestamp(LocalDateTime.now())
                .build();
            
            loginAuditRepository.save(audit);
            log.info("Login audit recorded for user: {}", username);
        } catch (Exception e) {
            log.error("Error recording login audit for user: {}", username, e);
        }
    }
    
    @Transactional
    public void recordFailedLogin(String username, HttpServletRequest request) {
        try {
            LoginAudit audit = LoginAudit.builder()
                .username(username)
                .userRole("UNKNOWN")
                .ipAddress(getClientIpAddress(request))
                .userAgent(request.getHeader("User-Agent"))
                .status(LoginAudit.LoginStatus.FAILED)
                .loginTimestamp(LocalDateTime.now())
                .build();
            
            loginAuditRepository.save(audit);
            log.info("Failed login audit recorded for user: {}", username);
        } catch (Exception e) {
            log.error("Error recording failed login audit for user: {}", username, e);
        }
    }
    
    @Transactional
    public void recordLogout(String username) {
        try {
            LoginAudit audit = LoginAudit.builder()
                .username(username)
                .status(LoginAudit.LoginStatus.LOGOUT)
                .logoutTimestamp(LocalDateTime.now())
                .build();
            
            loginAuditRepository.save(audit);
            log.info("Logout audit recorded for user: {}", username);
        } catch (Exception e) {
            log.error("Error recording logout audit for user: {}", username, e);
        }
    }
    
    public List<LoginAudit> getRecentLogins() {
        return loginAuditRepository.findTop10ByStatusOrderByCreatedAtDesc(LoginAudit.LoginStatus.SUCCESS);
    }
    
    public List<LoginAudit> getUserLoginHistory(String username) {
        return loginAuditRepository.findByUsernameOrderByCreatedAtDesc(username);
    }
    
    // Helper method to extract real IP address
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    // Method untuk menambahkan data sample login untuk dashboard
    @Transactional
    public void generateSampleLoginData() {
        try {
            // Generate some sample login data for the last 6 months
            LocalDateTime now = LocalDateTime.now();
            
            for (int monthsBack = 5; monthsBack >= 0; monthsBack--) {
                LocalDateTime targetMonth = now.minusMonths(monthsBack);
                
                // Generate 2-8 random logins per month
                int loginCount = 2 + (int)(Math.random() * 6);
                
                for (int i = 0; i < loginCount; i++) {
                    LocalDateTime loginTime = targetMonth.withDayOfMonth(1 + (int)(Math.random() * 28))
                        .withHour((int)(Math.random() * 24))
                        .withMinute((int)(Math.random() * 60));
                    
                    LoginAudit audit = LoginAudit.builder()
                        .username("admin" + (i % 3 + 1))
                        .fullName("Admin User " + (i % 3 + 1))
                        .userRole("ADMIN")
                        .ipAddress("192.168.1." + (100 + i))
                        .userAgent("Mozilla/5.0 Dashboard Access")
                        .status(LoginAudit.LoginStatus.SUCCESS)
                        .loginTimestamp(loginTime)
                        .build();
                    
                    // Manually set createdAt to the target month
                    audit.setCreatedAt(loginTime);
                    loginAuditRepository.save(audit);
                }
            }
            
            log.info("Sample login data generated successfully");
        } catch (Exception e) {
            log.error("Error generating sample login data", e);
        }
    }
}
