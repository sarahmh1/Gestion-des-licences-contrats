package com.example.projet2024.service.assistant;

import com.example.projet2024.dto.assistant.AssistantChatResponse;
import com.example.projet2024.entite.Contrat;
import com.example.projet2024.entite.ESET;
import com.example.projet2024.entite.InterventionCurative;
import com.example.projet2024.entite.InterventionPreventive;
import com.example.projet2024.entite.Produit;
import com.example.projet2024.entite.Client;
import com.example.projet2024.repository.ClientRepository;
import com.example.projet2024.service.IContratService;
import com.example.projet2024.service.IEsetService;
import com.example.projet2024.service.IInterventionCurativeService;
import com.example.projet2024.service.IInterventionPreventiveService;
import com.example.projet2024.service.ProduitServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Routage léger + lecture des données existantes ({@link IEsetService}, contrats, etc.).
 * Réponse brute ou reformulée par Ollama local si disponible.
 */
@Service
public class AssistantOrchestratorService {

    private static final int MAX_LINES = 40;
    private static final int SHORT_QUERY_LEN = 200;

    /** Ex. « pour le client », « de client X c'est quoi son statut ». */
    private static final Pattern[] INTERVENTION_CLIENT_NAME_PATTERNS = {
            Pattern.compile(
                    "(?i)\\b(?:par|pour|de|du|des)\\s+(?:le\\s+|la\\s+|l['’]\\s*)?client(?:s)?\\s+(.+?)(?=\\s*[!?.…]|\\s+c['’]est\\b|\\s+cest\\b|\\s+qu['’]est|\\s+quoi\\b|\\s+son\\s+statut|\\s+statut\\b|$)"),
            Pattern.compile("(?i)^client\\s+(.+?)(?=\\s*[!?.…]|\\s+c['’]est\\b|\\s+cest\\b|\\s+statut\\b|$)")
    };

    @Autowired
    private IEsetService esetService;
    @Autowired
    private IContratService contratService;
    @Autowired
    private IInterventionCurativeService interventionCurativeService;
    @Autowired
    private IInterventionPreventiveService interventionPreventiveService;
    @Autowired
    private ProduitServiceImpl produitService;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private OllamaClientService ollamaClientService;
    @Autowired
    private AssistantLicenseRegistryService licenseRegistry;

    @Value("${assistant.ollama.enabled:false}")
    private boolean ollamaEnabled;

    /** Quand le client n’envoie pas rephraseWithLlm : false = pas d’attente Ollama. */
    @Value("${assistant.ollama.rephrase-default:false}")
    private boolean ollamaRephraseDefault;

    private record AssistRoute(Intent intent, Optional<String> licenceBucketId) {}

    enum Intent {
        HELP,
        STATS,
        ESET_EXPIRING,
        LICENCES_PRODUCT,
        CONTRATS,
        INTERVENTIONS,
        CLIENTS,
        PRODUITS
    }

    public AssistantChatResponse answer(String rawQuestion, Boolean rephraseWithLlmRequest) {
        if (rawQuestion == null || rawQuestion.strip().length() == 0) {
            return new AssistantChatResponse(
                    "Écrivez une question sur les licences (Veeam, Cisco, Palo, Microsoft 365, etc.), les contrats, les interventions curatives ou préventives, ou les clients.",
                    "EMPTY", false, null);
        }
        String msg = rawQuestion.strip();
        if (msg.length() > SHORT_QUERY_LEN) {
            msg = msg.substring(0, SHORT_QUERY_LEN);
        }

        AssistRoute route = classifyRoute(msg);
        String factual = buildFactual(route, msg);

        if (factual == null || factual.isBlank()) {
            return new AssistantChatResponse("Je n’ai pas trouvé de données pour cette demande.", intentTag(route), false, null);
        }

        boolean wantRephrase = rephraseWithLlmRequest != null
                ? Boolean.TRUE.equals(rephraseWithLlmRequest)
                : ollamaRephraseDefault;

        // L’aide doit rester fidèle au guide serveur (pas de reformulation LLM).
        if (route.intent() == Intent.HELP) {
            wantRephrase = false;
        }

        OllamaRephraseOutcome ollamaOutcome = OllamaRephraseOutcome.skipped();
        if (ollamaEnabled && wantRephrase) {
            ollamaOutcome = ollamaClientService.tryRephrase(rawQuestion.strip(), factual);
        }
        Optional<String> polished = ollamaOutcome.text();
        boolean llmUsed = polished.isPresent();
        String answer = polished.orElse(factual);

        String warning = null;
        if (ollamaEnabled && wantRephrase && !llmUsed) {
            warning = ollamaOutcome.userVisibleFailure()
                    .map(d -> "Reformulation Ollama indisponible — " + d + " Réponse affichée = données brutes.")
                    .orElse("Ollama est activé mais n’a pas répondu. Réponse = données brutes.");
        }

        return new AssistantChatResponse(answer, intentTag(route), llmUsed, warning);
    }

