package com.example.projet2024.util;

/**
 * Mot de passe sécurisé : 8 caractères min., majuscule, minuscule, chiffre et caractère spécial.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 8;

    public static final String MESSAGE =
            "Le mot de passe doit contenir au moins 8 caractères, une majuscule, "
                    + "une minuscule, un chiffre et un caractère spécial (@$!%*?&_#-+.).";

    private static final String PATTERN =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&_#\\-+().,])[A-Za-z\\d@$!%*?&_#\\-+().,]{8,}$";

    private PasswordPolicy() {
    }

    public static boolean isValid(String password) {
        return password != null && password.matches(PATTERN);
    }
}
