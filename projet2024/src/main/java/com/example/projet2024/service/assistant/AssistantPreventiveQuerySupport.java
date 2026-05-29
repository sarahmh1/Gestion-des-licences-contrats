package com.example.projet2024.service.assistant;

import com.example.projet2024.Enum.StatutInterventionPreventive;
import com.example.projet2024.entite.InterventionPreventive;
import com.example.projet2024.entite.IntervenantPreventif;
import com.example.projet2024.entite.PeriodeLigne;
import com.example.projet2024.entite.User;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Filtres langage naturel sur les interventions préventives (statut, période / période recommandée, mois-année).
 */
public final class AssistantPreventiveQuerySupport {

    private AssistantPreventiveQuerySupport() {}

    private static final Pattern YEAR = Pattern.compile("\\b(20[0-9]{2})\\b");
    private static final Pattern MONTH_YEAR_SLASH = Pattern.compile("\\b(0?[1-9]|1[0-2])\\s*[/\\-]\\s*(20[0-9]{2})\\b");

    private static final List<String> MOIS_FR = List.of(
            "janvier", "fevrier", "février", "mars", "avril", "mai", "juin",
            "juillet", "aout", "août", "septembre", "octobre", "novembre", "decembre", "décembre");

    public record MonthYear(int year, int month) {}

    /**
     * Applique filtres dérivés de la question (statut, plage calendaire sur période ou période recommandée, texte libre).
     */
    public static List<InterventionPreventive> applyFilters(List<InterventionPreventive> source, String rawQuestion) {
        if (source == null || source.isEmpty()) {
            return List.of();
        }
        String lo = rawQuestion.toLowerCase(Locale.FRENCH).replace('\u2019', '\'');
        String folded = AssistantEntitySnapshotUtil.foldAccents(lo);

        Optional<StatusFilter> st = parseStatusFilter(lo, folded);
        Optional<MonthYear> my = parseMonthYear(rawQuestion, lo, folded);
        boolean recommandeeOnly =
                folded.contains("periode recommandee")
                || (folded.contains("recommandee") && folded.contains("periode"))
                || lo.contains("période recommandée") || lo.contains("periode recommandee");

        String hayNeedle = residualForHaystackMatch(rawQuestion, lo);
        Optional<String> hayFolded = hayNeedle.length() >= 2
                ? Optional.of(AssistantEntitySnapshotUtil.foldAccents(hayNeedle).toLowerCase(Locale.ROOT))
                : Optional.empty();

        return source.stream()
                .filter(p -> st.map(f -> matchesStatusFilter(f, p.getStatut())).orElse(true))
                .filter(p -> my.map(m -> matchesMonthYear(p, m, recommandeeOnly)).orElse(true))
                .filter(p -> hayFolded.map(h -> haystackContains(p, h)).orElse(true))
                .collect(Collectors.toList());
    }

    /** Phrases métier enlevées pour laisser un résidu (client, nom, etc.). */
    public static String stripMetaForFreeTextSearch(String raw) {
        String t = raw != null ? raw : "";
        t = t.replaceAll("(?i)\\binterventions?\\s+", " ");
        t = t.replaceAll("(?i)\\b(préventives?|preventives?|préventifs?|preventifs?|préventions?|preventions?)\\b", " ");
        t = t.replaceAll("(?i)intervention(s)?\\s+(prévent(ives?)?|preventiv(es?)?)", " ");
        t = t.replaceAll("(?i)\\b(statut\\s*:?|filtre)\\b", " ");

        String[] strips = {
                "terminée", "terminee", "terminé", "termine", "achevée", "achevee", "achevé", "acheve",
                "complétée", "completee", "complété", "complete", "clôturée", "cloturee", "clos",
                "non complète", "non complete", "pas terminée", "pas terminee", "incomplète", "incomplete",
                "en cours", "encours",
                "à planifier", "a planifier", "planifier", "planifie", "planifiée", "planifiee",
                "en attente", "créée", "creee", "créé", "créées", "cree",
                "période recommandée", "periode recommandee", "période contractuelle",
                "période", "periode", "recommandée", "recommandee",
                "à faire", "a faire",
        };
        String low = t.toLowerCase(Locale.FRENCH);
        for (String s : strips) {
            low = low.replace(s, " ");
        }
        t = low;
        t = t.replaceAll("\\b(20[0-9]{2})\\b", " ");
        t = t.replaceAll("\\b(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|décembre|decembre)\\b", " ");
        t = t.replaceAll("\\s+", " ").strip();
        return t;
    }

