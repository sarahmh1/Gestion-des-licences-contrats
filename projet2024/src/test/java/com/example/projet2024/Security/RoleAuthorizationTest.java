package com.example.projet2024.Security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests unitaires — qui peut gérer les rôles utilisateurs.
 */
class RoleAuthorizationTest {

    @Test
    @DisplayName("Super Admin peut gérer les rôles")
    void canManageUserRoles_superAdmin() {
        Authentication auth = authWithRole("ROLE_SUPER_ADMIN");
        assertTrue(RoleAuthorization.canManageUserRoles(auth));
    }

    @Test
    @DisplayName("Administrateur peut gérer les rôles")
    void canManageUserRoles_administrateur() {
        Authentication auth = authWithRole("ROLE_ADMINISTRATEUR");
        assertTrue(RoleAuthorization.canManageUserRoles(auth));
    }

    @Test
    @DisplayName("Commercial ne peut pas gérer les rôles")
    void canManageUserRoles_commercialDenied() {
        Authentication auth = authWithRole("ROLE_COMMERCIAL");
        assertFalse(RoleAuthorization.canManageUserRoles(auth));
    }

    @Test
    @DisplayName("Utilisateur non authentifié refusé")
    void canManageUserRoles_unauthenticated() {
        assertFalse(RoleAuthorization.canManageUserRoles(null));
        Authentication notAuthenticated = new UsernamePasswordAuthenticationToken("user", "pwd", List.of());
        assertFalse(RoleAuthorization.canManageUserRoles(notAuthenticated));
    }

    private static Authentication authWithRole(String role) {
        return new UsernamePasswordAuthenticationToken(
                "user@test.com",
                "pwd",
                List.of(new SimpleGrantedAuthority(role))
        );
    }
}
