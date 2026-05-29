package com.example.projet2024.service.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class OllamaClientService {

    private static final Logger log = LoggerFactory.getLogger(OllamaClientService.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    @Value("${assistant.ollama.enabled:false}")
    private boolean enabled;

    @Value("${assistant.ollama.base-url:http://127.0.0.1:11434}")
    private String baseUrl;

    @Value("${assistant.ollama.model:mistral:latest}")
    private String model;

    @Value("${assistant.ollama.connect-timeout-ms:10000}")
    private int connectTimeoutMs;

    @Value("${assistant.ollama.read-timeout-ms:180000}")
    private int readTimeoutMs;

    /** Limite de caractères envoyés au modèle (prompt trop long = échec ou timeout Ollama). */
    @Value("${assistant.ollama.max-facts-chars:28000}")
    private int maxFactsChars;

    /** Import ESET : limite séparée (souvent plus basse = réponse Ollama plus rapide). 0 = utiliser max-facts-chars. */
    @Value("${eset.import.ollama.max-prompt-chars:16000}")
    private int esetImportMaxPromptChars;

    /** Import ESET : délai lecture HTTP Ollama (ms). 0 = utiliser assistant.ollama.read-timeout-ms. */
    @Value("${eset.import.ollama.read-timeout-ms:0}")
    private int esetImportReadTimeoutMs;

    public OllamaRephraseOutcome tryRephrase(String userQuestion, String factualSummary) {
        if (!enabled) {
            return OllamaRephraseOutcome.skipped();
        }
        String trimmed = factualSummary != null ? factualSummary.trim() : "";
        if (trimmed.isEmpty()) {
            return OllamaRephraseOutcome.skipped();
        }

        if (trimmed.length() > maxFactsChars) {
            log.info("FACTS tronqués pour Ollama: {} -> {} caractères", trimmed.length(), maxFactsChars);
            trimmed = trimmed.substring(0, maxFactsChars) + "\n… [tronqué pour la reformulation]";
        }

        String systemPrompt = """
                Tu es l'assistant d'une application web de gestion de licences logicielles et contrats (ESET, Fortinet, Palo, Cisco, VMware, Splunk…).
                Tu réponds uniquement à partir du bloc FACTS ci-dessous. Ne rajoute aucune donnée inventée ni de réponse générique du type « consulter ailleurs » ou « données absentes » si FACTS permettent de répondre.
                Si FACTS indiquent explicitement aucun résultat, ou liste des lignes (préfixées « - # » pour les interventions), base-toi exclusivement là-dessus. Réponses courtes en français.
                """;

        String userPrompt = "QUESTION UTILISATEUR:\n"
                + (userQuestion == null ? "" : userQuestion)
                + "\n\nFACTS (données système):\n"
                + trimmed;

        return executeChat(systemPrompt, userPrompt);
    }

    /**
     * Appel chat pour extraction JSON (import ESET). Si Ollama est désactivé, retourne un échec explicite (pas skipped).
     */
    public OllamaRephraseOutcome tryEsetImportJson(String systemPrompt, String userPrompt) {
        if (!enabled) {
            return OllamaRephraseOutcome.fail(
                    "L'extraction automatique est désactivée (assistant.ollama.enabled=false). Renseignez le formulaire manuellement.");
        }
        String trimmed = userPrompt == null ? "" : userPrompt.trim();
        if (trimmed.isEmpty()) {
            return OllamaRephraseOutcome.fail("Aucun texte extrait du fichier.");
        }
        int cap = esetImportMaxPromptChars > 0 ? esetImportMaxPromptChars : maxFactsChars;
        if (trimmed.length() > cap) {
            log.info("Document import ESET tronqué pour Ollama: {} -> {} caractères", trimmed.length(), cap);
            trimmed = trimmed.substring(0, cap) + "\n… [tronqué]";
        }
        int readMs = esetImportReadTimeoutMs > 0 ? esetImportReadTimeoutMs : readTimeoutMs;
        return executeChat(systemPrompt, trimmed, readMs);
    }

    private OllamaRephraseOutcome executeChat(String systemPrompt, String userMessage) {
        return executeChat(systemPrompt, userMessage, readTimeoutMs);
    }

    private OllamaRephraseOutcome executeChat(String systemPrompt, String userMessage, int readTimeoutOverrideMs) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(Math.max(1000, connectTimeoutMs));
        rf.setReadTimeout(Math.max(5000, readTimeoutOverrideMs));
        RestTemplate rt = new RestTemplate();
        rt.setRequestFactory(rf);

        String url = baseUrl.endsWith("/") ? baseUrl + "api/chat" : baseUrl + "/api/chat";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("stream", false);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userMessage));
        payload.put("messages", messages);

        try {
            ResponseEntity<JsonNode> res = rt.postForEntity(url, new HttpEntity<>(payload, headers), JsonNode.class);
            JsonNode body = res.getBody();
            if (!res.getStatusCode().is2xxSuccessful()) {
                String hint = "HTTP " + res.getStatusCode().value() + " sur " + url;
                if (body != null && body.hasNonNull("error")) {
                    hint += " — " + body.get("error").asText();
                }
                log.warn("Ollama: {}", hint);
                return OllamaRephraseOutcome.fail(hint);
            }
            if (body == null) {
                log.warn("Ollama: corps de réponse vide (HTTP 2xx)");
                return OllamaRephraseOutcome.fail("Réponse Ollama vide (pas de JSON).");
            }
            if (body.hasNonNull("error")) {
                String err = body.get("error").asText();
                log.warn("Ollama error field: {}", err);
                return OllamaRephraseOutcome.fail(err);
            }
            JsonNode messageNode = body.path("message");
            String content = messageNode.path("content").asText(null);
            if (content != null && !content.isBlank()) {
                return OllamaRephraseOutcome.ok(content.strip());
            }
            log.warn("Ollama: message.content absent ou vide. Corps (extrait): {}", abbreviate(body.toString(), 500));
            return OllamaRephraseOutcome.fail(
                    "Le modèle « " + model + " » n’a renvoyé aucun texte. Vérifiez `ollama list` et que le nom dans assistant.ollama.model correspond.");
        } catch (HttpStatusCodeException e) {
            return handleHttpError(e, rt);
        } catch (ResourceAccessException e) {
            log.warn("Ollama indisponible (timeout / connexion): {}", e.getMessage());
            return OllamaRephraseOutcome.fail(
                    "Connexion ou délai dépassé vers Ollama (" + baseUrl + "). Vérifiez que le service tourne et augmentez assistant.ollama.read-timeout-ms si besoin.");
        } catch (Exception e) {
            log.warn("Erreur appel Ollama: {}", e.getMessage(), e);
            return OllamaRephraseOutcome.fail(
                    "Erreur technique: " + abbreviate(e.getMessage() != null ? e.getMessage() : e.toString(), 200));
        }
    }

    private OllamaRephraseOutcome handleHttpError(HttpStatusCodeException e, RestTemplate rt) {
        String rawBody = e.getResponseBodyAsString(StandardCharsets.UTF_8);
        String ollamaMessage = rawBody;
        try {
            JsonNode n = JSON.readTree(rawBody);
            if (n.hasNonNull("error")) {
                ollamaMessage = n.get("error").asText();
            }
        } catch (Exception parseEx) {
            log.debug("Corps d’erreur Ollama non JSON: {}", abbreviate(rawBody, 120));
        }
        String base = "HTTP " + e.getStatusCode().value() + " — " + ollamaMessage;
        String lower = ollamaMessage.toLowerCase(Locale.ROOT);
        if (lower.contains("model") && lower.contains("not found")) {
            base += ". " + describeInstalledModels(rt);
        }
        log.warn("Ollama HTTP: {}", abbreviate(base, 400));
        return OllamaRephraseOutcome.fail(base);
    }

    /**
     * Liste les noms tels que vus depuis ce processus (même base-url que le chat).
     * Indispensable pour diagnostiquer Docker ({@code 127.0.0.1} = conteneur vide) vs hôte Windows.
     */
    private String describeInstalledModels(RestTemplate rt) {
        try {
            String tagsUrl = baseUrl.endsWith("/") ? baseUrl + "api/tags" : baseUrl + "/api/tags";
            ResponseEntity<JsonNode> tags = rt.getForEntity(tagsUrl, JsonNode.class);
            JsonNode body = tags.getBody();
            if (body == null || !tags.getStatusCode().is2xxSuccessful()) {
                return "Impossible de lire GET " + tagsUrl;
            }
            List<String> names = new ArrayList<>();
            JsonNode models = body.path("models");
            if (models.isArray()) {
                names = StreamSupport.stream(models.spliterator(), false)
                        .map(m -> m.path("name").asText(""))
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
            }
            if (names.isEmpty()) {
                return "Aucun modèle sur l’Ollama à « "
                        + baseUrl
                        + " ». Si le backend tourne dans Docker, 127.0.0.1 désigne le conteneur (souvent sans modèles) : "
                        + "définissez assistant.ollama.base-url=http://host.docker.internal:11434 (Docker Desktop) "
                        + "ou l’IP de la machine où vous avez fait `ollama pull`.";
            }
            return "Modèles visibles depuis le backend sur « "
                    + baseUrl
                    + " » : "
                    + String.join(", ", names)
                    + ". Mettez assistant.ollama.model sur l’un de ces noms exacts.";
        } catch (HttpStatusCodeException ex) {
            return "GET /api/tags a échoué (" + ex.getStatusCode().value() + ") — vérifiez base-url.";
        } catch (Exception ex) {
            return "Liste des modèles indisponible: " + abbreviate(ex.getMessage(), 120);
        }
    }

    private static String abbreviate(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.replace('\n', ' ');
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }
}
