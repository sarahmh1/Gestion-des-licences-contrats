package com.example.projet2024.service.assistant;

import com.example.projet2024.service.IAlwarebytesService;
import com.example.projet2024.service.IBitdefenderService;
import com.example.projet2024.service.ICiscoService;
import com.example.projet2024.service.ICrowdstrikeService;
import com.example.projet2024.service.IEsetService;
import com.example.projet2024.service.IF5Service;
import com.example.projet2024.service.IFortinetService;
import com.example.projet2024.service.IFortraService;
import com.example.projet2024.service.IImpervaService;
import com.example.projet2024.service.IInfobloxService;
import com.example.projet2024.service.IMicrosoftO365Service;
import com.example.projet2024.service.INetskopeService;
import com.example.projet2024.service.IOneIdentityService;
import com.example.projet2024.service.IPaloService;
import com.example.projet2024.service.IProofpointService;
import com.example.projet2024.service.IRapid7Service;
import com.example.projet2024.service.ISecPointService;
import com.example.projet2024.service.ISentineIOneService;
import com.example.projet2024.service.ISplunkService;
import com.example.projet2024.service.IVMwareService;
import com.example.projet2024.service.IVeeamService;
import com.example.projet2024.service.IVaronisService;
import com.example.projet2024.service.IWallixService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Associe une question (mot-clé éditeur) aux listes licences déjà persistées ({@code retrieveAll…}).
 */
@Service
public class AssistantLicenseRegistryService {

    public record LicenseBucket(String id, String label, List<String> triggersNormalized, Supplier<List<?>> loader) {}

    private final List<LicenseBucket> buckets;
    private final Map<String, LicenseBucket> bucketsById;
    private final List<TriggerHit> triggersSortedLongFirst;

    private record TriggerHit(String substring, LicenseBucket bucket) {}

    @Autowired
    public AssistantLicenseRegistryService(
            IEsetService esetService,
            IFortinetService fortinetService,
            IVeeamService veeamService,
            IPaloService paloService,
            ICiscoService ciscoService,
            IVMwareService vmwareService,
            ISplunkService splunkService,
            IWallixService wallixService,
            IInfobloxService infobloxService,
            IVaronisService varonisService,
            IImpervaService impervaService,
            IRapid7Service rapid7Service,
            ISecPointService secPointService,
            IProofpointService proofpointService,
            IMicrosoftO365Service microsoftO365Service,
            ICrowdstrikeService crowdstrikeService,
            INetskopeService netskopeService,
            IOneIdentityService oneIdentityService,
            IAlwarebytesService alwarebytesService,
            IBitdefenderService bitdefenderService,
            IF5Service f5Service,
            ISentineIOneService sentineIOneService,
            IFortraService fortraService
    ) {
        List<LicenseBucket> bb = new ArrayList<>();
        bb.add(bucket("eset", "ESET", List.of("eset", "e-set"), esetService::retrieveAllESETs));
        bb.add(bucket("fortinet", "Fortinet", List.of("fortinet"), fortinetService::retrieveAllFortinets));
        bb.add(bucket("veeam", "Veeam", List.of("veeam", "vee am"), veeamService::retrieveAllVeeams));
        bb.add(bucket("palo", "Palo Alto", List.of("palo alto", "paloalto", "palo"), paloService::retrieveAllPalos));
        bb.add(bucket("cisco", "Cisco", List.of("cisco"), ciscoService::retrieveAllCiscos));
        bb.add(bucket("vmware", "VMware", List.of("vmware", "vm ware"), vmwareService::retrieveAllVMwares));
        bb.add(bucket("splunk", "Splunk", List.of("splunk"), splunkService::retrieveAllSplunks));
        bb.add(bucket("wallix", "Wallix", List.of("wallix"), wallixService::retrieveAllWallixs));
        bb.add(bucket("infoblox", "Infoblox", List.of("infoblox"), infobloxService::retrieveAllInfobloxs));
        bb.add(bucket("varonis", "Varonis", List.of("varonis"), varonisService::retrieveAllVaroniss));
        bb.add(bucket("imperva", "Imperva", List.of("imperva"), impervaService::retrieveAllImpervas));
        bb.add(bucket("rapid7", "Rapid7", List.of("rapid7", "rapid 7"), rapid7Service::retrieveAllRapid7s));
        bb.add(bucket("secpoint", "SecPoint", List.of("secpoint", "sec point"), secPointService::retrieveAllSecPoints));
        bb.add(bucket("proofpoint", "Proofpoint", List.of("proofpoint", "proof point"), proofpointService::retrieveAllProofpoints));
        bb.add(bucket("microsoft365", "Microsoft 365", List.of("microsoft 365", "office 365", "microsoft office", "microsoft", "o365"), microsoftO365Service::retrieveAllMicrosoftO365s));
        bb.add(bucket("crowdstrike", "CrowdStrike", List.of("crowdstrike", "crowd strike"), crowdstrikeService::retrieveAllCrowdstrikes));
        bb.add(bucket("netskope", "Netskope", List.of("netskope"), netskopeService::retrieveAllNetskopes));
        bb.add(bucket("oneidentity", "One Identity", List.of("one identity", "oneidentity"), oneIdentityService::retrieveAllOneIdentitys));
        bb.add(bucket("malwarebytes", "Malwarebytes", List.of("malwarebytes", "alwarebytes"), alwarebytesService::retrieveAllAlwarebytess));
        bb.add(bucket("bitdefender", "Bitdefender", List.of("bitdefender", "bit defender"), bitdefenderService::retrieveAllBitdefenders));
        bb.add(bucket("f5", "F5", List.of("f5"), f5Service::retrieveAllF5s));
        bb.add(bucket("sentinelone", "SentinelOne", List.of("sentinel one", "sentinelone"), sentineIOneService::retrieveAllSentineIOnes));
        bb.add(bucket("fortra", "Fortra", List.of("fortra"), fortraService::retrieveAllFortras));
        buckets = List.copyOf(bb);

        bucketsById = buckets.stream().collect(Collectors.toMap(LicenseBucket::id, b -> b, (a, b) -> a, LinkedHashMap::new));

        List<TriggerHit> th = new ArrayList<>();
        for (LicenseBucket b : buckets) {
            for (String t : b.triggersNormalized()) {
                th.add(new TriggerHit(AssistantEntitySnapshotUtil.foldAccents(t).replaceAll("\\s+", " ").strip(), b));
            }
        }
        th.sort(Comparator.comparingInt(o -> -o.substring().length()));
        triggersSortedLongFirst = List.copyOf(th);
    }