    private enum StatusFilter {
        TERMINE_ONLY,
        NOT_TERMINE,
        PLANIF_OU_ATTENTE,
        EN_COURS_ONLY,
    }

    private static Optional<StatusFilter> parseStatusFilter(String lo, String folded) {
        if (folded.contains("encours") || lo.contains("en cours")) {
            return Optional.of(StatusFilter.EN_COURS_ONLY);
        }
        if (lo.contains("pas termin") || lo.contains("non compl")
                || Pattern.compile("(?i)pas\\s+achev").matcher(lo).find()
                || folded.contains("noncomplete")) {
            return Optional.of(StatusFilter.NOT_TERMINE);
        }
        if (lo.contains("en attente") || lo.contains("à planifier") || lo.contains("a planifier") || folded.contains("planif")
                || lo.contains("à faire") || lo.contains("a faire")) {
            return Optional.of(StatusFilter.PLANIF_OU_ATTENTE);
        }
        if (folded.contains("termine") || folded.contains("acheve") || folded.contains("complete")
                || folded.contains("cloture")) {
            return Optional.of(StatusFilter.TERMINE_ONLY);
        }
        if (folded.contains("incomplet")) {
            return Optional.of(StatusFilter.NOT_TERMINE);
        }
        return Optional.empty();
    }

    private static boolean matchesStatusFilter(StatusFilter f, StatutInterventionPreventive s) {
        if (s == null) {
            return false;
        }
        return switch (f) {
            case TERMINE_ONLY -> s == StatutInterventionPreventive.TERMINE;
            case NOT_TERMINE -> s != StatutInterventionPreventive.TERMINE;
            case EN_COURS_ONLY -> s == StatutInterventionPreventive.EN_COURS;
            case PLANIF_OU_ATTENTE -> s != StatutInterventionPreventive.TERMINE;
        };
    }

    private static Optional<MonthYear> parseMonthYear(String raw, String lo, String folded) {
        Matcher my = MONTH_YEAR_SLASH.matcher(raw);
        if (my.find()) {
            int mo = Integer.parseInt(my.group(1));
            int yr = Integer.parseInt(my.group(2));
            if (mo >= 1 && mo <= 12) {
                return Optional.of(new MonthYear(yr, mo));
            }
        }
        Matcher y = YEAR.matcher(raw);
        Integer yearOnly = null;
        if (y.find()) {
            yearOnly = Integer.parseInt(y.group(1));
        }
        int monthIdx = -1;
        for (int i = 0; i < MOIS_FR.size(); i++) {
            String m = MOIS_FR.get(i);
            if (lo.contains(m)) {
                int mo = monthFromFrenchToken(m);
                if (mo > 0) {
                    monthIdx = mo;
                    break;
                }
            }
        }
        if (monthIdx > 0 && yearOnly != null) {
            return Optional.of(new MonthYear(yearOnly, monthIdx));
        }
        if (yearOnly != null && monthIdx < 0) {
            return Optional.of(new MonthYear(yearOnly, -1));
        }
        return Optional.empty();
    }

    private static int monthFromFrenchToken(String token) {
        return switch (AssistantEntitySnapshotUtil.foldAccents(token)) {
            case "janvier" -> 1;
            case "fevrier" -> 2;
            case "mars" -> 3;
            case "avril" -> 4;
            case "mai" -> 5;
            case "juin" -> 6;
            case "juillet" -> 7;
            case "aout" -> 8;
            case "septembre" -> 9;
            case "octobre" -> 10;
            case "novembre" -> 11;
            case "decembre" -> 12;
            default -> -1;
        };
    }

    private static boolean matchesMonthYear(InterventionPreventive p, MonthYear my, boolean recommandeeOnly) {
        LocalDate qs;
        LocalDate qe;
        if (my.month >= 1) {
            qs = LocalDate.of(my.year, my.month, 1);
            qe = qs.withDayOfMonth(qs.lengthOfMonth());
        } else {
            qs = LocalDate.of(my.year, 1, 1);
            qe = LocalDate.of(my.year, 12, 31);
        }
        List<LocalDate[]> ranges = collectRanges(p, recommandeeOnly);
        if (ranges.isEmpty()) {
            return true;
        }
        for (LocalDate[] rg : ranges) {
            LocalDate s = rg[0];
            LocalDate e = rg[1];
            if (s != null && e != null && !s.isAfter(qe) && !e.isBefore(qs)) {
                return true;
            }
        }
        return false;
    }

