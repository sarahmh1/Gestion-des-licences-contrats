package com.example.projet2024.dto.assistant;

public class AssistantChatResponse {
    /** Réponse affichée à l'utilisateur */
    private String answer;
    /** Intention technique détectée (debug / UX) */
    private String intent;
    /** true si la phrase a été générée ou reformulée par Ollama */
    private boolean llmUsed;
    /** Message d'avertissement (ex. Ollama indisponible) */
    private String warning;

    public AssistantChatResponse() {}

    public AssistantChatResponse(String answer, String intent, boolean llmUsed, String warning) {
        this.answer = answer;
        this.intent = intent;
        this.llmUsed = llmUsed;
        this.warning = warning;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public boolean isLlmUsed() {
        return llmUsed;
    }

    public void setLlmUsed(boolean llmUsed) {
        this.llmUsed = llmUsed;
    }

    public String getWarning() {
        return warning;
    }

    public void setWarning(String warning) {
        this.warning = warning;
    }
}