    private static String intentTag(AssistRoute r) {
        if (r.intent() == Intent.LICENCES_PRODUCT && r.licenceBucketId().isPresent()) {
            return Intent.LICENCES_PRODUCT.name() + "[" + r.licenceBucketId().get() + "]";
        }
        return r.intent().name();
    }

    /**
     * Interventions préventives/curatives passent avant le nom d’un éditeur pour éviter
     * les questions du type « intervention Pal… » reliées aux licences Palo.
     */
    private AssistRoute classifyRoute(String msg) {
        String l = msg.toLowerCase(Locale.FRENCH).replace('\u2019', '\'');
        String folded = AssistantEntitySnapshotUtil.foldAccents(l).replace('\u00a0', ' ').replaceAll("\\s+", " ");

        if (matchesHelp(l)) {
            return new AssistRoute(Intent.HELP, Optional.empty());
        }

        boolean mentioningEset = l.contains("eset") || l.contains("e-set") || folded.contains("eset");
        boolean expiryAngle = l.contains("expir") || l.contains("échéance") || l.contains("echeance")
                || l.contains("expires") || l.contains("expiration")
                || l.matches("(?s).*(echéance des licences|échéances des licences).*");
        if (mentioningEset && expiryAngle) {
            return new AssistRoute(Intent.ESET_EXPIRING, Optional.empty());
        }

        boolean wantsStat = l.contains("combien") || l.contains("stat") || l.contains("nombre") || l.contains("total")
                || l.contains("tableau de bord") || l.contains("resume") || l.contains("résumé");

        boolean interventionCue = l.contains("intervention") || l.contains("criticit") || l.contains("criticité")
                || l.contains("preventiv") || l.contains("prévent") || l.contains("preventif") || l.contains("préventif")
                || l.contains("preventive");

        if (interventionCue) {
            return new AssistRoute(Intent.INTERVENTIONS, Optional.empty());
        }

        if (l.contains("contrat")) {
            return new AssistRoute(Intent.CONTRATS, Optional.empty());
        }
        if (l.contains("client")) {
            return new AssistRoute(Intent.CLIENTS, Optional.empty());
        }
        if (l.contains("produit") || l.contains("catalogue") || l.contains("référentiel") || l.contains("referentiel")) {
            return new AssistRoute(Intent.PRODUITS, Optional.empty());
        }

        Optional<String> licenceProduct = licenseRegistry.resolveProductFromQuestion(l, folded);
        if (licenceProduct.isPresent()) {
            return new AssistRoute(Intent.LICENCES_PRODUCT, licenceProduct);
        }

        if (wantsStat && (l.contains("licence") || l.contains("ligne") || l.contains("enregistr") || l.contains("entrée"))) {
            return new AssistRoute(Intent.STATS, Optional.empty());
        }

        if (wantsStat) {
            return new AssistRoute(Intent.STATS, Optional.empty());
        }

        return new AssistRoute(Intent.HELP, Optional.empty());
    }

    private boolean matchesHelp(String l) {
        return l.equals("aide") || l.equals("help") || l.startsWith("?") || l.contains("exemple")
                || l.contains("que peux") || l.contains("que peut") || l.contains("comment utiliser");
    }