    /** Paires [début, fin] réutilisées pour intersection avec mois demandé. */
    private static List<LocalDate[]> collectRanges(InterventionPreventive p, boolean recommandeeOnly) {
        List<LocalDate[]> ranges = new ArrayList<>();
        if (!recommandeeOnly) {
            addRange(ranges, p.getPeriodeDe(), p.getPeriodeA());
        }
        addRange(ranges, p.getPeriodeRecommandeDe(), p.getPeriodeRecommandeA());
        if (!recommandeeOnly) {
            addRange(ranges, p.getDateInterventionExigee(), p.getDateInterventionExigee());
        }

        List<PeriodeLigne> lignes = p.getPeriodeLignes();
        if (lignes != null) {
            for (PeriodeLigne pl : lignes) {
                if (!recommandeeOnly) {
                    addRange(ranges, pl.getPeriodeDe(), pl.getPeriodeA());
                    addRange(ranges, pl.getDateInterventionExigee(), pl.getDateInterventionExigee());
                }
                addRange(ranges, pl.getPeriodeRecommandeDe(), pl.getPeriodeRecommandeA());
            }
        }
        return ranges;
    }

    private static void addRange(List<LocalDate[]> out, LocalDate a, LocalDate b) {
        if (a == null || b == null) {
            return;
        }
        LocalDate start = a.isBefore(b) ? a : b;
        LocalDate end = a.isBefore(b) ? b : a;
        out.add(new LocalDate[] { start, end });
    }

    private static String residualForHaystackMatch(String raw, String lowered) {
        String stripped = stripMetaForFreeTextSearch(raw);
        stripped = stripped.replaceAll("(?i)\\b(preventives?|préventives?|preventifs?|préventifs?|preventiv(?:e|es)?)\\b", " ");
        stripped = lowered.contains("pour le client") || lowered.contains("du client") || lowered.contains("par client")
                ? stripAssistantFragmentClientPrefixes(stripped)
                : stripped;
        stripped = stripped.replaceAll("(?i)\\bcontrat\\s*#?\\s*\\d+\\b", " ");
        stripped = stripped.replaceAll("\\s+", " ").strip();
        return stripped;
    }

    private static String stripAssistantFragmentClientPrefixes(String s) {
        if (s == null) {
            return "";
        }
        return s.replaceAll("(?i)\\b(?:par|pour|de|du|des)\\s+(?:le\\s+|la\\s+|l'\\s*)?client(?:s)?\\s+", " ")
                .replaceAll("(?i)^client(?:s)?\\s+", "")
                .strip();
    }

    public static boolean haystackContains(InterventionPreventive p, String foldedSubstring) {
        if (foldedSubstring == null || foldedSubstring.length() < 2) {
            return true;
        }
        String hay = AssistantEntitySnapshotUtil.foldAccents(buildHaystack(p)).toLowerCase(Locale.ROOT);
        String compactHay = AssistantFrenchFieldAliases.compactAlphaNum(hay);
        String n = foldedSubstring.toLowerCase(Locale.ROOT).strip();
        if (hay.contains(n)) {
            return true;
        }
        String nc = AssistantFrenchFieldAliases.compactAlphaNum(n);
        return nc.length() >= 2 && compactHay.contains(nc);
    }

