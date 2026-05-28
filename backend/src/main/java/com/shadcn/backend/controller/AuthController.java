package com.shadcn.backend.controller;

import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.dto.LoginRequest;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.LoginAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginAuditService loginAuditService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            log.debug("Login attempt for username: {}", loginRequest.getUsername());
            
            AuthResponse authResponse = authService.authenticate(loginRequest.getUsername(), loginRequest.getPassword());
            
            // Record successful login
            loginAuditService.recordSuccessfulLogin(
                loginRequest.getUsername(),
                authResponse.getUser().getFullName(),
                authResponse.getUser().getRole() != null ? authResponse.getUser().getRole().getRoleName() : "PEGAWAI",
                request
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", authResponse.getToken());
            response.put("user", authResponse.getUser());
            response.put("expiresIn", authResponse.getExpiresIn());
            
            log.info("Login successful for user: {}", loginRequest.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Login failed for username: {}", loginRequest.getUsername(), e);
            
            // Record failed login
            loginAuditService.recordFailedLogin(loginRequest.getUsername(), request);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Login failed");
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("Invalid authorization header");
            }
            
            String token = authHeader.substring(7);
            AuthResponse authResponse = authService.refreshToken(token);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", authResponse.getToken());
            response.put("user", authResponse.getUser());
            response.put("expiresIn", authResponse.getExpiresIn());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Token refresh failed");
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("Invalid authorization header");
            }
            
            String token = authHeader.substring(7);
            authService.logout(token);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Logout successful");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Logout failed", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Logout failed");
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("Invalid authorization header");
            }
            
            String token = authHeader.substring(7);
            var pegawai = authService.getCurrentPegawai(token);
            
            if (pegawai == null) {
                throw new RuntimeException("Invalid token");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("user", authService.convertPegawaiToUserSummary(pegawai));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Get current user failed", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Get current user failed");
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }
}