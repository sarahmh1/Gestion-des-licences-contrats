package com.example.projet2024.service.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Vérifie le JWT « credential » renvoyé par Google Identity Services (popup / bouton).
 */
@Service
public class GoogleIdTokenVerifierService {

    @Value("${google.oauth.client-ids:}")
    private String clientIdsCsv;

    /**
     * Premier ID client Web (valeur publique, pour le bouton GIS dans le navigateur).
     */
    public Optional<String> getPrimaryWebClientId() {
        if (clientIdsCsv == null || clientIdsCsv.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(clientIdsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .findFirst();
    }

    public GoogleIdToken.Payload verify(String credentialJwt) throws GeneralSecurityException, IOException {
        if (clientIdsCsv == null || clientIdsCsv.isBlank()) {
            throw new IllegalStateException("google.oauth.client-ids non configuré (Google Cloud Console → ID client Web).");
        }
        List<String> audiences = Arrays.stream(clientIdsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        if (audiences.isEmpty()) {
            throw new IllegalStateException("google.oauth.client-ids vide.");
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(audiences)
                .build();

        GoogleIdToken idToken = verifier.verify(credentialJwt);
        if (idToken == null) {
            return null;
        }
        return idToken.getPayload();
    }
}
