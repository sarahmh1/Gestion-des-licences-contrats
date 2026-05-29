package com.example.projet2024.service.assistant;

import java.util.Optional;

/**
 * Résultat d’un appel de reformulation Ollama : texte optionnel + message d’échec lisible pour l’UI.
 */
public record OllamaRephraseOutcome(Optional<String> text, Optional<String> userVisibleFailure) {

    public static OllamaRephraseOutcome ok(String content) {
        return new OllamaRephraseOutcome(Optional.of(content), Optional.empty());
    }

    public static OllamaRephraseOutcome fail(String message) {
        return new OllamaRephraseOutcome(Optional.empty(), Optional.of(message));
    }

    /** Pas d’appel LLM (désactivé ou facts vides). */
    public static OllamaRephraseOutcome skipped() {
        return new OllamaRephraseOutcome(Optional.empty(), Optional.empty());
    }
}
