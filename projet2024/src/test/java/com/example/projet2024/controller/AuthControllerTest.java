package com.example.projet2024.controller;

import com.example.projet2024.Security.Jwt.AuthEntryPointJwt;
import com.example.projet2024.Security.Jwt.JwtUtils;
import com.example.projet2024.Security.Services.UserDetailsServiceImpl;
import com.example.projet2024.service.EmailService;
import com.example.projet2024.service.UserService;
import com.example.projet2024.service.auth.GoogleIdTokenVerifierService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration (couche web) — authentification.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private EmailService emailService;

    @MockBean
    private PasswordEncoder encoder;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private GoogleIdTokenVerifierService googleIdTokenVerifierService;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private AuthEntryPointJwt unauthorizedHandler;

    @Test
    @DisplayName("POST /api/auth/signin — connexion réussie retourne un JWT")
    void signin_success() throws Exception {
        when(userService.login("admin@test.com", "Test1234!")).thenReturn("jwt-token-test");

        String body = """
                {"email":"admin@test.com","password":"Test1234!"}
                """;

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-test"));
    }

    @Test
    @DisplayName("POST /api/auth/signin — mauvais identifiants → 401")
    void signin_badCredentials() throws Exception {
        when(userService.login(anyString(), anyString()))
                .thenThrow(new BadCredentialsException("bad"));

        String body = """
                {"email":"wrong@test.com","password":"Wrong123!"}
                """;

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register — mot de passe faible → 400")
    void register_weakPassword() throws Exception {
        when(userService.existsByEmail(anyString())).thenReturn(false);

        String body = """
                {
                  "email": "new@test.com",
                  "password": "weak",
                  "role": "ROLE_COMMERCIAL"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register — inscription valide → 200")
    void register_success() throws Exception {
        when(userService.existsByEmail("new@test.com")).thenReturn(false);
        when(encoder.encode(anyString())).thenReturn("encoded");
        doNothing().when(userService).saveUser(any());
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString());

        String body = """
                {
                  "email": "new@test.com",
                  "password": "Test1234!",
                  "role": "ROLE_COMMERCIAL",
                  "firstname": "Test",
                  "lastname": "User"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.emailSent").value(true));
    }
}
