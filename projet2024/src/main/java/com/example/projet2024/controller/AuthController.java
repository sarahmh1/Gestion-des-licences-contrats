package com.example.projet2024.controller;


import com.example.projet2024.DTO.ForgotPasswordRequest;
import com.example.projet2024.DTO.LoginRequest;
import com.example.projet2024.DTO.ResetPasswordCodeRequest;
import com.example.projet2024.Enum.Role_Enum;
import com.example.projet2024.Security.Jwt.JwtUtils;
import com.example.projet2024.entite.User;
import com.example.projet2024.service.EmailService;
import com.example.projet2024.service.UserService;
import com.example.projet2024.util.PasswordPolicy;
import com.example.projet2024.service.auth.GoogleIdTokenVerifierService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    private GoogleIdTokenVerifierService googleIdTokenVerifierService;

    @PostMapping("/signin")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            String jwt = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
            Map<String, String> response = new HashMap<>();
            response.put("token", jwt);
            return ResponseEntity.ok(response);
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message",
                    "Votre compte n'est pas encore vérifié. Consultez votre boîte mail et cliquez sur le lien de confirmation."));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message",
                    "Email ou mot de passe incorrect."));
        }
    }

    /**
     * Connexion / inscription avec le jeton « credential » (Google Identity Services, mode popup).
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleSignIn(@RequestBody Map<String, String> body) {
        String credential = body != null ? body.get("credential") : null;
        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Champ credential manquant."));
        }
        try {
            GoogleIdToken.Payload payload = googleIdTokenVerifierService.verify(credential);
            if (payload == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Jeton Google invalide."));
            }
            Boolean emailVerified = (Boolean) payload.get("email_verified");
            if (emailVerified == null || !emailVerified) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Email Google non vérifié."));
            }
            String email = payload.getEmail();
            String given = (String) payload.get("given_name");
            String family = (String) payload.get("family_name");
            String jwt = userService.loginOrRegisterGoogle(email, given, family);
            Map<String, String> response = new HashMap<>();
            response.put("token", jwt);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.warn("Google OAuth non configuré: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.warn("Échec auth Google: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentification Google refusée."));
        }
    }

    /**
     * ID client Web Google (public) pour initialiser le script GIS sans dupliquer la config dans Angular.
     */
    @GetMapping("/google-client-id")
    public Map<String, String> googleWebClientId() {
        return googleIdTokenVerifierService.getPrimaryWebClientId()
                .map(id -> Map.of("clientId", id))
                .orElseGet(() -> Map.of("clientId", ""));
    }

    // Registration method
//    @PostMapping("/register")
//    public ResponseEntity<?> registerUser(@RequestBody User user) {
//        if (userRepository.existsByEmail(user.getEmail())) {
//            return ResponseEntity.badRequest().body("Error: Email is already in use!");
//        }
//
//        // Check if the role is either CLIENT or CHEF
//        if (user.getRole() != Role_Enum.Client && user.getRole() != Role_Enum.Chef) {
//            return ResponseEntity.badRequest().body("Error: Invalid role selected! Only 'Client' or 'Chef' roles are allowed.");
//        }
//
//        // Encode the password
//        user.setPassword(encoder.encode(user.getPassword()));
//
//        // Save the user with the chosen role
//        userRepository.save(user);
//
//        return ResponseEntity.ok("User registered successfully!");
//    }
    // Registration method with email verification
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userService.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        // Check if the role is valid
        if (user.getRole() != Role_Enum.ROLE_COMMERCIAL && 
            user.getRole() != Role_Enum.ROLE_TECHNIQUE &&
            user.getRole() != Role_Enum.ROLE_ADMIN_COMMERCIAL &&
            user.getRole() != Role_Enum.ROLE_ADMIN_TECHNIQUE &&
            user.getRole() != Role_Enum.ROLE_SUPER_ADMIN) {
            return ResponseEntity.badRequest().body("Error: Invalid role selected! Only 'Commercial', 'Technique', 'Admin Commercial', 'Admin Technique', or 'Super Admin' roles are allowed.");
        }

        if (!PasswordPolicy.isValid(user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", PasswordPolicy.MESSAGE));
        }

        // Encode the password
        user.setPassword(encoder.encode(user.getPassword()));

        // Generate verification token
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        user.setVerified(false); // Account is initially not verified

        // Save the user with the chosen role and verification token
        userService.saveUser(user);

        boolean emailSent = false;
        String registerMessage;
        try {
            emailService.sendVerificationEmail(user.getEmail(), token);
            emailSent = true;
            registerMessage =
                    "Inscription réussie ! Consultez votre boîte mail (et les spams) pour activer votre compte.";
        } catch (MailException e) {
            log.error("Échec envoi e-mail de vérification pour {} : {}", user.getEmail(), e.getMessage(), e);
            registerMessage =
                    "Compte créé, mais l'e-mail de vérification n'a pas pu être envoyé. "
                            + "Vérifiez la configuration mail du serveur ou utilisez « Renvoyer l'e-mail » sur la page de connexion.";
        }

        Map<String, Object> body = new HashMap<>();
        body.put("message", registerMessage);
        body.put("emailSent", emailSent);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(body);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> payload) {
        String email = payload != null ? payload.get("email") : null;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "L'adresse e-mail est requise."));
        }
        try {
            userService.resendVerificationEmail(email.trim());
            return ResponseEntity.ok(Map.of(
                    "message",
                    "Si un compte non vérifié existe pour cet e-mail, un nouveau message de confirmation vient d'être envoyé."));
        } catch (MailException e) {
            log.error("Échec renvoi e-mail de vérification pour {} : {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message",
                    "Impossible d'envoyer l'e-mail pour le moment. Vérifiez application-mail.local.properties "
                            + "ou consultez les logs du serveur (lien de vérification affiché si APP_MAIL_LOG_LINK=true)."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "L'adresse e-mail est requise."));
        }
        try {
            userService.requestPasswordReset(request.getEmail().trim());
            return ResponseEntity.ok(Map.of(
                    "message",
                    "Si un compte est associé à cet e-mail, un code de vérification vient d'être envoyé."));
        } catch (MailException e) {
            log.error("Échec envoi e-mail mot de passe oublié: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message",
                    "Impossible d'envoyer l'e-mail pour le moment. Réessayez plus tard."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPasswordWithCode(@RequestBody ResetPasswordCodeRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()
                || request.getCode() == null || request.getCode().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "E-mail, code à 6 chiffres et nouveau mot de passe requis."));
        }
        if (!PasswordPolicy.isValid(request.getNewPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", PasswordPolicy.MESSAGE));
        }
        boolean ok = userService.resetPasswordWithCode(
                request.getEmail().trim(),
                request.getCode().trim(),
                request.getNewPassword());
        if (ok) {
            return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour. Vous pouvez vous connecter."));
        }
        return ResponseEntity.badRequest().body(Map.of(
                "message",
                "Code invalide ou expiré. Demandez un nouveau code."));
    }

    // Endpoint to handle account verification
    @GetMapping("/verify")
    public ResponseEntity<?> verifyUser(@RequestParam("token") String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Lien de vérification invalide."));
        }
        boolean verified = userService.verifyUser(token.trim());
        if (verified) {
            return ResponseEntity.ok(Map.of(
                    "message",
                    "Compte vérifié avec succès. Vous pouvez vous connecter."));
        }
        return ResponseEntity.badRequest().body(Map.of(
                "message",
                "Lien de vérification invalide ou déjà utilisé."));
    }
}