    private static LicenseBucket bucket(String id, String label, List<String> triggersNormalized, Supplier<List<?>> loader) {
        List<String> norm = triggersNormalized.stream()
                .map(AssistantEntitySnapshotUtil::foldAccents)
                .map(s -> s.replace('\u00a0', ' ').replaceAll("\\s+", " "))
                .toList();
        return new LicenseBucket(id, label, norm, loader);
    }

    public Optional<String> resolveProductFromQuestion(String loweredFrench, String foldedAccentsAlready) {
        String norm = foldAndSpace(loweredFrench, foldedAccentsAlready);
        for (TriggerHit th : triggersSortedLongFirst) {
            if (norm.contains(th.substring())) {
                return Optional.of(th.bucket().id());
            }
        }
        return Optional.empty();
    }

    private static String foldAndSpace(String loweredFrench, String foldedAccentsAlready) {
        String base = foldedAccentsAlready != null && !foldedAccentsAlready.isEmpty()
                ? foldedAccentsAlready
                : AssistantEntitySnapshotUtil.foldAccents(loweredFrench);
        return base.replace('\u00a0', ' ').replaceAll("\\s+", " ").strip();
    }

    public Optional<LicenseBucket> getBucket(String id) {
        return Optional.ofNullable(bucketsById.get(id));
    }

    public List<LicenseBucket> allBuckets() {
        return buckets;
    }

    public long grandTotalLicenceRecords() {
        long n = 0;
        for (LicenseBucket b : buckets) {
            List<Object> l = safeLoad(b.loader());
            n += l.size();
        }
        return n;
    }

    public String summarizeCountsAllProducts(int maxProductLines) {
        StringBuilder sb = new StringBuilder("Répartition des fiches licences / produits (par module) :\n");
        int shown = 0;
        for (LicenseBucket b : buckets) {
            if (shown >= maxProductLines) {
                sb.append("(… autres produits : voir aide)\n");
                break;
            }
            List<Object> list = safeLoad(b.loader());
            sb.append("- ").append(b.label()).append(" : ").append(list.size()).append(" fiche(s)\n");
            shown++;
        }
        sb.append("Total enregistrements (toutes familles ci-dessus) : ").append(grandTotalLicenceRecords()).append(" .\n");
        return sb.toString().stripTrailing();
    }

