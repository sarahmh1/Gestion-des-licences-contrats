package com.example.projet2024.service.esetimport;

import com.example.projet2024.DTO.eset.EsetImportAnalyzeResponse;
import com.example.projet2024.entite.CommandePasserPar;
import com.example.projet2024.entite.Duree;
import com.example.projet2024.entite.Produit;
import com.example.projet2024.entite.TypeAchat;
import com.example.projet2024.repository.ProduitRepository;
import com.example.projet2024.service.assistant.OllamaClientService;
import com.example.projet2024.service.assistant.OllamaRephraseOutcome;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EsetImportAnalyzeService {

    private static final Logger log = LoggerFactory.getLogger(EsetImportAnalyzeService.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final EsetDocumentTextExtractor textExtractor;
    private final OllamaClientService ollamaClientService;
    private final ProduitRepository produitRepository;

    public EsetImportAnalyzeService(
            EsetDocumentTextExtractor textExtractor,
            OllamaClientService ollamaClientService,
            ProduitRepository produitRepository) {
        this.textExtractor = textExtractor;
        this.ollamaClientService = ollamaClientService;
        this.produitRepository = produitRepository;
    }

    public EsetImportAnalyzeResponse analyze(MultipartFile file) {
        String rawText;
        try {
            rawText = textExtractor.extractText(file);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Lecture fichier import ESET: {}", e.getMessage());
            throw new IllegalArgumentException("Impossible de lire le fichier: " + e.getMessage());
        }

        if (rawText == null || rawText.isBlank()) {
            EsetImportAnalyzeResponse empty = new EsetImportAnalyzeResponse();
            empty.setExtractionSkipped(true);
            empty.setInfoMessage(
                    "Impossible de lire du texte dans ce PDF. "
                            + "Si c’est un scan (image de page), activez l’OCR dans application.properties : "
                            + "eset.import.ocr.enabled=true et indiquez eset.import.ocr.tessdata-path "
                            + "(dossier tessdata de Tesseract, ex. C:/Program Files/Tesseract-OCR/tessdata). "
                            + "Sinon, exportez le document en PDF avec texte sélectionnable, ou utilisez un fichier .txt.");
            return empty;
        }

        Set<String> produitCodes = produitRepository.findByActifTrue().stream()
                .map(Produit::getCode)
                .map(c -> c == null ? "" : c.trim().toLowerCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        String codesList = String.join(", ", produitCodes);

        String systemPrompt = """
                Tu extrais des champs structurés pour une licence ESET à partir d'un document (facture, bon de commande, email).
                Réponds UNIQUEMENT par un objet JSON valide, sans markdown, sans texte avant ou après.
                Utilise null pour toute information absente ou incertaine.
                Clés obligatoires (toutes présentes, valeurs string ou null sauf indication):
                "client","identifiant","cle_de_Licence","nom_produit","nombre","nmb_tlf","nom_contact","mail","mailAdmin","dateEx","dureeDeLicence","typeAchat","commandePasserPar","remarque","sousContrat","ccMail"
                - nom_produit: code EXACT parmi la liste fournie par l'utilisateur, ou null.
                - typeAchat: une seule valeur parmi: RENOUVELLEMENT, upgrade, nouvel_licence, businessTrial, Augmentation, DownGrade, licence_gratuit — ou null.
                - commandePasserPar: GI_TN, GI_FR, ou GI_CI — ou null.
                - dureeDeLicence: "1_an", "2_ans", "3_ans" — ou null.
                - dateEx: date d'expiration au format yyyy-MM-dd — ou null.
                - nombre: entier positif ou null.
                - nmb_tlf: chaîne (chiffres et espaces) ou null.
                - sousContrat: true ou false ou null.
                - ccMail: tableau de chaînes (emails) ou [].
                - remarque: courte phrase ou null.
                """;

        String userPrompt = "Codes produits autorisés (nom_produit): "
                + codesList
                + "\n\nTEXTE DU DOCUMENT:\n"
                + rawText;

        OllamaRephraseOutcome outcome = ollamaClientService.tryEsetImportJson(systemPrompt, userPrompt);
        EsetImportAnalyzeResponse response = new EsetImportAnalyzeResponse();

        if (outcome.userVisibleFailure().isPresent()) {
            response.setExtractionSkipped(true);
            response.setInfoMessage(outcome.userVisibleFailure().get());
            return response;
        }

        if (outcome.text().isEmpty()) {
            response.setExtractionSkipped(true);
            response.setInfoMessage("Réponse vide du modèle.");
            return response;
        }

        try {
            String json = unwrapJsonFence(outcome.text().get());
            JsonNode root = JSON.readTree(json);
            fillFromJson(root, response, produitCodes);
            response.setInfoMessage("Champs proposés à partir du document (vérifiez avant enregistrement).");
        } catch (Exception e) {
            log.warn("Parse JSON import ESET: {}", e.getMessage());
            response.setExtractionSkipped(true);
            response.setInfoMessage("Le modèle n'a pas renvoyé un JSON exploitable. " + e.getMessage());
        }
        return response;
    }

    private static String unwrapJsonFence(String raw) {
        String s = raw.trim();
        if (s.startsWith("```")) {
            int firstNl = s.indexOf('\n');
            int lastFence = s.lastIndexOf("```");
            if (firstNl > 0 && lastFence > firstNl) {
                return s.substring(firstNl + 1, lastFence).trim();
            }
        }
        return s;
    }

    private void fillFromJson(JsonNode n, EsetImportAnalyzeResponse out, Set<String> produitCodesLower) {
        text(n, "client", out::setClient);
        text(n, "identifiant", out::setIdentifiant);
        text(n, "cle_de_Licence", out::setCle_de_Licence);
        if (out.getCle_de_Licence() == null) {
            text(n, "cle_de_licence", out::setCle_de_Licence);
        }

        String nomRaw = readText(n, "nom_produit");
        if (nomRaw != null) {
            String code = nomRaw.trim().toLowerCase(Locale.ROOT);
            if (produitCodesLower.contains(code)) {
                out.setNom_produit(code);
            }
        }

        Integer nombre = readInt(n, "nombre");
        if (nombre != null && nombre > 0) {
            out.setNombre(nombre);
        }

        String tel = readText(n, "nmb_tlf");
        if (tel != null && !tel.isBlank()) {
            out.setNmb_tlf(tel.trim());
        }

        text(n, "nom_contact", out::setNom_contact);
        text(n, "mail", out::setMail);
        text(n, "mailAdmin", out::setMailAdmin);

        String dateEx = readText(n, "dateEx");
        if (dateEx != null) {
            String d = dateEx.trim();
            try {
                LocalDate.parse(d);
                out.setDateEx(d);
            } catch (DateTimeParseException ignored) {
                // laisser null
            }
        }

        String duree = parseDuree(readText(n, "dureeDeLicence"));
        if (duree != null) {
            out.setDureeDeLicence(duree);
        }

        String type = parseTypeAchat(readText(n, "typeAchat"));
        if (type != null) {
            out.setTypeAchat(type);
        }

        String cmd = parseCommande(readText(n, "commandePasserPar"));
        if (cmd != null) {
            out.setCommandePasserPar(cmd);
        }

        text(n, "remarque", out::setRemarque);

        if (n.has("sousContrat") && !n.get("sousContrat").isNull()) {
            if (n.get("sousContrat").isBoolean()) {
                out.setSousContrat(n.get("sousContrat").asBoolean());
            }
        }

        if (n.has("ccMail") && n.get("ccMail").isArray()) {
            List<String> emails = new ArrayList<>();
            for (JsonNode e : n.get("ccMail")) {
                if (e != null && e.isTextual()) {
                    String em = e.asText().trim();
                    if (!em.isEmpty()) {
                        emails.add(em);
                    }
                }
            }
            if (!emails.isEmpty()) {
                out.setCcMail(emails);
            }
        }
    }

    private static void text(JsonNode n, String key, java.util.function.Consumer<String> setter) {
        String v = readText(n, key);
        if (v != null && !v.isBlank()) {
            setter.accept(v.trim());
        }
    }

    private static String readText(JsonNode n, String key) {
        JsonNode v = n.get(key);
        if (v == null || v.isNull()) {
            return null;
        }
        if (v.isTextual()) {
            return v.asText();
        }
        if (v.isNumber()) {
            return v.asText();
        }
        return null;
    }

    private static Integer readInt(JsonNode n, String key) {
        JsonNode v = n.get(key);
        if (v == null || v.isNull()) {
            return null;
        }
        if (v.isInt() || v.isLong()) {
            return v.asInt();
        }
        if (v.isTextual()) {
            try {
                return Integer.parseInt(v.asText().trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private static String parseTypeAchat(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim();
        for (TypeAchat e : TypeAchat.values()) {
            if (e.name().equalsIgnoreCase(t)) {
                return e.name();
            }
        }
        return null;
    }

    private static String parseCommande(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        for (CommandePasserPar e : CommandePasserPar.values()) {
            if (e.name().equalsIgnoreCase(t) || e.name().equals(t)) {
                return e.name();
            }
        }
        return null;
    }

    private static String parseDuree(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim();
        for (Duree d : Duree.values()) {
            if (d.name().equalsIgnoreCase(t)) {
                return switch (d) {
                    case UN_AN -> "1_an";
                    case DEUX_ANS -> "2_ans";
                    case TROIS_ANS -> "3_ans";
                };
            }
        }
        String lower = t.toLowerCase(Locale.ROOT);
        if ("1_an".equals(lower) || "2_ans".equals(lower) || "3_ans".equals(lower)) {
            return lower;
        }
        return null;
    }
}
