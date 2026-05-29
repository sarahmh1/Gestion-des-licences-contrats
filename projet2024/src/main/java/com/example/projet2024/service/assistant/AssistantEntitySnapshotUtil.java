package com.example.projet2024.service.assistant;

import com.example.projet2024.entite.LicenceFortinet;

import java.lang.reflect.Method;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Lecture « formulaire » (getters Java) sans exposer tout le graphe JPA à l’infini. */
public final class AssistantEntitySnapshotUtil {

    private static final Pattern ACCENT_STRIP = Pattern.compile("\\p{M}+");

    private AssistantEntitySnapshotUtil() {}

    public static String foldAccents(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        String nfd = Normalizer.normalize(s, Normalizer.Form.NFD);
        return ACCENT_STRIP.matcher(nfd).replaceAll("").toLowerCase(Locale.ROOT);
    }

    public static Optional<String> extractLicenseClientPhrase(String haystackMixedCase) {
        if (haystackMixedCase == null || haystackMixedCase.isBlank()) {
            return Optional.empty();
        }
        Pattern[] patterns = {
                Pattern.compile(
                        "(?i)\\b(?:par|pour|de|du|des)\\s+(?:le\\s+|la\\s+|l['’]\\s*)?client(?:s)?\\s+(.+?)(?=\\s*[!?.…]|\\s+c['’]est\\b|\\s+cest\\b|\\s+quantit|\\s+combien|\\s+nombre|\\s+ligne|\\s+licence|\\s|$)"),
                Pattern.compile(
                        "(?i)^client(?:s)?\\s+(.+?)(?=\\s*[!?.…]|\\s+c['’]est\\b|\\s+combien|\\s+nombre|\\s+quantit|\\s|$)")
        };
        for (Pattern p : patterns) {
            var m = p.matcher(haystackMixedCase.strip());
            if (m.find()) {
                String n = stripLicenseCapture(m.group(1));
                if (n.length() >= 2) {
                    return Optional.of(n);
                }
            }
        }
        return Optional.empty();
    }

    private static String stripLicenseCapture(String s) {
        if (s == null || s.isBlank()) {
            return "";
        }
        String t = s.strip().replaceFirst("^[\"'«»]+", "").strip();
        t = t.replaceAll("[!?.,;:…]+\\s*$", "").strip();
        t = t.replaceAll("(?i)\\s+(c['’]est|cest|qu['’]est-ce|combien)\\s.+$", "").strip();
        return t.replaceAll("(\\s|\\p{Punct})+$", "").strip();
    }

    /** Client courant dans les formulaires licences (colonnes « Client »). */
    public static Optional<String> readClient(Object bean) {
        if (bean == null) {
            return Optional.empty();
        }
        for (String accessor : Arrays.asList("getClient", "getNomClient")) {
            Optional<String> hit = invokeStringGetter(bean, accessor);
            if (hit.isPresent() && !hit.get().isBlank()) {
                return hit;
            }
        }
        return Optional.empty();
    }

    /** true si aucun critère résiduel, ou bien une chaîne de la fiche correspond (accent-insensible + alias FR). */
    public static boolean matchesFreeTextResidual(Object bean, Optional<String> residualFoldedLower) {
        if (bean == null || residualFoldedLower.isEmpty() || residualFoldedLower.get().length() < 2) {
            return true;
        }
        String needle = residualFoldedLower.get().strip().toLowerCase(Locale.ROOT);
        String hay = AssistantFrenchFieldAliases.haystackForMatching(bean);
        String hayCompact = AssistantFrenchFieldAliases.compactAlphaNum(hay);
        for (String nd : AssistantFrenchFieldAliases.needlesForResidualMatch(needle)) {
            if (nd == null || nd.length() < 2) {
                continue;
            }
            String n = nd.strip().toLowerCase(Locale.ROOT);
            if (hay.contains(n)) {
                return true;
            }
            String nc = AssistantFrenchFieldAliases.compactAlphaNum(n);
            if (nc.length() >= 2 && hayCompact.contains(nc)) {
                return true;
            }
        }
        return false;
    }

