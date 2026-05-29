package com.example.projet2024.Security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Qui peut modifier les rôles des utilisateurs (écran Utilisateurs).
 */
public final class RoleAuthorization {

    private RoleAuthorization() {
    }

    public static boolean canManageUserRoles(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_SUPER_ADMIN".equals(role) || "ROLE_ADMINISTRATEUR".equals(role)) {
                return true;
            }
        }
        return false;
    }
}
