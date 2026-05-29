package com.example.projet2024.controller;

import com.example.projet2024.dto.assistant.AssistantChatRequest;
import com.example.projet2024.dto.assistant.AssistantChatResponse;
import com.example.projet2024.service.assistant.AssistantOrchestratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200", "http://192.168.1.50:4200"}, allowCredentials = "true")
public class AssistantController {

    @Autowired
    private AssistantOrchestratorService assistantOrchestratorService;

    /**
     * Assistant métier — rôles : SUPER_ADMIN, ADMIN_TECHNIQUE, ADMIN_COMMERCIAL uniquement.
     * Réponses basées sur les données applicatives ; Ollama local optionnel pour reformuler.
     */
    @PostMapping("/chat")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN_TECHNIQUE', 'ROLE_ADMIN_COMMERCIAL')")
    public ResponseEntity<AssistantChatResponse> chat(@RequestBody AssistantChatRequest request) {
        AssistantChatResponse res = assistantOrchestratorService.answer(request.getMessage(), request.getRephraseWithLlm());
        return ResponseEntity.ok(res);
    }
}
