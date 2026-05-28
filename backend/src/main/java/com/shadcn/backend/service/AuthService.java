package com.shadcn.backend.service;

import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.dto.UserSummaryDto;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final PegawaiRepository pegawaiRepository;
    private final PasswordEncoder passwordEncoder;
      public AuthResponse authenticate(String username, String password) {
        log.debug("Attempting authentication for username: {}", username);
        
        // Try to find pegawai by username
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findByUsername(username);
        
        // If not found by username, try finding by NIP
        if (!pegawaiOpt.isPresent()) {
            pegawaiOpt = pegawaiRepository.findByNip(username);
        }
        
        if (pegawaiOpt.isPresent()) {
            Pegawai pegawai = pegawaiOpt.get();
            
            if (!passwordEncoder.matches(password, pegawai.getPassword())) {
                log.warn("Invalid password for pegawai: {}", username);
                throw new RuntimeException("Invalid password");
            }
            
            if (!pegawai.getIsActive()) {
                log.warn("Inactive pegawai attempted login: {}", username);
                throw new RuntimeException("Pegawai account is not active");
            }
            
            // Generate permanent token based on pegawai data
            String token = generatePermanentTokenForPegawai(pegawai);
            
            // Convert Pegawai to UserSummaryDto for compatibility
            UserSummaryDto userSummary = convertPegawaiToUserSummary(pegawai);
            
            log.info("Authentication successful for pegawai: {}", username);
            return new AuthResponse(token, userSummary, Long.MAX_VALUE); // Never expires
        }
        
        log.warn("Pegawai not found: {}", username);
        throw new RuntimeException("Pegawai not found");
    }
      /**
     * Extract pegawai ID from permanent token - simplified version
     */
    public Long getUserIdFromToken(String token) {
        try {
            log.debug("Extracting user ID from token. Token length: {}", token != null ? token.length() : 0);
            
            if (token == null || token.trim().isEmpty()) {
                log.warn("Token is null or empty");
                return null;
            }
            
            // Decode the token and extract pegawai ID
            String decoded;
            try {
                decoded = new String(Base64.getDecoder().decode(token));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid Base64 token format: {}", e.getMessage());
                return null;
            }
            
            log.debug("Decoded token content: {}", decoded);
            
            String[] parts = decoded.split(":");
            if (parts.length >= 2) {
                String userIdStr = parts[0];
                // Remove P prefix if exists
                if (userIdStr.startsWith("P")) {
                    userIdStr = userIdStr.substring(1);
                }
                
                try {
                    Long userId = Long.parseLong(userIdStr);
                    log.debug("Extracted user ID: {}", userId);
                    return userId;
                } catch (NumberFormatException e) {
                    log.warn("Invalid user ID format in token: {}", userIdStr);
                    return null;
                }
            } else {
                log.warn("Token format invalid: expected at least 2 parts, got {}", parts.length);
                return null;
            }
        } catch (Exception e) {
            log.error("Failed to extract user ID from token: {}", e.getMessage());
            return null;
        }
    }
      /**
     * Get pegawai from token - validate against database
     */
    public Pegawai getPegawaiFromToken(String token) {
        Long pegawaiId = getUserIdFromToken(token);
        if (pegawaiId == null) {
            log.warn("Invalid token format for pegawai lookup");
            return null;
        }
        
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(pegawaiId);
        if (pegawaiOpt.isEmpty()) {
            log.warn("Pegawai not found for token: {}", pegawaiId);
            return null;
        }
        
        Pegawai pegawai = pegawaiOpt.get();
        
        // Validate token signature
        String expectedToken = generatePermanentTokenForPegawai(pegawai);
        if (!token.equals(expectedToken)) {
            log.warn("Token signature mismatch for pegawai: {}", pegawaiId);
            return null;
        }
        
        // Check if pegawai is still active
        if (!pegawai.getIsActive()) {
            log.warn("Pegawai not active: {}", pegawaiId);
            return null;
        }
        
        return pegawai;
    }
      public AuthResponse refreshToken(String oldToken) {
        // First try full validation
        Pegawai pegawai = getPegawaiFromToken(oldToken);
        
        // If signature mismatch (e.g. password changed), try recovery via pegawai ID + username
        if (pegawai == null) {
            pegawai = getPegawaiFromTokenLoose(oldToken);
            if (pegawai != null) {
                log.info("Token refresh recovery success for pegawai: {}", pegawai.getUsername());
            }
        }
        
        if (pegawai == null) {
            log.warn("Invalid token for refresh");
            throw new RuntimeException("Invalid token");
        }
        
        // Generate new token (always regenerate with current password hash)
        String newToken = generatePermanentTokenForPegawai(pegawai);
        
        // Convert Pegawai to UserSummaryDto
        UserSummaryDto userSummary = convertPegawaiToUserSummary(pegawai);
        
        log.debug("Token refreshed for pegawai: {}", pegawai.getUsername());
        return new AuthResponse(newToken, userSummary, Long.MAX_VALUE);
    }
    
    public void logout(String token) {
        // For permanent tokens, we don't need to track logout
        // Token validation will always check against database
    }
    
    /**
     * Check if pegawai is admin by pegawai ID
     */
    public boolean isAdmin(Long pegawaiId) {
        if (pegawaiId == null) {
            return false;
        }
        
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(pegawaiId);
        if (pegawaiOpt.isPresent()) {
            // Check if pegawai has admin role based on role field or isAdmin field
            Pegawai pegawai = pegawaiOpt.get();
            return pegawai.getIsAdmin() != null && "true".equals(pegawai.getIsAdmin().toLowerCase());
        }
        
        return false;
    }
    
    /**
     * Get current pegawai from token if token belongs to pegawai
     */
    public Pegawai getCurrentPegawai(String token) {
        return getPegawaiFromToken(token);
    }
    
    /**
     * Find pegawai by username - used for cross-table user lookup
     */
    public Pegawai findPegawaiByUsername(String username) {
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findByUsername(username);
        if (pegawaiOpt.isPresent() && pegawaiOpt.get().getIsActive()) {
            return pegawaiOpt.get();
        }
        return null;
    }
    
    /**
     * Loose token validation - only checks ID + username, not password signature.
     * Used for token refresh recovery when password has changed.
     */
    private Pegawai getPegawaiFromTokenLoose(String token) {
        try {
            Long pegawaiId = getUserIdFromToken(token);
            if (pegawaiId == null) return null;

            Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(pegawaiId);
            if (pegawaiOpt.isEmpty()) return null;

            Pegawai pegawai = pegawaiOpt.get();
            if (!pegawai.getIsActive()) return null;

            // Validate that username in token matches DB
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            if (parts.length >= 2 && !parts[1].equals(pegawai.getUsername())) {
                log.warn("Token username mismatch for pegawai: {}", pegawaiId);
                return null;
            }
            return pegawai;
        } catch (Exception e) {
            log.warn("Error in loose token validation: {}", e.getMessage());
            return null;
        }
    }

    private String generatePermanentTokenForPegawai(Pegawai pegawai) {
        // Generate deterministic permanent token based on pegawai data
        // This ensures same token for same pegawai across server restarts
        String passwordSubstring = pegawai.getPassword().length() >= 10 ? 
            pegawai.getPassword().substring(0, 10) : pegawai.getPassword();
        String tokenData = "P" + pegawai.getId() + ":" + pegawai.getUsername() + ":" + passwordSubstring;
        
        return Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
    
    public UserSummaryDto convertPegawaiToUserSummary(Pegawai pegawai) {
        UserSummaryDto userSummary = new UserSummaryDto();
        userSummary.setId(pegawai.getId());
        userSummary.setUsername(pegawai.getUsername());
        userSummary.setFullName(pegawai.getNamaLengkap());
        userSummary.setEmail(pegawai.getEmail());
        userSummary.setPhoneNumber(pegawai.getNoTelp());
        
        // Convert Pegawai isActive to String status for compatibility
        if (pegawai.getIsActive()) {
            userSummary.setStatus("ACTIVE");
        } else {
            userSummary.setStatus("INACTIVE");
        }
        
        // Create a role DTO using the actual role from pegawai, not hardcoded
        UserSummaryDto.RoleDto roleDto = new UserSummaryDto.RoleDto();
        roleDto.setRoleId(999L); // Special ID for compatibility
        // Use the actual role from pegawai instead of hardcoded "PEGAWAI"
        String actualRole = pegawai.getRole() != null ? pegawai.getRole() : "PEGAWAI";
        roleDto.setRoleName(actualRole);
        roleDto.setDescription(getRoleDescription(actualRole));
        userSummary.setRole(roleDto);
        
        userSummary.setCreatedAt(pegawai.getCreatedAt());
        userSummary.setUpdatedAt(pegawai.getUpdatedAt());
        return userSummary;
    }
    
    /**
     * Get role description based on role name
     */
    private String getRoleDescription(String roleName) {
        switch (roleName) {
            case "ADMIN":
                return "Administrator dengan akses penuh ke sistem";
            case "VERIFICATOR":
                return "Verificator dengan akses terbatas";
            case "SUPERVISOR":
                return "Supervisor dengan akses pengawasan";
            case "PEGAWAI":
            default:
                return "Pegawai Sistem";
        }
    }
}