    public String factualProductDeepQuery(String bucketId, String rawMessage, int maxLines) {
        LicenseBucket bucket = bucketsById.get(bucketId);
        if (bucket == null) {
            return "Produit inconnu.";
        }

        List<Object> rows = safeLoad(bucket.loader());
        Locale fr = Locale.FRENCH;

        String lowered = rawMessage.toLowerCase(fr);
        boolean wantQty = AssistantEntitySnapshotUtil.wantsQuantityExplanation(lowered);

        Optional<String> clientNeedleRaw = AssistantEntitySnapshotUtil.extractLicenseClientPhrase(rawMessage);

        Optional<String> residualFolded = deriveResidualFolded(rawMessage, lowered, bucket, clientNeedleRaw);

        List<Object> filtered = rows.stream()
                .map(r -> r)
                .filter(r -> AssistantEntitySnapshotUtil.clientMatches(clientNeedleRaw, AssistantEntitySnapshotUtil.readClient(r)))
                .filter(r -> AssistantEntitySnapshotUtil.matchesFreeTextResidual(r, residualFolded))
                .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            return bucket.label()
                    + " — aucune fiche après filtre (client / mots saisis introuvable). Critères utilisés : "
                    + describeCriteria(clientNeedleRaw, residualFolded)
                    + " . Ensemble total hors filtre : "
                    + rows.size()
                    + " fiches.";
        }

        StringBuilder out = new StringBuilder();
        out.append(bucket.label()).append(" — ").append(filtered.size()).append(" / ").append(rows.size()).append(" fiche(s) sélectionnée(s).\n");
        out.append("(Champs présentés comme sur le formulaire : propriétés simples + lignes sous-licences lorsqu’elles existent.)\n");
        out.append(describeCriteria(clientNeedleRaw, residualFolded)).append("\n");

        if (wantQty) {
            long units = filtered.stream().mapToLong(AssistantEntitySnapshotUtil::accumulateQuantityIndicators).sum();
            out.append(String.format(Locale.FRENCH,
                    "Indicateurs de quantité cumulés (nombre / sous-lignes licence) pour la sélection : %d unité(s).\n",
                    units));
        }

        int cap = Math.max(6, Math.min(maxLines, 120));
        int i = 0;
        for (Object row : filtered) {
            if (i >= cap) {
                break;
            }
            out.append("- ").append(AssistantEntitySnapshotUtil.formatBeanLine(row)).append("\n");
            i++;
        }
        if (filtered.size() > cap) {
            out.append("(… ").append(filtered.size() - cap).append(" fiche(s) supplémentaires — affinez le client ou un mot précis pour une liste courte.)\n");
        }

        return out.toString().stripTrailing();
    }

    /** Texte recherche après retrait nom produit et expression « client ». */
    Optional<String> deriveResidualFolded(String rawMixed, String loweredFr, LicenseBucket bucket, Optional<String> clientPhrase) {
        String work = loweredFr.replace('\u00a0', ' ');
        List<String> trigs = bucket.triggersNormalized().stream()
                .sorted(Comparator.comparingInt(s -> -s.length()))
                .toList();
        for (String t : trigs) {
            work = Pattern.compile(Pattern.quote(t), Pattern.CASE_INSENSITIVE).matcher(work).replaceAll(" ");
        }
        work = work.replaceAll("\\b(eset|licences?|licence\\s+fiche|combien|quantit[eé]s?|nombre|total|liste|pour|avec|dont|voir|montre)\\b", " ");

        if (clientPhrase.isPresent()) {
            String cpLow = clientPhrase.get().toLowerCase(Locale.FRENCH);
            work = Pattern.compile(Pattern.quote(cpLow), Pattern.LITERAL).matcher(work).replaceAll(" ");
        }

        Pattern clientPat = Pattern.compile(
                "(?i)\\b(?:par|pour|de|du|des)\\s+(?:le\\s+|la\\s+|l['’]\\s*)?client(?:s)?\\s+.+?$");
        work = clientPat.matcher(work).replaceFirst(" ");
        work = Pattern.compile("(?i)^client(?:s)?\\s+.+?$").matcher(work.strip()).replaceFirst(" ");

        work = AssistantEntitySnapshotUtil.foldAccents(work.replaceAll("\\s+", " ").strip());
        if (work.length() < 2) {
            return Optional.empty();
        }
        return Optional.of(work.toLowerCase(Locale.ROOT));
    }

    private static String describeCriteria(Optional<String> clientNeedleRaw, Optional<String> residualFolded) {
        StringBuilder sb = new StringBuilder("Critères — ");
        if (clientNeedleRaw.isPresent()) {
            sb.append("client≈« ").append(clientNeedleRaw.get().strip()).append(" »");
        } else {
            sb.append("client=sans filtre");
        }
        if (residualFolded.isPresent()) {
            sb.append(" ; mots=").append(residualFolded.get());
        } else {
            sb.append(" ; mots=aucun");
        }
        sb.append('.');
        return sb.toString();
    }

    private static List<Object> safeLoad(Supplier<List<?>> loader) {
        try {
            List<?> raw = loader.get();
            return raw != null ? new ArrayList<>(raw) : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }
}
