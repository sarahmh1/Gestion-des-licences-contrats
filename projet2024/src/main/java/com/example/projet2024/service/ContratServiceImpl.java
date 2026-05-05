package com.example.projet2024.service;

import com.example.projet2024.entite.Contrat;
import com.example.projet2024.entite.ContratSla;
import com.example.projet2024.entite.DateAvenant;
import com.example.projet2024.repository.ContratRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ContratServiceImpl implements IContratService {

    private static final Logger logger = LoggerFactory.getLogger(ContratServiceImpl.class);

    @Autowired
    private ContratRepository contratRepository;

    @Autowired
    private EmailService emailService;

    @Override
    public List<Contrat> getAllContrats() {
        return contratRepository.findAll();
    }

    @Override
    public Contrat getContratById(Long id) {
        return contratRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contrat non trouvé avec l'id: " + id));
    }

    @Override
    public Contrat addContrat(Contrat contrat) {
        // Initialiser tous les flags d'email à false
        contrat.setEmailSent30Days(false);
        contrat.setEmailSentDayOf(false);
        contrat.setEmailSent6Months(false);
        contrat.setEmailSent3Months(false);
        contrat.setEmailSent1Week(false);

        // Associer les dates avenants au contrat
        if (contrat.getDatesAvenants() != null) {
            for (DateAvenant da : contrat.getDatesAvenants()) {
                da.setContrat(contrat);
            }
        }

        // Associer les SLA (criticité + délais) au contrat
        if (contrat.getSlaList() != null) {
            for (ContratSla sla : contrat.getSlaList()) {
                sla.setContrat(contrat);
            }
        }
        return contratRepository.save(contrat);
    }

    @Override
    public Contrat updateContrat(Long id, Contrat contrat) {
        Contrat existingContrat = getContratById(id);
        
        existingContrat.setClient(contrat.getClient());
        existingContrat.setObjetContrat(contrat.getObjetContrat());
        existingContrat.setNbInterventionsPreventives(contrat.getNbInterventionsPreventives());
        existingContrat.setNbInterventionsCuratives(contrat.getNbInterventionsCuratives());
        existingContrat.setDateDebut(contrat.getDateDebut());
        existingContrat.setDateFin(contrat.getDateFin());
        existingContrat.setRenouvelable(contrat.getRenouvelable());
        existingContrat.setRemarque(contrat.getRemarque());
        existingContrat.setEmailCommercial(contrat.getEmailCommercial());
        existingContrat.setCcMail(contrat.getCcMail());
        existingContrat.setNomProduit(contrat.getNomProduit());
        existingContrat.setCriticite(contrat.getCriticite());
        existingContrat.setDelaiMaxIntervention(contrat.getDelaiMaxIntervention());
        existingContrat.setDelaiMaxResolution(contrat.getDelaiMaxResolution());

        // Mettre à jour les dates avenants
        existingContrat.getDatesAvenants().clear();
        if (contrat.getDatesAvenants() != null) {
            for (DateAvenant da : contrat.getDatesAvenants()) {
                da.setContrat(existingContrat);
                existingContrat.getDatesAvenants().add(da);
            }
        }

        // Mettre à jour les SLA (criticité + délais en heures)
        existingContrat.getSlaList().clear();
        if (contrat.getSlaList() != null) {
            for (ContratSla sla : contrat.getSlaList()) {
                sla.setContrat(existingContrat);
                existingContrat.getSlaList().add(sla);
            }
        }

        return contratRepository.save(existingContrat);
    }

    @Override
    public void deleteContrat(Long id) {
        contratRepository.deleteById(id);
    }

    @Override
    public List<Contrat> searchContrats(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllContrats();
        }
        
        List<Contrat> byClient = contratRepository.findByClientContainingIgnoreCase(searchTerm);
        List<Contrat> byObjet = contratRepository.findByObjetContratContainingIgnoreCase(searchTerm);
        
        return Stream.concat(byClient.stream(), byObjet.stream())
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public void updateContratFile(Long id, String fichier, String fichierOriginalName) {
        Contrat contrat = getContratById(id);
        contrat.setFichier(fichier);
        contrat.setFichierOriginalName(fichierOriginalName);
        contratRepository.save(contrat);
    }

    /**
     * Envoie un email de test pour vérifier la configuration SMTP
     */
    @Transactional
    public void sendTestEmail(Contrat contrat) {
        String sujet = "TEST - Email de test Contrat #" + contrat.getContratId();
        String contenu = "<html><body>" +
                "<h2>Email de Test</h2>" +
                "<p>Ceci est un email de test pour le contrat:</p>" +
                "<ul>" +
                "<li><strong>ID:</strong> " + contrat.getContratId() + "</li>" +
                "<li><strong>Client:</strong> " + contrat.getClient() + "</li>" +
                "<li><strong>Date Fin:</strong> " + contrat.getDateFin() + "</li>" +
                "</ul>" +
                "<p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>" +
                "</body></html>";
        
        List<String> ccMails = contrat.getCcMail() != null ? contrat.getCcMail() : List.of();
        
        System.out.println("=== TEST EMAIL ===");
        System.out.println("Destinataire: " + contrat.getEmailCommercial());
        System.out.println("CC: " + ccMails);
        System.out.println("Sujet: " + sujet);
        
        emailService.sendEsetNotification(
                contrat.getEmailCommercial(),
                ccMails,
                sujet,
                contenu
        );
        
        System.out.println("=== EMAIL TEST ENVOYÉ ===");
    }

    /**
     * Vérifie les contrats expirants et envoie des notifications par email.
     * - 30 jours avant la date de fin
     * - Le jour même de la fin du contrat
     */
    @Transactional
    @Scheduled(cron = "*/10 * * * * ?") // Test: toutes les 10 secondes (changer en "0 0 8 * * ?" pour production)
    public void checkForExpiringContrats() {
        logger.info("=== DEBUT Verification des contrats expirants ===");
        LocalDate today = LocalDate.now();
        List<Contrat> allContrats = contratRepository.findAll();
        logger.info("Nombre total de contrats: {}", allContrats.size());

        for (Contrat contrat : allContrats) {
            if (contrat.getDateFin() == null || contrat.getEmailCommercial() == null || contrat.getEmailCommercial().isEmpty()) {
                continue;
            }

            long days = ChronoUnit.DAYS.between(today, contrat.getDateFin());
            logger.info("Contrat {} - {} - jours restants: {}", contrat.getContratId(), contrat.getClient(), days);

            // ── 6 mois avant (175-185 jours) ──────────────────────────────────
            if (days >= 175 && days <= 185 && !Boolean.TRUE.equals(contrat.getEmailSent6Months())) {
                if (sendExpirationEmail(contrat, (int) days)) {
                    contrat.setEmailSent6Months(true);
                    contratRepository.save(contrat);
                    logger.info("Email 6 mois envoye pour contrat {}", contrat.getContratId());
                }
            }

            // ── 3 mois avant (88-92 jours) ────────────────────────────────────
            if (days >= 88 && days <= 92 && !Boolean.TRUE.equals(contrat.getEmailSent3Months())) {
                if (sendExpirationEmail(contrat, (int) days)) {
                    contrat.setEmailSent3Months(true);
                    contratRepository.save(contrat);
                    logger.info("Email 3 mois envoye pour contrat {}", contrat.getContratId());
                }
            }

            // ── 1 semaine avant (6-8 jours) ───────────────────────────────────
            if (days >= 6 && days <= 8 && !Boolean.TRUE.equals(contrat.getEmailSent1Week())) {
                if (sendExpirationEmail(contrat, (int) days)) {
                    contrat.setEmailSent1Week(true);
                    contratRepository.save(contrat);
                    logger.info("Email 1 semaine envoye pour contrat {}", contrat.getContratId());
                }
            }

            // ── 30 jours avant (28-32 jours) ──────────────────────────────────
            if (days >= 28 && days <= 32 && !Boolean.TRUE.equals(contrat.getEmailSent30Days())) {
                if (sendExpirationEmail(contrat, (int) days)) {
                    contrat.setEmailSent30Days(true);
                    contratRepository.save(contrat);
                    logger.info("Email 30 jours envoye pour contrat {}", contrat.getContratId());
                }
            }

            // ── Jour J (0-1 jours) ────────────────────────────────────────────
            if (days >= 0 && days <= 1 && !Boolean.TRUE.equals(contrat.getEmailSentDayOf())) {
                if (sendExpirationEmail(contrat, (int) days)) {
                    contrat.setEmailSentDayOf(true);
                    contratRepository.save(contrat);
                    logger.info("Email Jour J envoye pour contrat {}", contrat.getContratId());
                }
            }
        }
        logger.info("=== FIN Verification des contrats expirants ===");
    }

    /**
     * Envoie un email de notification d'expiration de contrat.
     * @return true si l'email a été envoyé avec succès, false sinon
     */
    private boolean sendExpirationEmail(Contrat contrat, int daysRemaining) {
        logger.info("==> sendExpirationEmail appelée pour contrat {} avec {} jours restants", contrat.getContratId(), daysRemaining);
        logger.info("==> Email destinataire: {}", contrat.getEmailCommercial());
        logger.info("==> CC Mails: {}", contrat.getCcMail());
        
        String sujet;
        String urgence;
        String couleurUrgence;

        if (daysRemaining >= 175) {
            // ~6 mois avant
            sujet = "📅 Information: Contrat expire dans 6 mois - " + contrat.getClient();
            urgence = "INFORMATION - 6 MOIS";
            couleurUrgence = "#3498db";
        } else if (daysRemaining >= 88) {
            // ~3 mois avant
            sujet = "⏰ Rappel: Contrat expire dans 3 mois - " + contrat.getClient();
            urgence = "RAPPEL - 3 MOIS";
            couleurUrgence = "#8e44ad";
        } else if (daysRemaining >= 6) {
            // ~1 semaine avant
            sujet = "⚠️ URGENT: Contrat expire dans 1 semaine - " + contrat.getClient();
            urgence = "URGENT - 1 SEMAINE";
            couleurUrgence = "#e67e22";
        } else if (daysRemaining >= 28) {
            // ~30 jours avant
            sujet = "⚠️ Rappel: Contrat expire dans " + daysRemaining + " jours - " + contrat.getClient();
            urgence = "RAPPEL - " + daysRemaining + " JOURS";
            couleurUrgence = "#f39c12";
        } else if (daysRemaining == 1) {
            sujet = "🚨 URGENT: Contrat expire DEMAIN - " + contrat.getClient();
            urgence = "EXPIRATION DEMAIN";
            couleurUrgence = "#e74c3c";
        } else {
            sujet = "🚨 URGENT: Contrat expire AUJOURD'HUI - " + contrat.getClient();
            urgence = "EXPIRATION AUJOURD'HUI";
            couleurUrgence = "#e74c3c";
        }

        String contenu = "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='background-color: " + couleurUrgence + "; color: white; padding: 15px; text-align: center;'>" +
                "<h2 style='margin: 0;'>" + urgence + "</h2>" +
                "</div>" +
                "<div style='padding: 20px;'>" +
                "<h3>Détails du Contrat</h3>" +
                "<table style='width: 100%; border-collapse: collapse;'>" +
                "<tr style='background-color: #f8f9fa;'>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'><strong>Client</strong></td>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'>" + contrat.getClient() + "</td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'><strong>Objet du Contrat</strong></td>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'>" + (contrat.getObjetContrat() != null ? contrat.getObjetContrat() : "N/A") + "</td>" +
                "</tr>" +
                "<tr style='background-color: #f8f9fa;'>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'><strong>Date de Début</strong></td>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'>" + (contrat.getDateDebut() != null ? contrat.getDateDebut().toString() : "N/A") + "</td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'><strong>Date de Fin</strong></td>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6; color: " + couleurUrgence + "; font-weight: bold;'>" + contrat.getDateFin().toString() + "</td>" +
                "</tr>" +
                "<tr style='background-color: #f8f9fa;'>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'><strong>Renouvelable</strong></td>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'>" + (Boolean.TRUE.equals(contrat.getRenouvelable()) ? "Oui" : "Non") + "</td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'><strong>Interventions Préventives</strong></td>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'>" + (contrat.getNbInterventionsPreventives() != null ? contrat.getNbInterventionsPreventives() : "N/A") + "</td>" +
                "</tr>" +
                "<tr style='background-color: #f8f9fa;'>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'><strong>Interventions Curatives</strong></td>" +
                "<td style='padding: 10px; border: 1px solid #dee2e6;'>" + (contrat.getNbInterventionsCuratives() != null ? contrat.getNbInterventionsCuratives() : "N/A") + "</td>" +
                "</tr>" +
                "</table>" +
                (contrat.getRemarque() != null && !contrat.getRemarque().isEmpty() ? 
                    "<div style='margin-top: 15px; padding: 10px; background-color: #fff3cd; border-radius: 5px;'>" +
                    "<strong>Remarque:</strong> " + contrat.getRemarque() + "</div>" : "") +
                "<p style='margin-top: 20px; color: #666;'>Ce message est envoyé automatiquement par le système de gestion des contrats.</p>" +
                "</div>" +
                "</body></html>";

        try {
            logger.info("==> Appel emailService.sendEsetNotification...");
            List<String> ccMails = contrat.getCcMail() != null ? contrat.getCcMail() : List.of();
            emailService.sendEsetNotification(
                    contrat.getEmailCommercial(),
                    ccMails,
                    sujet,
                    contenu
            );
            System.out.println("Email envoyé pour contrat " + contrat.getContratId() + " - Client: " + contrat.getClient());
            logger.info("==> Email envoyé avec SUCCÈS pour contrat {}", contrat.getContratId());
            return true;
        } catch (Exception e) {
            System.err.println("Erreur envoi email Contrat: " + e.getMessage());
            logger.error("==> ERREUR lors de l'envoi de l'email pour le contrat {}: {}", contrat.getContratId(), e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
