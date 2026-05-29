package com.example.projet2024.service.esetimport;

import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.io.MemoryUsageSetting;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import org.apache.pdfbox.pdmodel.interactive.form.PDNonTerminalField;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;

/**
 * Extraction de texte pour l’import ESET : PDF (texte + champs formulaire), TXT,
 * et optionnellement OCR (Tesseract) pour les PDF scannés sans couche texte.
 */
@Service
public class EsetDocumentTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(EsetDocumentTextExtractor.class);

    @Value("${eset.import.ocr.enabled:false}")
    private boolean ocrEnabled;

    /** Dossier contenant les fichiers *.traineddata (ex. C:/Program Files/Tesseract-OCR/tessdata). */
    @Value("${eset.import.ocr.tessdata-path:}")
    private String tessdataPath;

    @Value("${eset.import.ocr.language:eng}")
    private String ocrLanguage;

    @Value("${eset.import.ocr.max-pages:10}")
    private int ocrMaxPages;

    @Value("${eset.import.ocr.render-dpi:200}")
    private int ocrRenderDpi;

    public String extractText(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide.");
        }
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String lower = original.toLowerCase(Locale.ROOT);
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";

        if (lower.endsWith(".pdf") || ct.contains("pdf")) {
            byte[] data = file.getBytes();
            return extractFromPdfBytes(data);
        }
        if (lower.endsWith(".txt") || ct.startsWith("text/plain")) {
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }
        throw new IllegalArgumentException("Format non pris en charge. Utilisez un PDF ou un fichier TXT.");
    }

    private String extractFromPdfBytes(byte[] data) throws IOException {
        MemoryUsageSetting mem = data.length > 6_000_000
                ? MemoryUsageSetting.setupTempFileOnly()
                : MemoryUsageSetting.setupMainMemoryOnly();

        try (PDDocument doc = PDDocument.load(new ByteArrayInputStream(data), mem)) {
            String fromStripper = stripText(doc, false);
            if (isMeaningful(fromStripper)) {
                return fromStripper.trim();
            }
            String sorted = stripText(doc, true);
            if (isMeaningful(sorted)) {
                return sorted.trim();
            }
            String fromForm = extractAcroFormText(doc);
            if (isMeaningful(fromForm)) {
                return fromForm.trim();
            }
            if (ocrEnabled) {
                String ocr = tryOcr(doc);
                if (isMeaningful(ocr)) {
                    return ocr.trim();
                }
            }
            return "";
        }
    }

    private static boolean isMeaningful(String s) {
        if (s == null) {
            return false;
        }
        String t = s.replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
        return t.length() >= 8;
    }

    private static String stripText(PDDocument doc, boolean sortByPosition) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(sortByPosition);
        stripper.setAddMoreFormatting(true);
        stripper.setSuppressDuplicateOverlappingText(false);
        return stripper.getText(doc);
    }

    private static String extractAcroFormText(PDDocument doc) {
        try {
            PDAcroForm form = doc.getDocumentCatalog().getAcroForm();
            if (form == null) {
                return "";
            }
            StringBuilder sb = new StringBuilder();
            for (PDField field : form.getFields()) {
                appendFieldText(sb, field);
            }
            return sb.toString();
        } catch (Exception e) {
            log.debug("AcroForm: {}", e.getMessage());
            return "";
        }
    }

    private static void appendFieldText(StringBuilder sb, PDField field) {
        if (field instanceof PDNonTerminalField) {
            for (PDField child : ((PDNonTerminalField) field).getChildren()) {
                appendFieldText(sb, child);
            }
            return;
        }
        try {
            String v = field.getValueAsString();
            if (v != null && !v.isBlank()) {
                String name = field.getPartialName() != null ? field.getPartialName() : field.getFullyQualifiedName();
                if (name != null && !name.isBlank()) {
                    sb.append(name).append(": ");
                }
                sb.append(v.trim()).append('\n');
            }
        } catch (Exception ignored) {
            // champs non textuels, etc.
        }
    }

    private String tryOcr(PDDocument doc) {
        try {
            ITesseract tesseract = new Tesseract();
            applyTessdataPath(tesseract);

            tesseract.setLanguage(ocrLanguage == null || ocrLanguage.isBlank() ? "eng" : ocrLanguage.trim());

            PDFRenderer renderer = new PDFRenderer(doc);
            int n = Math.min(doc.getNumberOfPages(), Math.max(1, ocrMaxPages));
            StringBuilder out = new StringBuilder();
            int dpi = Math.min(300, Math.max(96, ocrRenderDpi));
            for (int i = 0; i < n; i++) {
                BufferedImage image = renderer.renderImageWithDPI(i, dpi);
                out.append(tesseract.doOCR(image)).append('\n');
            }
            return out.toString();
        } catch (TesseractException e) {
            log.warn("OCR Tesseract: {}", e.getMessage());
            return "";
        } catch (UnsatisfiedLinkError e) {
            log.warn("OCR: bibliothèque native manquante — {}", e.getMessage());
            return "";
        } catch (Exception e) {
            log.warn("OCR: {}", e.getMessage());
            return "";
        }
    }

    private void applyTessdataPath(ITesseract tesseract) {
        if (tessdataPath != null && !tessdataPath.isBlank()) {
            tesseract.setDatapath(tessdataPath.trim());
            return;
        }
        String os = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (os.contains("win")) {
            Path p = Paths.get("C:/Program Files/Tesseract-OCR/tessdata");
            if (Files.isDirectory(p)) {
                tesseract.setDatapath(p.toString().replace('\\', '/'));
            }
        }
    }
}
