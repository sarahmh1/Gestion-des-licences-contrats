package com.example.projet2024.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests unitaires — politique de mot de passe (inscription / reset).
 */
class PasswordPolicyTest {

    @Test
    @DisplayName("Mot de passe valide : 8+ caractères, maj, min, chiffre, spécial")
    void isValid_acceptsStrongPassword() {
        assertTrue(PasswordPolicy.isValid("Test1234!"));
        assertTrue(PasswordPolicy.isValid("Secure_Pass1"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "",
            "short1!",
            "nouppercase1!",
            "NOLOWERCASE1!",
            "NoDigits!!",
            "NoSpecial1"
    })
    @DisplayName("Mot de passe invalide rejeté")
    void isValid_rejectsWeakPasswords(String password) {
        assertFalse(PasswordPolicy.isValid(password));
    }

    @Test
    @DisplayName("Mot de passe null rejeté")
    void isValid_rejectsNull() {
        assertFalse(PasswordPolicy.isValid(null));
    }
}
