package com.stockpilot.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7).trim();
                if (jwtUtil.validateToken(token)) {
                    Claims claims = jwtUtil.extractClaims(token);
                    Long businessId = claims.get("businessId", Long.class);
                    Long userId = claims.get("userId", Long.class);
                    String email = claims.getSubject();
                    String role = claims.get("role", String.class);

                    TenantContext.setCurrentBusinessId(businessId);
                    TenantContext.setCurrentUserId(userId);
                    TenantContext.setCurrentUserEmail(email);
                    TenantContext.setCurrentUserRole(role != null ? role : "OWNER");

                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "OWNER"));
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            email, null, Collections.singletonList(authority)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
