package com.shadcn.backend.filter;

import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.model.Pegawai;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        
        try {
            Pegawai pegawai = authService.getPegawaiFromToken(jwt);
            
            if (pegawai != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Create authorities based on pegawai role
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                
                // Add role-based authorities
                String role = pegawai.getRole() != null ? pegawai.getRole() : "PEGAWAI";
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                authorities.add(new SimpleGrantedAuthority("ROLE_USER")); // All pegawai have USER role
                
                // Add permission-based authorities
                switch (role) {
                    case "ADMIN":
                        authorities.add(new SimpleGrantedAuthority("pegawai.read"));
                        authorities.add(new SimpleGrantedAuthority("pegawai.write"));
                        authorities.add(new SimpleGrantedAuthority("pegawai.delete"));
                        break;
                    case "VERIFICATOR":
                        authorities.add(new SimpleGrantedAuthority("pegawai.read"));
                        authorities.add(new SimpleGrantedAuthority("pegawai.write"));
                        break;
                    default:
                        authorities.add(new SimpleGrantedAuthority("pegawai.read"));
                        break;
                }

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        pegawai, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                log.debug("Successfully authenticated pegawai: {} with role: {}", pegawai.getUsername(), role);
            }
        } catch (Exception e) {
            log.debug("Failed to authenticate token: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}