    /** true si le nom client sur la ligne correspond (tolérance accents et sous-chaîne). */
    public static boolean clientMatches(Optional<String> needleOpt, Optional<String> rowClient) {
        if (needleOpt.isEmpty()) {
            return true;
        }
        if (rowClient.isEmpty()) {
            return false;
        }
        String foldedNeedle = foldAccents(needleOpt.get());
        if (foldedNeedle.length() < 2) {
            return true;
        }
        String foldedHay = foldAccents(rowClient.get());
        return foldedHay.contains(foldedNeedle) || foldedNeedle.contains(foldedHay);
    }

    public static boolean wantsQuantityExplanation(String loweredFrench) {
        if (loweredFrench == null) {
            return false;
        }
        String f = loweredFrench.replace("œ", "oe").toLowerCase(Locale.FRENCH);
        return f.contains("quantit") || f.contains("combien") || f.contains("nombre")
                || f.contains("volume") || f.contains("total") || f.contains("somme")
                || f.contains("sommer") || f.contains("lignes licences");
    }

    public static long accumulateQuantityIndicators(Object bean) {
        long fromChildren = sumLicencesQuantite(bean);
        long fromParent = sumNumericQtyGetters(bean);
        if (fromChildren > 0) {
            return fromChildren + fromParent;
        }
        return fromParent;
    }

    private static long sumNumericQtyGetters(Object bean) {
        long sum = 0;
        for (Method m : bean.getClass().getMethods()) {
            if (m.getParameterCount() != 0 || !m.getName().startsWith("get") || "getClass".equals(m.getName())) {
                continue;
            }
            Class<?> rt = m.getReturnType();
            if (!(rt.equals(int.class) || rt.equals(Integer.class) || rt.equals(long.class) || rt.equals(Long.class))) {
                continue;
            }
            if (!looksLikeLicenceQtyGetter(m.getName())) {
                continue;
            }
            try {
                Object v = m.invoke(bean);
                if (v instanceof Number n) {
                    sum += n.longValue();
                }
            } catch (ReflectiveOperationException ignored) {
                // ignore proxy / lazy
            }
        }
        return sum;
    }

    private static boolean looksLikeLicenceQtyGetter(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        if ("getnmb_tlf".equals(n)) {
            return false;
        }
        return n.contains("nombre") || n.contains("quantit") || n.contains("qty")
                || n.contains("effectif") || n.contains("countlic");
    }

    /** Somme les `quantité` sous-fiches LicenceFortinet lorsque présentes. */
    public static long sumLicencesQuantite(Object bean) {
        Optional<Method> m = findLicencesGetter(bean);
        if (m.isEmpty()) {
            return 0;
        }
        try {
            Object raw = m.get().invoke(bean);
            if (!(raw instanceof List<?> list)) {
                return 0;
            }
            long sum = 0;
            for (Object row : list) {
                if (row instanceof LicenceFortinet lf) {
                    sum += parseQuantiteText(lf.getQuantite());
                }
            }
            if (sum == 0 && !list.isEmpty()) {
                return list.size();
            }
            return sum;
        } catch (ReflectiveOperationException e) {
            return 0;
        }
    }

    private static long parseQuantiteText(String quantiteStr) {
        if (quantiteStr == null) {
            return 0;
        }
        String t = quantiteStr.strip().replace(" ", "").replace('\u00a0', ' ');
        if (t.isEmpty()) {
            return 0;
        }
        try {
            return Long.parseLong(t.replace(',', '.'));
        } catch (NumberFormatException ignored) {
            return 1;
        }
    }

    private static Optional<Method> findLicencesGetter(Object bean) {
        try {
            return Optional.of(bean.getClass().getMethod("getLicences"));
        } catch (NoSuchMethodException e) {
            return Optional.empty();
        }
    }

    private static Optional<String> invokeStringGetter(Object target, String name) {
        try {
            Method m = target.getClass().getMethod(name);
            if (m.getParameterCount() != 0 || !String.class.equals(m.getReturnType())) {
                return Optional.empty();
            }
            Object r = m.invoke(target);
            return Optional.ofNullable((String) r);
        } catch (ReflectiveOperationException e) {
            return Optional.empty();
        }
    }