    private String buildFactual(AssistRoute route, String originalMixedCase) {
        return switch (route.intent()) {
            case HELP -> factualHelp();
            case STATS -> factualStats();
            case ESET_EXPIRING -> factualEsetExpiring(originalMixedCase);
            case LICENCES_PRODUCT -> route.licenceBucketId()
                    .map(id -> licenseRegistry.factualProductDeepQuery(id, originalMixedCase, MAX_LINES))
                    .orElse("Indiquez un éditeur ou produit (ex. Veeam, ESET, Palo, Microsoft 365…).");
            case CONTRATS -> factualContrats(originalMixedCase);
            case INTERVENTIONS -> factualInterventions(originalMixedCase);
            case CLIENTS -> factualClients();
            case PRODUITS -> factualProduits();
        };
    }

    private String factualHelp() {
        return """
                ═══════════════════════════════════════════════════════════════
                AIDE — Assistant métier (super admin / première connexion)
                ═══════════════════════════════════════════════════════════════

                Principe : vous écrivez une question en français ; la réponse est construite à partir des \
                données réellement enregistrées dans cette application (contrats, licences, clients, interventions). \
                Rien n’est inventé par l’assistant.

                Commande : tapez « aide », « help », « ? » ou « exemple » pour afficher ce guide.

                ─── Vue d’ensemble (mots-clés) ───
                • « clients » — liste des clients.
                • « produits » ou « catalogue » — produits actifs du référentiel.
                • « contrat » ou « contrats » + mots-clés — recherche sur contrats (client, objet, remarque, etc.).
                • « combien » / « total » / « résumé » + « licences » — statistiques globales par famille de produits.
                • Nom d’un éditeur (voir liste ci-dessous) — fiches licences détaillées + filtres.
                • « intervention » — curatif et/ou préventif selon votre formulation (voir section dédiée).

                ─── Licences par éditeur (placer le nom dans la phrase) ───
                ESET, Fortinet, Veeam, Palo Alto / Palo, Cisco, VMware, Splunk, Wallix, Infoblox, Varonis, Imperva, \
                Rapid7, SecPoint, Proofpoint, Microsoft 365 / Office 365 / O365, CrowdStrike, Netskope, \
                One Identity, Malwarebytes, Bitdefender, F5, SentinelOne, Fortra.

                Filtres utiles :
                • Client : « Veeam pour le client NOM », « ESET du client NOM ».
                • Quantité : « combien », « quantité », « nombre », « volume » (ex. « ESET du client X combien de licences »).
                • Texte / champ : tout mot présent sur la fiche (ex. identifiant, mail, numéro de série, clé…) ; \
                  libellés français reconnus : série, clé de licence, expiration, sous contrat, contact, mail, \
                  administrateur, CC, durée, remarque, identifiant, téléphone, fichier, approuvé, etc.
                • ESET + échéances : « ESET expire », « ESET échéance », « ESET sous 12 mois ».

                Exemples (copier-coller en les adaptant) :
                « liste des clients »
                « produits actifs »
                « combien de licences au total »
                « Fortinet pour le client DUPONT »
                « Veeam du client SOCIETE quantité »
                « ESET identifiant ABC-123456789 »
                « Microsoft 365 pour le client NOM mail admin »
                « Splunk numéro de série XYZ »
                « ESET qui expire dans les 6 mois »

                ─── Contrats ───
                « contrats » — liste large ; « contrat maintenance » — recherche par mots sur le contrat.

                ─── Interventions curatives ───
                Utilisez idéalement « curatif », « criticité » ou « assigné » pour cibler le bon module.
                Exemples :
                « interventions curatives »
                « criticité C1 »
                « intervention pour le client NOM »
                « assigné à prenom.nom@entreprise.fr »
                « interventions contrat 42 » ou « contrat #42 »

                ─── Interventions préventives ───
                Mettez « préventive », « préventif » ou « prevent » dans la phrase.
                Exemples :
                « interventions préventives pour le client NOM »
                « préventives terminées »
                « preventive a planifier »
                « préventives mars 2026 »
                « préventives période recommandée mai 2025 »
                « intervention préventive contrat #12 en cours »

                Statuts en base (affichés tels quels) : CREE, EN_ATTENTE_INTERVENTION, EN_COURS, TERMINE.
                « à planifier » / « a planifier » / « en attente » : toutes les fiches non terminées (pas TERMINE).

                Si vous dites seulement « intervention » sans préciser préventif/curatif : les deux blocs sont proposés \
                (extraits limités).

                ─── Options d’affichage ───
                Les listes sont tronquées (quelques dizaines de lignes ou quelques fiches détaillées) : affinez avec \
                client, n° de contrat, mois/année ou éditeur.

                ─── Reformulation (Ollama), hors aide ───
                La case « Reformuler avec Ollama » reformule certaines réponses ; pour le mot « aide », le texte \
                ci-dessus est toujours affiché tel quel (guide stable).""";
    }

