package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String token;
    private String tokenType = "Bearer";
    private UserSummaryDto user;
    private long expiresIn; // Token expiration time in seconds
    
    public AuthResponse(String token, UserSummaryDto user, long expiresIn) {
        this.token = token;
        this.user = user;
        this.expiresIn = expiresIn;
    }
}