    public static Map<String, String> flattenSimpleProperties(Object bean, int maxKeys) {
        Map<String, String> out = new LinkedHashMap<>();
        if (bean == null || maxKeys <= 0) {
            return out;
        }

        appendLicencesBlock(bean, out, maxKeys);

        Method[] ms = bean.getClass().getMethods();
        Arrays.sort(ms, Comparator.comparing(Method::getName));
        int added = out.size();

        for (Method m : ms) {
            if (added >= maxKeys || m.getParameterCount() != 0 || !m.getName().startsWith("get")
                    || "getClass".equals(m.getName()) || "getLicences".equals(m.getName())) {
                continue;
            }
            String label = prettifyGetter(m.getName());
            if ("Licences résumé".equals(label) || out.containsKey(label)) {
                continue;
            }
            Class<?> rt = m.getReturnType();

            Object v;
            try {
                v = m.invoke(bean);
            } catch (ReflectiveOperationException e) {
                continue;
            }
            if (v == null || isSkippableValue(v, rt)) {
                continue;
            }

            if (v instanceof String s && !s.isBlank()) {
                out.put(label, truncate(s.strip(), 200));
                added++;
            } else if (v instanceof Enum<?> en) {
                out.put(label, en.name());
                added++;
            } else if (v instanceof LocalDate ld) {
                out.put(label, ld.toString());
                added++;
            } else if (v instanceof LocalDateTime ldt) {
                out.put(label, ldt.toString());
                added++;
            } else if (v instanceof Number n) {
                out.put(label, n.toString());
                added++;
            } else if (v instanceof Boolean b) {
                out.put(label, b ? "oui" : "non");
                added++;
            } else if (v instanceof Collection<?> col && !col.isEmpty() && elementLooksSimple(col)) {
                out.put(label, col.stream().map(Object::toString).limit(5).collect(Collectors.joining(", ")));
                added++;
            }
        }

        return out;
    }

    private static void appendLicencesBlock(Object bean, Map<String, String> out, int maxKeys) {
        if (out.size() >= maxKeys) {
            return;
        }
        Optional<Method> m = findLicencesGetter(bean);
        if (m.isEmpty()) {
            return;
        }
        try {
            Object raw = m.get().invoke(bean);
            if (!(raw instanceof List<?> list) || list.isEmpty()) {
                return;
            }
            StringBuilder sb = new StringBuilder().append(list.size()).append(" ligne(s) : ");
            int k = 0;
            for (Object row : list) {
                if (k >= 8) {
                    sb.append("…");
                    break;
                }
                if (row instanceof LicenceFortinet lf) {
                    if (k > 0) {
                        sb.append(" ; ");
                    }
                    sb.append(truncate(nullToEmpty(lf.getNomDesLicences()), 60))
                            .append(" [qty ")
                            .append(nullToEmpty(lf.getQuantite()))
                            .append(", exp ")
                            .append(lf.getDateEx() != null ? lf.getDateEx().toString() : "?")
                            .append("]");
                    k++;
                }
            }
            out.put("Licences résumé", truncate(sb.toString(), 400));
        } catch (ReflectiveOperationException ignored) {
            // ignore
        }
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static boolean elementLooksSimple(Collection<?> col) {
        Object f = col.iterator().next();
        return f instanceof String || (f != null && f.getClass().isEnum());
    }

    private static boolean isSkippableValue(Object v, Class<?> rt) {
        if (v instanceof Collection<?> col) {
            if (col.isEmpty()) {
                return true;
            }
            return !elementLooksSimple(col);
        }
        if (Map.class.isAssignableFrom(rt)) {
            return true;
        }
        String p = v.getClass().getPackageName();
        if (p.startsWith("com.example.projet2024.entite") && !(v instanceof Enum<?>)) {
            return true;
        }
        return false;
    }

    private static String prettifyGetter(String name) {
        if (name.length() <= 3 || !name.startsWith("get")) {
            return name;
        }
        String core = name.substring(3);
        if (core.isEmpty()) {
            return name;
        }
        return Character.toLowerCase(core.charAt(0)) + core.substring(1);
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max - 1) + "…";
    }

    public static String formatBeanLine(Object bean) {
        Map<String, String> map = flattenSimpleProperties(bean, 36);
        return map.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining(" | "));
    }
}