    private String factualStats() {
        List<Contrat> contrats = contratService.getAllContrats();
        List<InterventionCurative> intsCur = interventionCurativeService.getAllInterventionsCuratives();
        List<InterventionPreventive> intsPre = interventionPreventiveService.getAllInterventionsPreventives();
        long clients = clientRepository.count();
        String perProduct = licenseRegistry.summarizeCountsAllProducts(22);

        return String.format(Locale.FRENCH,
                "%s%nRésumé transversal — Contrats : %d | Curatives : %d | Préventives : %d | Clients : %d%n",
                perProduct.stripTrailing(),
                contrats.size(), intsCur.size(), intsPre.size(), clients);
    }

    private String factualEsetExpiring(String raw) {
        int months = extractMonths(raw).orElse(6);
        List<ESET> esets = esetService.retrieveAllESETs();
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusMonths(months);
        esets = esets.stream()
                .filter(e -> e.getDateEx() != null)
                .filter(e -> !e.getDateEx().isBefore(today))
                .filter(e -> !e.getDateEx().isAfter(horizon))
                .sorted(Comparator.comparing(ESET::getDateEx))
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder("ESET avec expiration avant ou le ")
                .append(horizon)
                .append(" (≤ ")
                .append(months)
                .append(" mois), max ").append(MAX_LINES).append(" :\n");
        esets.stream().limit(MAX_LINES).forEach(e -> sb.append("- Client: ").append(nullToEmpty(e.getClient()))
                .append(" | Nom produit: ").append(e.getNom_produit() != null ? e.getNom_produit().name() : "?")
                .append(" | Expiration: ").append(e.getDateEx())
                .append("\n"));
        if (esets.size() > MAX_LINES) {
            sb.append("(… ").append(esets.size() - MAX_LINES).append(" lignes supplémentaires)\n");
        }
        return sb.toString().stripTrailing();
    }