    static String buildHaystack(InterventionPreventive p) {
        StringBuilder sb = new StringBuilder();
        append(sb, "client", p.getNomClient());
        append(sb, "produit", p.getNomProduit());
        append(sb, "statut", p.getStatut() != null ? p.getStatut().name() : "");
        append(sb, "nbParAn", p.getNbInterventionsParAn() != null ? p.getNbInterventionsParAn().toString() : "");
        append(sb, "emailCommercial", p.getEmailCommercial());
        if (p.getCcMail() != null) {
            append(sb, "cc", String.join(",", p.getCcMail()));
        }
        appendDate(sb, "periodeDe", p.getPeriodeDe());
        appendDate(sb, "periodeA", p.getPeriodeA());
        appendDate(sb, "periodeRecommandeeDe", p.getPeriodeRecommandeDe());
        appendDate(sb, "periodeRecommandeeA", p.getPeriodeRecommandeA());
        appendDate(sb, "dateInterventionExigee", p.getDateInterventionExigee());
        appendDate(sb, "dateIntervention", p.getDateIntervention());
        appendDate(sb, "dateRapportPreventive", p.getDateRapportPreventive());
        append(sb, "fichier", p.getFichier());
        append(sb, "fichierOriginal", p.getFichierOriginalName());
        if (p.getContrat() != null && p.getContrat().getContratId() != null) {
            append(sb, "contratId", String.valueOf(p.getContrat().getContratId()));
        }
        if (p.getAssignedUsers() != null) {
            for (User u : p.getAssignedUsers()) {
                if (u != null) {
                    append(sb, "assigne", (u.getFirstname() != null ? u.getFirstname() : "") + " "
                            + (u.getLastname() != null ? u.getLastname() : "") + " " + (u.getEmail() != null ? u.getEmail() : ""));
                }
            }
        }
        if (p.getIntervenants() != null) {
            for (IntervenantPreventif iv : p.getIntervenants()) {
                if (iv != null && iv.getNom() != null && !iv.getNom().isBlank()) {
                    append(sb, "intervenant", iv.getNom());
                }
            }
        }
        List<PeriodeLigne> lignes = p.getPeriodeLignes();
        if (lignes != null) {
            int i = 0;
            for (PeriodeLigne pl : lignes) {
                i++;
                appendDate(sb, "l" + i + "_periodeDe", pl.getPeriodeDe());
                appendDate(sb, "l" + i + "_periodeA", pl.getPeriodeA());
                appendDate(sb, "l" + i + "_recDe", pl.getPeriodeRecommandeDe());
                appendDate(sb, "l" + i + "_recA", pl.getPeriodeRecommandeA());
                appendDate(sb, "l" + i + "_exigee", pl.getDateInterventionExigee());
                appendDate(sb, "l" + i + "_faite", pl.getDateIntervention());
                appendDate(sb, "l" + i + "_rapport", pl.getDateRapportPreventive());
                append(sb, "l" + i + "_rem", pl.getRemarque());
                append(sb, "l" + i + "_fic", pl.getFichier());
                if (pl.getIntervenants() != null) {
                    for (IntervenantPreventif iv : pl.getIntervenants()) {
                        if (iv != null && iv.getNom() != null && !iv.getNom().isBlank()) {
                            append(sb, "l" + i + "_iv", iv.getNom());
                        }
                    }
                }
            }
        }
        return sb.toString();
    }

    private static void append(StringBuilder sb, String k, String v) {
        if (v == null || v.isBlank()) {
            return;
        }
        sb.append(k).append('=').append(v).append('|');
    }

    private static void appendDate(StringBuilder sb, String k, LocalDate d) {
        if (d != null) {
            sb.append(k).append('=').append(d).append('|');
        }
    }

