package com.example.projet2024.dto.assistant;

/** Corps de POST /api/assistant/chat */
public class AssistantChatRequest {

    private String message;
    /** Si null : voir assistant.ollama.rephrase-default sur le serveur. Si false : réponse immédiate (données brutes). */
    private Boolean rephraseWithLlm;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getRephraseWithLlm() {
        return rephraseWithLlm;
    }

    public void setRephraseWithLlm(Boolean rephraseWithLlm) {
        this.rephraseWithLlm = rephraseWithLlm;
    }
}