    private Optional<Integer> extractMonths(String raw) {
        Matcher m = Pattern.compile("(\\d+)\\s*mois", Pattern.CASE_INSENSITIVE).matcher(raw);
        if (m.find()) {
            try {
                return Optional.of(Integer.parseInt(m.group(1)));
            } catch (NumberFormatException ignored) {
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    private String factualContrats(String raw) {
        String term = raw.replaceAll("(?i)contrat(s)?", " ").trim();
        List<Contrat> contrats = term.length() < 3
                ? contratService.getAllContrats()
                : contratService.searchContrats(term.substring(0, Math.min(term.length(), 160)));

        StringBuilder sb = new StringBuilder("Contrats trouvés (max ").append(MAX_LINES).append(") — champs formulaire synthétiques) :\n");
        contrats.stream().limit(MAX_LINES).forEach(c -> {
            String rem = nullToEmpty(c.getRemarque());
            String remShort = rem.length() > 120 ? rem.substring(0, 117) + "…" : rem;
            sb.append("- #").append(c.getContratId())
                    .append(" | Client: ").append(nullToEmpty(c.getClient()))
                    .append(" | Objet: ").append(nullToEmpty(c.getObjetContrat()))
                    .append(" | Produit contrat: ").append(nullToEmpty(c.getNomProduit()))
                    .append(" | Criticité: ").append(nullToEmpty(c.getCriticite()))
                    .append(" | Nb prév.: ").append(nullToEmpty(c.getNbInterventionsPreventives()))
                    .append(" | Nb cur.: ").append(nullToEmpty(c.getNbInterventionsCuratives()))
                    .append(" | Délais (j) intervention=").append(c.getDelaiMaxIntervention() != null ? c.getDelaiMaxIntervention().toString() : "?")
                    .append(" résolution=").append(c.getDelaiMaxResolution() != null ? c.getDelaiMaxResolution().toString() : "?")
                    .append(" | Début: ").append(c.getDateDebut() != null ? c.getDateDebut().toString() : "?")
                    .append(" | Fin: ").append(c.getDateFin() != null ? c.getDateFin().toString() : "?")
                    .append(" | Remarque: ").append(remShort)
                    .append("\n");
        });
        if (contrats.size() > MAX_LINES) {
            sb.append("(… ").append(contrats.size() - MAX_LINES).append(" de plus)\n");
        }
        return sb.toString().stripTrailing();
    }

    private String factualInterventions(String raw) {
        String lo = raw.toLowerCase(Locale.FRENCH).replace('\u2019', '\'');
        boolean curFocus = interventionCurativeFocus(lo, raw);
        boolean preFocus = interventionPreventiveFocus(lo) && !curFocus;
        boolean bothDefault = lo.contains("intervention") && !curFocus && !preFocus;

        Matcher mContrat = Pattern.compile("(?i)contrat\\s*#?\\s*(\\d{1,18})").matcher(raw);
        if (mContrat.find()) {
            try {
                long cid = Long.parseLong(mContrat.group(1));
                List<InterventionCurative> curatives = interventionCurativeService.getByContratId(cid);
                List<InterventionPreventive> preventives = interventionPreventiveService.getByContratId(cid);
                if (preFocus && !curFocus) {
                    List<InterventionPreventive> preFiltered = AssistantPreventiveQuerySupport.applyFilters(preventives, raw);
                    return renderPreventiveBlock(preFiltered,
                            "Préventives liées au contrat #" + cid + " (filtres dans la phrase pris en compte)",
                            MAX_LINES);
                }
                if (curFocus && !preFocus) {
                    return renderInterventionBlock(curatives, "Curatives liées au contrat #" + cid);
                }
                StringBuilder fusion = new StringBuilder();
                fusion.append(renderInterventionBlockLimited(curatives, "Curatives contrat #" + cid, MAX_LINES / 2 + 12))
                        .append("\n\n")
                        .append(renderPreventiveBlock(
                                AssistantPreventiveQuerySupport.applyFilters(preventives, raw),
                                "Préventives contrat #" + cid,
                                MAX_LINES / 2 + 12));
                return fusion.toString().stripTrailing();
            } catch (NumberFormatException ignored) {
                // suite : recherche générique
            }
        }

        if (preFocus && !curFocus) {
            return factualInterventionsPreventiveOnly(raw);
        }
        if (curFocus || !bothDefault) {
            return factualInterventionsCurativeOnly(raw);
        }

        String curPart = factualInterventionsCurativeOnly(raw);
        String prevPart = factualInterventionsPreventiveOnly(raw);
        return "════════ Interventions curatives ════════\n"
                + curPart
                + "\n\n════════ Interventions préventives ════════\n"
                + prevPart;
    }

    /** Filtres typiques « runbook » curatif (sans le mot générique intervention seul). */
    private boolean interventionCurativeFocus(String lowered, String mixedCaseRaw) {
        if (Pattern.compile("(?i)criticit(?:é|e)\\s*[.:]?").matcher(mixedCaseRaw).find()) {
            return true;
        }
        if (lowered.contains("curativ") || lowered.contains("assigné") || lowered.contains("assignee")
                || lowered.contains("utilisateur")) {
            return true;
        }
        return false;
    }

    /** Motifs maintenance / prévention sans curatif forcé (évite de noyer Palo préventif côté licences). */
    private boolean interventionPreventiveFocus(String lowered) {
        return lowered.contains("prévent") || lowered.contains("prevent") || lowered.contains("préventif")
                || lowered.contains("preventif");
    }

    private List<InterventionPreventive> searchPreventivesByNomClientFlexible(String clientPart) {
        if (clientPart == null || clientPart.strip().length() < 2) {
            return List.of();
        }
        String trimmed = clientPart.strip();
        List<InterventionPreventive> primary = interventionPreventiveService.searchInterventionsPreventives(
                trimmed.substring(0, Math.min(trimmed.length(), 160)));
        if (!primary.isEmpty()) {
            return primary;
        }
        String folded = AssistantEntitySnapshotUtil.foldAccents(trimmed);
        if (folded.length() < 2) {
            return List.of();
        }
        return interventionPreventiveService.getAllInterventionsPreventives().stream()
                .filter(ip -> ip.getNomClient() != null
                        && AssistantEntitySnapshotUtil.foldAccents(ip.getNomClient()).contains(folded))
                .collect(Collectors.toList());
    }

    private String factualInterventionsPreventiveOnly(String raw) {
        String cleanedPreventiveLead = raw
                .replaceAll("(?i)intervention(s)?\\s+(prévent(ives?)?|preventiv(es?)?)", " ")
                .strip();

        List<InterventionPreventive> list;
        String title;

        Optional<String> clientFilter = extractInterventionClientName(raw, cleanedPreventiveLead);
        if (clientFilter.isPresent()) {
            String cn = clientFilter.get();
            list = searchPreventivesByNomClientFlexible(cn);
            title = "Interventions préventives — client « " + cn + " » (+ statuts / périodes si demandés)";
        } else {
            String term = stripAssistantFragment(AssistantPreventiveQuerySupport.stripMetaForFreeTextSearch(cleanedPreventiveLead));
            if (term.isBlank() || term.length() < 2) {
                list = interventionPreventiveService.getAllInterventionsPreventives();
                title = "Interventions préventives (liste complète + filtres statut/période si présents)";
            } else {
                List<InterventionPreventive> byNom = interventionPreventiveService.searchInterventionsPreventives(
                        term.substring(0, Math.min(term.length(), 160)));
                if (!byNom.isEmpty()) {
                    list = byNom;
                    title = "Préventives (recherche client « " + term + " » puis filtres)";
                } else {
                    String foldedNeedle = AssistantEntitySnapshotUtil.foldAccents(term).toLowerCase(Locale.ROOT);
                    list = interventionPreventiveService.getAllInterventionsPreventives().stream()
                            .filter(ip -> AssistantPreventiveQuerySupport.haystackContains(ip, foldedNeedle))
                            .collect(Collectors.toList());
                    title = "Préventives (recherche plein texte produit/remarques/assignés « " + term + " »)";
                }
            }
        }

        List<InterventionPreventive> filtered = AssistantPreventiveQuerySupport.applyFilters(list, raw);
        return renderPreventiveBlock(filtered, title + " — " + filtered.size() + " / " + list.size() + " après filtres ", MAX_LINES);
    }

    /** Corps historique réservé aux curatives (+ chemins critiques / assignés / client / recherche). */
    private String factualInterventionsCurativeOnly(String raw) {
        String cleanedLead = raw.replaceAll("(?i)intervention(s)?\\s+(curativ(es?)?)", " ").trim();

        Matcher mContrat = Pattern.compile("(?i)contrat\\s*#?\\s*(\\d{1,18})").matcher(raw);
        if (mContrat.find()) {
            try {
                long cid = Long.parseLong(mContrat.group(1));
                List<InterventionCurative> list = interventionCurativeService.getByContratId(cid);
                return renderInterventionBlock(list, "Interventions curatives liées au contrat #" + cid);
            } catch (NumberFormatException ignored) {
                // suite
            }
        }

        Matcher mCritLabel = Pattern.compile("(?i)criticit(?:é|e)\\s*[.:]?\\s*(\\S+)").matcher(raw);
        if (mCritLabel.find()) {
            String crit = interventionCritToken(mCritLabel.group(1));
            if (!crit.isEmpty()) {
                List<InterventionCurative> list = interventionCurativeService.searchByCriticite(crit);
                return renderInterventionBlock(list, "Curatives dont la criticité contient « " + crit + " »");
            }
        }

        Matcher mAssign = Pattern.compile("(?i)(?:assigné|assignee)\\s*(?:à|a)\\s+(.+)").matcher(cleanedLead);
        if (!mAssign.find()) {
            mAssign = Pattern.compile("(?i)pour\\s+l'?\\s*utilisateur\\s+(.+)").matcher(cleanedLead);
        }
        if (mAssign.find()) {
            String termAssign = stripAssistantFragment(mAssign.group(1));
            if (termAssign.length() >= 2) {
                List<InterventionCurative> list = interventionCurativeService.searchByUserAssignee(termAssign);
                return renderInterventionBlock(list, "Curatives (assigné) contenant « " + termAssign + " »");
            }
        }

        Optional<String> clientFilter = extractInterventionClientName(raw, cleanedLead);
        if (clientFilter.isPresent()) {
            String cn = clientFilter.get();
            List<InterventionCurative> list = interventionCurativeService.searchByClientName(cn);
            return renderInterventionBlock(list, "Curatives dont le client correspond à « " + cn + " »");
        }

        String term = stripAssistantFragment(cleanedLead);
        List<InterventionCurative> list;
        String title;
        if (term.isBlank() || term.length() < 2) {
            list = interventionCurativeService.getAllInterventionsCuratives();
            title = "Interventions curatives (liste complète)";
        } else {
            list = interventionCurativeService.searchInterventionsCuratives(term.substring(0, Math.min(term.length(), 160)));
            title = "Curatives (recherche « " + term + " »)";
        }
        return renderInterventionBlock(list, title);
    }

    private String renderInterventionBlockLimited(List<InterventionCurative> list, String title, int max) {
        return renderCurativeSlice(list, title, max);
    }

    private String renderInterventionBlock(List<InterventionCurative> list, String title) {
        return renderCurativeSlice(list, title, MAX_LINES);
    }

    private String renderCurativeSlice(List<InterventionCurative> list, String title, int max) {
        StringBuilder sb = new StringBuilder(title).append(" — affichage ").append(max).append(" max :\n");
        if (list.isEmpty()) {
            sb.append("— Aucune intervention curative ne correspond dans la base (filtre ou libellés clients différents).\n");
            return sb.toString().stripTrailing();
        }
        list.stream().limit(Math.max(1, Math.min(max, 240))).forEach(i -> sb.append(formatOneIntervention(i)).append("\n"));
        if (list.size() > max) {
            sb.append("(… ").append(list.size() - max).append(" autres — affinez criticité / client / n° contrat.)\n");
        }
        return sb.toString().stripTrailing();
    }

    private String renderPreventiveBlock(List<InterventionPreventive> list, String title, int maxLines) {
        int maxCards = Math.max(2, Math.min(18, maxLines / 2));
        StringBuilder sb = new StringBuilder(title).append(" — affichage détaillé (max ").append(maxCards)
                .append(" fiches, champs racine + lignes de période) :\n");
        if (list.isEmpty()) {
            sb.append("— Aucune intervention préventive ne correspond (client, texte libre, statut, ou croisement de dates).\n");
            sb.append("  Statuts techniques : CREE, EN_ATTENTE_INTERVENTION, EN_COURS, TERMINE.\n");
            return sb.toString().stripTrailing();
        }
        list.stream().limit(maxCards).forEach(p -> sb.append(AssistantPreventiveQuerySupport.formatVerbose(p)).append("\n"));
        if (list.size() > maxCards) {
            sb.append("(… ").append(list.size() - maxCards)
                    .append(" autres — affinez mois/année, client ou contrat.)\n");
        }
        return sb.toString().stripTrailing();
    }

    private String formatOneIntervention(InterventionCurative i) {
        return String.format(Locale.FRENCH,
                "- #%d | Client: %s | Produit: %s | Criticité: %s | Assignés: %s | Résolu: %s | En cours résol.: %s",
                i.getInterventionCurativeId(),
                nullToEmpty(i.getNomClient()),
                nullToEmpty(i.getNomProduit()),
                nullToEmpty(i.getCriticite()),
                formatAssignees(i),
                boolFr(i.getResolu()),
                boolFr(i.getEnCoursDeResolution()));
    }

    private static String boolFr(Boolean b) {
        if (b == null) {
            return "?";
        }
        return b ? "oui" : "non";
    }

    private String formatAssignees(InterventionCurative i) {
        if (i.getAssignedUsers() == null || i.getAssignedUsers().isEmpty()) {
            return "(aucun)";
        }
        return i.getAssignedUsers().stream().map(u -> {
            String fn = u.getFirstname() != null ? u.getFirstname() : "";
            String ln = u.getLastname() != null ? u.getLastname() : "";
            String name = (fn + " " + ln).trim();
            String mail = u.getEmail() != null ? u.getEmail() : "";
            if (name.isEmpty()) {
                return mail;
            }
            return mail.isEmpty() ? name : name + " <" + mail + ">";
        }).collect(Collectors.joining(", "));
    }

    private String factualClients() {
        List<Client> clients = clientRepository.findAll();
        StringBuilder sb = new StringBuilder("Clients (max ").append(MAX_LINES).append(") :\n");
        clients.stream().limit(MAX_LINES).forEach(c -> sb.append("- #").append(c.getId())
                .append(" | ").append(nullToEmpty(c.getNomClient()))
                .append(" | mails: ").append(c.getAdressesMail() != null ? String.join(", ", c.getAdressesMail()) : "")
                .append("\n"));
        if (clients.size() > MAX_LINES) {
            sb.append("(… ").append(clients.size() - MAX_LINES).append(" de plus)\n");
        }
        return sb.toString().stripTrailing();
    }

    private String factualProduits() {
        try {
            List<Produit> prods = produitService.getAllProduitsActifs();
            StringBuilder sb = new StringBuilder("Produits actifs référencés (max ").append(MAX_LINES).append(") :\n");
            prods.stream().limit(MAX_LINES).forEach(p -> sb.append("- ").append(nullToEmpty(p.getLabel())).append(" (code ").append(nullToEmpty(p.getCode())).append(")\n"));
            if (prods.size() > MAX_LINES) {
                sb.append("(… ").append(prods.size() - MAX_LINES).append(" de plus)\n");
            }
            return sb.toString().stripTrailing();
        } catch (Exception e) {
            return "Impossible de lire les produits actifs.";
        }
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    /** Nettoie le jeton après « criticité », ex. « C1 » ou « P2». */
    private static String interventionCritToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return "";
        }
        return stripAssistantFragment(rawToken.replaceAll("^[,\\s;:]+", ""));
    }

    private static Optional<String> extractInterventionClientName(String raw, String cleanedLead) {
        for (String haystack : new String[] { cleanedLead, raw }) {
            if (haystack == null || haystack.isBlank()) {
                continue;
            }
            for (Pattern p : INTERVENTION_CLIENT_NAME_PATTERNS) {
                Matcher m = p.matcher(haystack);
                if (m.find()) {
                    String name = stripAssistantFragment(trimClientNameFollowupNoise(m.group(1)));
                    if (name.length() >= 2) {
                        return Optional.of(name);
                    }
                }
            }
        }
        return Optional.empty();
    }

    /** Coupe « c'est quoi son statut », etc., après le nom du client. */
    private static String trimClientNameFollowupNoise(String captured) {
        if (captured == null) {
            return "";
        }
        String t = captured.strip();
        t = t.replaceAll("(?i)\\s+(c['’]est|cest|qu['’]est-ce|qu['’]est|donne|indique)\\s.+$", "").strip();
        t = t.replaceAll("(?i)\\s+(son|leur|sa|le|la|les)\\s+statut\\b.*$", "").strip();
        t = t.replaceAll("(?i)\\s+statut\\b.*$", "").strip();
        return t;
    }

    /** Retire guillemets / ponctuation en fin de requête (ex. « vitalait ? » → « vitalait »). */
    private static String stripAssistantFragment(String s) {
        if (s == null || s.isBlank()) {
            return "";
        }
        String t = s.strip().replaceFirst("^[\"'«»]+", "").strip();
        t = t.replaceAll("[!?.,;:…]+\\s*$", "").strip();
        return t.replaceAll("(\\s|\\p{Punct})+$", "").strip();
    }
}