    /** Liste détaillée pour l’utilisateur : tous les champs racine + lignes de période. */
    public static String formatVerbose(InterventionPreventive p) {
        String cid = "?";
        if (p.getContrat() != null && p.getContrat().getContratId() != null) {
            cid = String.valueOf(p.getContrat().getContratId());
        }
        StringBuilder sb = new StringBuilder();
        sb.append("- #").append(p.getInterventionPreventiveId()).append(" | CLIENT=").append(nullToEmpty(p.getNomClient()));
        sb.append(" | PRODUIT=").append(nullToEmpty(p.getNomProduit()));
        sb.append(" | STATUT=").append(p.getStatut() != null ? p.getStatut().name() : "?");
        sb.append(" | NB_INTERV_AN=").append(p.getNbInterventionsParAn() != null ? p.getNbInterventionsParAn() : "?");
        sb.append(" | CONTRAT=").append(cid);
        sb.append("\n  EMAIL_COMM=").append(nullToEmpty(p.getEmailCommercial()));
        if (p.getCcMail() != null && !p.getCcMail().isEmpty()) {
            sb.append("\n  CC=").append(String.join(", ", p.getCcMail()));
        }
        sb.append("\n  PÉRIODE (contrat/admin)=").append(dates(p.getPeriodeDe(), p.getPeriodeA()));
        sb.append("\n  PÉRIODE_RECOMMANDÉE=").append(dates(p.getPeriodeRecommandeDe(), p.getPeriodeRecommandeA()));
        sb.append("\n  DATE_EXIGÉE=").append(d(p.getDateInterventionExigee()));
        sb.append(" | INTER_REALISEE=").append(d(p.getDateIntervention()));
        sb.append(" | RAPPORT_PRÉVENTIF=").append(d(p.getDateRapportPreventive()));
        sb.append("\n  FICHIER=").append(nullToEmpty(p.getFichier()));
        sb.append(" | FICHIER_NOM=").append(nullToEmpty(p.getFichierOriginalName()));
        sb.append("\n  ASSIGNÉS=").append(formatUsers(p));
        sb.append("\n  INTERVENANTS_FICHE=").append(namesIntervenants(p.getIntervenants()));

        sb.append(flagsNotifRoot(p));
        List<PeriodeLigne> lignes = p.getPeriodeLignes();
        if (lignes != null && !lignes.isEmpty()) {
            int n = 0;
            for (PeriodeLigne pl : lignes) {
                n++;
                sb.append("\n  … Ligne période #").append(pl.getPeriodeLigneId() != null ? pl.getPeriodeLigneId() : n);
                sb.append(": Période=").append(dates(pl.getPeriodeDe(), pl.getPeriodeA()));
                sb.append("; Recommandée=").append(dates(pl.getPeriodeRecommandeDe(), pl.getPeriodeRecommandeA()));
                sb.append("; Exigée=").append(d(pl.getDateInterventionExigee()));
                sb.append("; Faite=").append(d(pl.getDateIntervention()));
                sb.append("; Rapport=").append(d(pl.getDateRapportPreventive()));
                sb.append("; Remarque=").append(truncate(nullToEmpty(pl.getRemarque()), 160));
                sb.append("; Fichier=").append(nullToEmpty(pl.getFichier()));
                sb.append("; NotifPr=").append(periodeFlags(pl));
                sb.append("/Pério=").append(flag(pl.getEmailSentPeriode1WeekBefore()))
                        .append("/").append(flag(pl.getEmailSentPeriodeDayOf()));
                sb.append("; Intervenants_ligne=").append(namesIntervenants(pl.getIntervenants()));
            }
        }
        return sb.toString();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    private static String d(LocalDate x) {
        return x != null ? x.toString() : "?";
    }

    private static String dates(LocalDate a, LocalDate b) {
        if (a == null && b == null) {
            return "?";
        }
        return d(a) + " → " + d(b);
    }

    private static String namesIntervenants(List<IntervenantPreventif> list) {
        if (list == null || list.isEmpty()) {
            return "(aucun)";
        }
        return list.stream()
                .map(IntervenantPreventif::getNom)
                .map(s -> s == null ? "" : s.strip())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining(", "));
    }

    private static String formatUsers(InterventionPreventive p) {
        if (p.getAssignedUsers() == null || p.getAssignedUsers().isEmpty()) {
            return "(aucun)";
        }
        return p.getAssignedUsers().stream().map(u -> {
            String n = ((u.getFirstname() != null ? u.getFirstname() : "") + " "
                    + (u.getLastname() != null ? u.getLastname() : "")).trim();
            String e = u.getEmail() != null ? u.getEmail() : "";
            if (!n.isEmpty()) {
                return e.isEmpty() ? n : n + " <" + e + ">";
            }
            return e.isEmpty() ? "?" : e;
        }).collect(Collectors.joining(", "));
    }

    private static String flagsNotifRoot(InterventionPreventive p) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n  FLAGS_EMAIL=").append(flag(p.getEmailSent1WeekBefore()))
                .append("/").append(flag(p.getEmailSent1MonthBefore()))
                .append("/").append(flag(p.getEmailSentDayOf()))
                .append(" (sem/mois/jour)");
        return sb.toString();
    }

    private static String periodeFlags(PeriodeLigne pl) {
        return flag(pl.getEmailSent1WeekBefore()) + "/" + flag(pl.getEmailSent1MonthBefore()) + "/" + flag(pl.getEmailSentDayOf());
    }

    private static String flag(Boolean b) {
        if (b == null) {
            return "?";
        }
        return b ? "1" : "0";
    }
}
