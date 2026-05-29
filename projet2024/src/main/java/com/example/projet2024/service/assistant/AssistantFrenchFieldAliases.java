package com.example.projet2024.service.assistant;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Alias français / libellés formulaire ↔ variantes retrouvables dans les noms de getters
 * (voir {@link AssistantEntitySnapshotUtil#prettifyGetter}).
 */
public final class AssistantFrenchFieldAliases {

    private AssistantFrenchFieldAliases() {}

    /**
     * Même taille : chaque déclencheur (mot-clé métier sans accent, souvent plusieurs synonymes ensemble)
     * ouvre les jetons techniques associés pour élargir la recherche résiduelle.
     */
    private static final List<String[]> TRIGGER_TO_TECH;

    static {
        List<String[]> b = new ArrayList<>();
        b.add(new String[] { "serie", "serial", "numero", "numeroserie", "numeroserieboitier", "numerodeserieboitier", "numerodeserie" });
        b.add(new String[] { "boitier", "nomduboitier", "nomduboiter", "numeroserieboitier", "numerodeserieboitier" });
        b.add(new String[] { "cle", "clef", "licensekey", "cledelicence", "clelicence", "cle_de_licence", "clede" });
        b.add(new String[] { "dateex", "expiration", "expires", "echeance", "finde" });
        b.add(new String[] { "souscontrat", "sous_contrat" });
        b.add(new String[] { "contact", "nomducontact", "interlocuteur" });
        b.add(new String[] { "mail", "email", "adressemail", "adressemailcontact", "courriel" });
        b.add(new String[] { "admin", "mailadmin", "adressemailadmin" });
        b.add(new String[] { "ccmail", "cc", "copiecarbone" });
        b.add(new String[] { "duree", "dureede", "dureedelicence", "duree_de_licence" });
        b.add(new String[] { "remarque", "commentaire", "note" });
        b.add(new String[] { "identifiant", "id", "login" });
        b.add(new String[] { "nomproduit", "produitlogiciel", "produit", "edition" });
        b.add(new String[] { "quantite", "qty", "volume", "nombre", "nmbdelicence", "nmb_de_licence" });
        b.add(new String[] { "nmbtlf", "telephone", "tel", "portable", "mobile" });
        b.add(new String[] { "fichier", "piecejointe", "fichieroriginalname", "pj" });
        b.add(new String[] { "typeachat", "typedachat" });
        b.add(new String[] { "commandepasserpar", "commande", "passepar" });
        b.add(new String[] { "approuve", "validation", "valide", "approve" });
        TRIGGER_TO_TECH = List.copyOf(b);
    }

    /** Un mot déclenchera les jetons techniques du même groupe (premier groupe dont au moins une entrée matche). */
    private static final String[][] TRIGGER_WORDS = {
            { "numerodeserie", "numeroserie", "serie", "serial" },
            { "boitier" },
            { "cle", "cledelicence", "clelicense", "licencekey", "clede" },
            { "expiration", "expire", "echeance", "dateexpiration", "dateex", "datedexpiration" },
            { "souscontrat", "couvert", "maintenance" },
            { "contact", "interlocuteur", "coordinateur" },
            { "mail", "email", "courriel", "messagerie" },
            { "mailadmin", "administrateur", "admin" },
            { "copiecarbone", "ccmail", "ccemail" },
            { "duree", "dureedelicence" },
            { "remarque", "commentaire", "note", "memo" },
            { "identifiant", "idcompte", "idc" },
            { "nomproduit", "produit", "offre", "sku" },
            { "quantite", "nombre", "volume", "lots" },
            { "telephone", "tel", "portable", "mobile", "gsm" },
            { "fichier", "piecejointe", "pj", "attachment" },
            { "typedachat", "typeachat", "modalite" },
            { "commande", "passagecommande", "commandepar" },
            { "approuve", "approuvee", "valide", "validation" },
    };

    static {
        if (TRIGGER_WORDS.length != TRIGGER_TO_TECH.size()) {
            throw new IllegalStateException("TRIGGER_WORDS et TRIGGER_TO_TECH doivent avoir la meme taille.");
        }
    }

    public static String compactAlphaNum(String foldedLower) {
        if (foldedLower == null || foldedLower.isEmpty()) {
            return "";
        }
        return foldedLower.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    public static List<String> needlesForResidualMatch(String foldedResidualLower) {
        Set<String> acc = new LinkedHashSet<>();
        if (foldedResidualLower == null || foldedResidualLower.isBlank()) {
            return List.of();
        }
        String raw = foldedResidualLower.strip().toLowerCase(Locale.ROOT);
        if (raw.length() >= 2) {
            acc.add(raw);
        }
        String foldFull = AssistantEntitySnapshotUtil.foldAccents(foldedResidualLower).toLowerCase(Locale.ROOT);
        if (foldFull.length() >= 2) {
            acc.add(foldFull);
        }
        String compact = compactAlphaNum(foldFull);
        if (compact.length() >= 2) {
            acc.add(compact);
        }

        for (int g = 0; g < TRIGGER_WORDS.length; g++) {
            boolean hit = false;
            for (String w : TRIGGER_WORDS[g]) {
                String ww = AssistantEntitySnapshotUtil.foldAccents(w).toLowerCase(Locale.ROOT);
                if (raw.contains(ww) || foldFull.contains(ww) || compact.contains(compactAlphaNum(ww))) {
                    hit = true;
                    break;
                }
            }
            if (hit) {
                for (String token : TRIGGER_TO_TECH.get(g)) {
                    String t = AssistantEntitySnapshotUtil.foldAccents(token).toLowerCase(Locale.ROOT);
                    acc.add(t);
                    acc.add(compactAlphaNum(t));
                }
            }
        }
        return new ArrayList<>(acc);
    }

    /** Texte contre lequel tester les aiguilles (clés + valeurs des champs simples). */
    public static String haystackForMatching(Object bean) {
        var snaps = AssistantEntitySnapshotUtil.flattenSimpleProperties(bean, 48);
        StringBuilder sb = new StringBuilder();
        for (var e : snaps.entrySet()) {
            if (sb.length() > 0) {
                sb.append(" | ");
            }
            sb.append(e.getKey()).append("=").append(e.getValue());
        }
        return AssistantEntitySnapshotUtil.foldAccents(sb.toString()).toLowerCase(Locale.ROOT);
    }
}
