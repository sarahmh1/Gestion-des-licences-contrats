package com.example.projet2024.service;

import com.example.projet2024.entite.InterventionPreventive;
import com.example.projet2024.entite.IntervenantPreventif;
import com.example.projet2024.entite.PeriodeLigne;
import com.example.projet2024.entite.User;
import com.example.projet2024.Enum.StatutInterventionPreventive;
import com.example.projet2024.repository.InterventionPreventiveRepository;
import com.example.projet2024.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class InterventionPreventiveServiceImpl implements IInterventionPreventiveService {

    private static final Logger logger = LoggerFactory.getLogger(InterventionPreventiveServiceImpl.class);

    @Autowired
    private InterventionPreventiveRepository interventionPreventiveRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<InterventionPreventive> getAllInterventionsPreventives() {
        return interventionPreventiveRepository.findAll();
    }

    @Override
    public InterventionPreventive getInterventionPreventiveById(Long id) {
        return interventionPreventiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Intervention Préventive non trouvée avec l'id: " + id));
    }

    @Override
    public InterventionPreventive addInterventionPreventive(InterventionPreventive intervention) {
        // Initialiser les flags d'email à false pour permettre l'envoi des
        // notifications
        intervention.setEmailSent1WeekBefore(false);
        intervention.setEmailSent1MonthBefore(false);
        intervention.setEmailSentDayOf(false);

        // Associer les intervenants à l'intervention
        if (intervention.getIntervenants() != null) {
            for (IntervenantPreventif intervenant : intervention.getIntervenants()) {
                intervenant.setInterventionPreventive(intervention);
            }
        }

        // Associer les lignes de période à l'intervention
        if (intervention.getPeriodeLignes() != null) {
            for (PeriodeLigne ligne : intervention.getPeriodeLignes()) {
                ligne.setInterventionPreventive(intervention);
                // Associer les intervenants à la ligne de période
                if (ligne.getIntervenants() != null) {
                    for (IntervenantPreventif interv : ligne.getIntervenants()) {
                        interv.setPeriodeLigne(ligne);
                    }
                }
            }
        }

        // Résoudre les utilisateurs assignés
        if (intervention.getAssignedUsers() != null && !intervention.getAssignedUsers().isEmpty()) {
            List<User> resolvedUsers = new ArrayList<>();
            for (User u : intervention.getAssignedUsers()) {
                userRepository.findById(u.getId()).ifPresent(resolvedUsers::add);
            }
            intervention.setAssignedUsers(resolvedUsers);
        }

        return interventionPreventiveRepository.save(intervention);
    }

    @Override
    @Transactional
    public InterventionPreventive updateInterventionPreventive(Long id, InterventionPreventive intervention) {
        InterventionPreventive existing = getInterventionPreventiveById(id);

        existing.setNomClient(intervention.getNomClient());
        existing.setNbInterventionsParAn(intervention.getNbInterventionsParAn());
        existing.setPeriodeDe(intervention.getPeriodeDe());
        existing.setPeriodeA(intervention.getPeriodeA());
        existing.setPeriodeRecommandeDe(intervention.getPeriodeRecommandeDe());
        existing.setPeriodeRecommandeA(intervention.getPeriodeRecommandeA());
        existing.setDateInterventionExigee(intervention.getDateInterventionExigee());
        existing.setDateIntervention(intervention.getDateIntervention());
        existing.setDateRapportPreventive(intervention.getDateRapportPreventive());
        existing.setContrat(intervention.getContrat());
        existing.setStatut(intervention.getStatut());
        existing.setEmailCommercial(intervention.getEmailCommercial());
        existing.setCcMail(intervention.getCcMail());
        existing.setNomProduit(intervention.getNomProduit());

        // ── Détection des utilisateurs nouvellement assignés ──
        List<Long> oldUserIds = existing.getAssignedUsers().stream()
                .map(User::getId)
                .toList();
        
        // ── Mise à jour des utilisateurs assignés ──
        existing.getAssignedUsers().clear();
        List<User> newlyAssignedUsers = new ArrayList<>();
        
        if (intervention.getAssignedUsers() != null) {
            for (User u : intervention.getAssignedUsers()) {
                User managedUser = userRepository.findById(u.getId()).orElse(null);
                if (managedUser != null) {
                    existing.getAssignedUsers().add(managedUser);
                    // Identifier les utilisateurs nouvellement assignés
                    if (!oldUserIds.contains(u.getId())) {
                        newlyAssignedUsers.add(managedUser);
                    }
                }
            }
        }
        
        // ── Notifier les utilisateurs nouvellement assignés ──
        if (!newlyAssignedUsers.isEmpty()) {
            String nomClient = existing.getNomClient() != null ? existing.getNomClient() : "N/A";
            String nomProduit = existing.getNomProduit() != null ? " (" + existing.getNomProduit() + ")" : "";
            
            // Construire un message détaillé avec toutes les infos de l'intervention
            StringBuilder msgBuilder = new StringBuilder();
            msgBuilder.append("👤 Nouvelle assignation - Intervention Préventive\n");
            msgBuilder.append("📦 Client: ").append(nomClient).append(nomProduit).append("\n");
            
            if (existing.getPeriodeLignes() != null && !existing.getPeriodeLignes().isEmpty()) {
                PeriodeLigne ligne = existing.getPeriodeLignes().get(0);
                if (ligne.getPeriodeDe() != null && ligne.getPeriodeA() != null) {
                    msgBuilder.append("📅 Période: ").append(ligne.getPeriodeDe()).append(" → ").append(ligne.getPeriodeA()).append("\n");
                }
                if (ligne.getPeriodeRecommandeDe() != null && ligne.getPeriodeRecommandeA() != null) {
                    msgBuilder.append("⭐ Recommandée: ").append(ligne.getPeriodeRecommandeDe()).append(" → ").append(ligne.getPeriodeRecommandeA()).append("\n");
                }
            }
            
            if (existing.getNbInterventionsParAn() != null) {
                msgBuilder.append("🔁 Fréquence: ").append(existing.getNbInterventionsParAn()).append(" fois par an");
            }
            
            String msg = msgBuilder.toString();
            sendInAppNotificationToAssignedUsers(newlyAssignedUsers, msg, existing.getInterventionPreventiveId());
            logger.info("Notification détaillée envoyée à {} utilisateur(s) nouvellement assigné(s)", newlyAssignedUsers.size());
        }

        // ── Mise à jour des intervenants (niveau intervention) ──
        existing.getIntervenants().clear();
        entityManager.flush();
        if (intervention.getIntervenants() != null) {
            for (IntervenantPreventif intervenant : intervention.getIntervenants()) {
                intervenant.setIntervenantPreventifId(null); // Forcer un INSERT (pas de conflit d'ID)
                intervenant.setInterventionPreventive(existing);
                existing.getIntervenants().add(intervenant);
            }
        }

        // ── Mise à jour des lignes de période (sans perdre fichier/email flags) ──
        List<PeriodeLigne> oldLignes = new ArrayList<>(existing.getPeriodeLignes());
        List<PeriodeLigne> newLignes = intervention.getPeriodeLignes() != null
                ? intervention.getPeriodeLignes()
                : new ArrayList<>();

        // Supprimer les lignes en trop
        while (existing.getPeriodeLignes().size() > newLignes.size()) {
            existing.getPeriodeLignes().remove(existing.getPeriodeLignes().size() - 1);
        }
        entityManager.flush();

        // Mettre à jour les lignes existantes et ajouter les nouvelles
        for (int i = 0; i < newLignes.size(); i++) {
            PeriodeLigne src = newLignes.get(i);
            PeriodeLigne target;

            if (i < oldLignes.size()) {
                // Mettre à jour la ligne existante (préserve son ID, fichier, flags email)
                target = oldLignes.get(i);
            } else {
                // Créer une nouvelle ligne
                target = new PeriodeLigne();
                target.setInterventionPreventive(existing);
                existing.getPeriodeLignes().add(target);
            }

            // ── Détecter les changements de dates avant de les écraser ──────────
            boolean periodeDeDateChanged   = !java.util.Objects.equals(target.getPeriodeDe(), src.getPeriodeDe());
            boolean periodeADateChanged    = !java.util.Objects.equals(target.getPeriodeA(),   src.getPeriodeA());
            boolean recommDeChanged        = !java.util.Objects.equals(target.getPeriodeRecommandeDe(), src.getPeriodeRecommandeDe());
            boolean recommAChanged         = !java.util.Objects.equals(target.getPeriodeRecommandeA(),  src.getPeriodeRecommandeA());
            boolean anyDateChanged = periodeDeDateChanged || periodeADateChanged || recommDeChanged || recommAChanged;

            // Copier les champs admin
            target.setPeriodeDe(src.getPeriodeDe());
            target.setPeriodeA(src.getPeriodeA());
            target.setPeriodeRecommandeDe(src.getPeriodeRecommandeDe());
            target.setPeriodeRecommandeA(src.getPeriodeRecommandeA());
            target.setDateInterventionExigee(src.getDateInterventionExigee());

            // ── Si les dates de période ont changé → réinitialiser les flags email ──
            if (periodeDeDateChanged || periodeADateChanged) {
                target.setEmailSentPeriodeDayOf(false);
                target.setEmailSentPeriode1WeekBefore(false);
                logger.info("Ligne {} - dates période modifiées → flags email période réinitialisés", i + 1);
            }
            if (recommDeChanged || recommAChanged) {
                target.setEmailSentDayOf(false);
                target.setEmailSent1WeekBefore(false);
                target.setEmailSent1MonthBefore(false);
                logger.info("Ligne {} - dates recommandées modifiées → flags email recommandée réinitialisés", i + 1);
            }

            // ── Envoyer une notification immédiate aux utilisateurs assignés ──────
            if (anyDateChanged && existing.getAssignedUsers() != null && !existing.getAssignedUsers().isEmpty()) {
                int numIntervention = i + 1;
                String nomClient  = existing.getNomClient()  != null ? existing.getNomClient()  : "N/A";
                String nomProduit = existing.getNomProduit() != null ? " (" + existing.getNomProduit() + ")" : "";
                StringBuilder notifMsg = new StringBuilder();
                notifMsg.append("📅 Mise à jour - Client: ").append(nomClient).append(nomProduit)
                        .append(" | Intervention ").append(numIntervention).append(" : ")
                        .append("les dates ont été modifiées. ");
                if (periodeDeDateChanged || periodeADateChanged) {
                    notifMsg.append("Nouvelle période: ")
                            .append(src.getPeriodeDe() != null ? src.getPeriodeDe() : "?")
                            .append(" → ").append(src.getPeriodeA() != null ? src.getPeriodeA() : "?").append(". ");
                }
                if (recommDeChanged || recommAChanged) {
                    notifMsg.append("Nouvelle période recommandée: ")
                            .append(src.getPeriodeRecommandeDe() != null ? src.getPeriodeRecommandeDe() : "?")
                            .append(" → ").append(src.getPeriodeRecommandeA() != null ? src.getPeriodeRecommandeA() : "?").append(".");
                }
                sendInAppNotificationToAssignedUsers(
                        existing.getAssignedUsers(),
                        notifMsg.toString(),
                        existing.getInterventionPreventiveId()
                );
                logger.info("Notification immédiate envoyée pour changement de dates - Ligne {}", numIntervention);
            }

            // Copier les champs tech (seulement si envoyés, sinon garder l'existant)
            if (src.getDateIntervention() != null) {
                target.setDateIntervention(src.getDateIntervention());
            }
            if (src.getDateRapportPreventive() != null) {
                target.setDateRapportPreventive(src.getDateRapportPreventive());
            }
            // Le fichier est géré séparément par l'endpoint d'upload, ne pas l'écraser

            // Mettre à jour les intervenants de cette ligne
            target.getIntervenants().clear();
            entityManager.flush();
            if (src.getIntervenants() != null) {
                for (IntervenantPreventif interv : src.getIntervenants()) {
                    interv.setIntervenantPreventifId(null); // Forcer un INSERT
                    interv.setPeriodeLigne(target);
                    interv.setInterventionPreventive(null);
                    target.getIntervenants().add(interv);
                }
            }
        }

        return interventionPreventiveRepository.save(existing);
    }

    @Override
    public void deleteInterventionPreventive(Long id) {
        interventionPreventiveRepository.deleteById(id);
    }

    @Override
    public List<InterventionPreventive> searchInterventionsPreventives(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllInterventionsPreventives();
        }
        return interventionPreventiveRepository.findByNomClientContainingIgnoreCase(searchTerm);
    }

    @Override
    public List<InterventionPreventive> getByContratId(Long contratId) {
        return interventionPreventiveRepository.findByContratContratId(contratId);
    }

    @Override
    public void updateInterventionPreventiveFile(Long id, String fichier, String fichierOriginalName) {
        InterventionPreventive intervention = getInterventionPreventiveById(id);
        intervention.setFichier(fichier);
        intervention.setFichierOriginalName(fichierOriginalName);
        interventionPreventiveRepository.save(intervention);
    }

    /**
     * Vérifie les interventions préventives et envoie des notifications email
     * - 1 semaine avant periodeRecommandeDe
     * - 1 mois avant periodeRecommandeA
     * - Le jour de periodeRecommandeA
     */
    @Transactional
    @Scheduled(cron = "*/10 * * * * ?") // Test: toutes les 10 secondes (changer en "0 0 8 * * ?" pour production)
    public void checkForInterventionPreventiveNotifications() {
        logger.info("=== DEBUT Vérification des notifications Intervention Préventive ===");
        LocalDate today = LocalDate.now();
        logger.info("Date du jour: {}", today);
        List<InterventionPreventive> interventions = interventionPreventiveRepository.findAll();
        logger.info("Nombre total d'interventions préventives: {}", interventions.size());

        for (InterventionPreventive intervention : interventions) {
            // Vérifier si l'intervention nécessite une notification
            boolean needsNotification = intervention.getDateIntervention() == null
                    || intervention.getStatut() != StatutInterventionPreventive.TERMINE;

            if (!needsNotification) {
                logger.info("Intervention {} ignorée: intervention terminée",
                        intervention.getInterventionPreventiveId());
                continue;
            }

            String nomClient = intervention.getNomClient() != null ? intervention.getNomClient() : "N/A";
            String nomProduit = intervention.getNomProduit() != null && !intervention.getNomProduit().isEmpty()
                    ? intervention.getNomProduit()
                    : null;
            String prefix = (nomProduit != null ? "Produit " + nomProduit + ", " : "") + "Client " + nomClient;

            // Récupérer les utilisateurs assignés à cette intervention
            List<User> assignedUsers = intervention.getAssignedUsers();
            if (assignedUsers == null || assignedUsers.isEmpty()) {
                logger.info("Intervention {} ignorée pour notif in-app: aucun utilisateur assigné",
                        intervention.getInterventionPreventiveId());
            }

            // ── Parcourir chaque ligne de période ──
            List<PeriodeLigne> lignes = intervention.getPeriodeLignes();
            if (lignes != null && !lignes.isEmpty()) {
                for (int idx = 0; idx < lignes.size(); idx++) {
                    PeriodeLigne ligne = lignes.get(idx);
                    int numIntervention = idx + 1;

                    // --- Période (contrat) : periodeDe ---
                    if (ligne.getPeriodeDe() != null) {
                        long daysToPeriodeDe = ChronoUnit.DAYS.between(today, ligne.getPeriodeDe());

                        // Aujourd'hui
                        if (daysToPeriodeDe == 0 && !Boolean.TRUE.equals(ligne.getEmailSentPeriodeDayOf())) {
                            String msg = prefix + " - Intervention " + numIntervention
                                    + " : la période commence aujourd'hui (" + ligne.getPeriodeDe() + ")";
                            sendInAppNotificationToAssignedUsers(assignedUsers, msg,
                                    intervention.getInterventionPreventiveId());
                            sendInterventionNotificationEmail(intervention, "PERIODE_DAY_OF");
                            ligne.setEmailSentPeriodeDayOf(true);
                        }
                        // Dans une semaine (5-9 jours)
                        if (daysToPeriodeDe >= 5 && daysToPeriodeDe <= 9
                                && !Boolean.TRUE.equals(ligne.getEmailSentPeriode1WeekBefore())) {
                            String msg = prefix + " - Intervention " + numIntervention
                                    + " : la période commence dans une semaine (" + ligne.getPeriodeDe() + ")";
                            sendInAppNotificationToAssignedUsers(assignedUsers, msg,
                                    intervention.getInterventionPreventiveId());
                            sendInterventionNotificationEmail(intervention, "PERIODE_1_WEEK_BEFORE");
                            ligne.setEmailSentPeriode1WeekBefore(true);
                        }
                    }

                    // --- Période recommandée : periodeRecommandeDe ---
                    if (ligne.getPeriodeRecommandeDe() != null) {
                        long daysToRecommDe = ChronoUnit.DAYS.between(today, ligne.getPeriodeRecommandeDe());

                        // Aujourd'hui
                        if (daysToRecommDe == 0 && !Boolean.TRUE.equals(ligne.getEmailSentDayOf())) {
                            String msg = prefix + " - Intervention " + numIntervention
                                    + " : la période recommandée commence aujourd'hui ("
                                    + ligne.getPeriodeRecommandeDe() + ")";
                            sendInAppNotificationToAssignedUsers(assignedUsers, msg,
                                    intervention.getInterventionPreventiveId());
                            sendInterventionNotificationEmail(intervention, "RECOMMANDEE_DAY_OF");
                            ligne.setEmailSentDayOf(true);
                        }
                        // Dans une semaine (5-9 jours)
                        if (daysToRecommDe >= 5 && daysToRecommDe <= 9
                                && !Boolean.TRUE.equals(ligne.getEmailSent1WeekBefore())) {
                            String msg = prefix + " - Intervention " + numIntervention
                                    + " : la période recommandée commence dans une semaine ("
                                    + ligne.getPeriodeRecommandeDe() + ")";
                            sendInAppNotificationToAssignedUsers(assignedUsers, msg,
                                    intervention.getInterventionPreventiveId());
                            sendInterventionNotificationEmail(intervention, "RECOMMANDEE_1_WEEK_BEFORE");
                            ligne.setEmailSent1WeekBefore(true);
                        }
                        // Dans un mois (25-35 jours)
                        if (daysToRecommDe >= 25 && daysToRecommDe <= 35
                                && !Boolean.TRUE.equals(ligne.getEmailSent1MonthBefore())) {
                            String msg = prefix + " - Intervention " + numIntervention
                                    + " : la période recommandée commence dans un mois ("
                                    + ligne.getPeriodeRecommandeDe() + ")";
                            sendInAppNotificationToAssignedUsers(assignedUsers, msg,
                                    intervention.getInterventionPreventiveId());
                            sendInterventionNotificationEmail(intervention, "RECOMMANDEE_1_MONTH_BEFORE");
                            ligne.setEmailSent1MonthBefore(true);
                        }
                    }
                }
            }

            // Sauvegarder les flags mis à jour
            interventionPreventiveRepository.save(intervention);
        }
        logger.info("=== FIN Vérification des notifications Intervention Préventive ===");
    }

    /**
     * Envoie une notification in-app uniquement aux utilisateurs assignés
     */
    private void sendInAppNotificationToAssignedUsers(List<User> assignedUsers, String message,
            Long interventionPreventiveId) {
        if (assignedUsers == null || assignedUsers.isEmpty()) {
            logger.info("Pas d'utilisateurs assignés, notification in-app ignorée");
            return;
        }
        logger.info(">>> Notification in-app aux {} utilisateurs assignés: {}", assignedUsers.size(), message);
        for (User user : assignedUsers) {
            try {
                notificationService.createNotification(user, message, interventionPreventiveId);
            } catch (Exception e) {
                logger.error("Erreur notification in-app pour user {}: {}", user.getId(), e.getMessage());
            }
        }
    }

    /**
     * Envoie un email de notification pour une intervention préventive
     */
    private void sendInterventionNotificationEmail(InterventionPreventive intervention, String notificationType) {
        String nomClient = intervention.getNomClient() != null ? intervention.getNomClient() : "N/A";
        String nomProduit = intervention.getNomProduit() != null && !intervention.getNomProduit().isEmpty()
                ? intervention.getNomProduit()
                : null;
        String clientProduitSuffix = "Client " + nomClient
                + (nomProduit != null ? ", Produit " + nomProduit : "");
        String produitInfo = nomProduit != null ? " (Produit : " + nomProduit + ")" : "";
        String subject;
        String urgencyText;
        String actionText;

        switch (notificationType) {
            // ── Période (contrat) ──
            case "PERIODE_1_WEEK_BEFORE":
                subject = "🔔 Rappel: Intervention Préventive - " + clientProduitSuffix
                        + " - la période commence dans 1 semaine";
                urgencyText = "La période de client: <strong>" + nomClient + "</strong> pour l'intervention"
                        + produitInfo + " commence dans <strong>1 semaine</strong>.";
                actionText = "Veuillez planifier l'intervention préventive dès que possible.";
                break;
            case "PERIODE_DAY_OF":
                subject = "🚨 URGENT: Intervention Préventive - " + clientProduitSuffix
                        + " - La période commence AUJOURD'HUI";
                urgencyText = "La période de client: de <strong>" + nomClient + "</strong> pour l'intervention"
                        + produitInfo + " commence <strong>AUJOURD'HUI</strong>.";
                actionText = "Action immédiate requise: l'intervention doit être réalisée.";
                break;
            // ── Période recommandée ──
            case "RECOMMANDEE_1_WEEK_BEFORE":
                subject = "🔔 Rappel: Intervention Préventive - " + clientProduitSuffix
                        + " - la période recommandée commence dans 1 semaine";
                urgencyText = "La période recommandée de client: <strong>" + nomClient + "</strong> pour l'intervention"
                        + produitInfo + " commence dans <strong>1 semaine</strong>.";
                actionText = "Veuillez planifier l'intervention préventive dès que possible.";
                break;
            case "RECOMMANDEE_1_MONTH_BEFORE":
                subject = "⚠️ Rappel: Intervention Préventive - " + clientProduitSuffix
                        + " - la période recommandée commence dans 1 mois";
                urgencyText = "La période recommandée de client: <strong>" + nomClient + "</strong> pour l'intervention"
                        + produitInfo + " commence dans <strong>1 mois</strong>.";
                actionText = "Veuillez vous assurer que l'intervention est planifiée et sera réalisée avant la fin de la période.";
                break;
            case "RECOMMANDEE_DAY_OF":
                subject = "🚨 URGENT: Intervention Préventive - " + clientProduitSuffix
                        + " - La période recommandée commence AUJOURD'HUI";
                urgencyText = "La période recommandée de client: <strong>" + nomClient + "</strong> pour l'intervention"
                        + produitInfo + " commence <strong>AUJOURD'HUI</strong>.";
                actionText = "Action immédiate requise: l'intervention doit être réalisée immédiatement.";
                break;
            default:
                return;
        }

        String htmlContent = buildInterventionNotificationHtml(intervention, urgencyText, actionText);

        try {
            logger.info("==> Appel emailService.sendEsetNotification pour intervention {}...",
                    intervention.getInterventionPreventiveId());
            logger.info("==> Email destinataire: {}", intervention.getEmailCommercial());
            logger.info("==> CC Mails: {}", intervention.getCcMail());
            List<String> ccMails = intervention.getCcMail() != null ? intervention.getCcMail() : List.of();
            emailService.sendEsetNotification(
                    intervention.getEmailCommercial(),
                    ccMails,
                    subject,
                    htmlContent);
            logger.info("==> Email envoyé avec SUCCÈS pour intervention {} - Type: {}",
                    intervention.getInterventionPreventiveId(), notificationType);
        } catch (Exception e) {
            logger.error("==> ERREUR lors de l'envoi de l'email pour intervention {}: {}",
                    intervention.getInterventionPreventiveId(), e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Construit le contenu HTML de l'email de notification
     */
    private String buildInterventionNotificationHtml(InterventionPreventive intervention, String urgencyText,
            String actionText) {
        StringBuilder html = new StringBuilder();
        html.append("<html><head><style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".container { max-width: 600px; margin: 0 auto; padding: 20px; }");
        html.append(".header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }");
        html.append(".content { padding: 20px; background-color: #f9f9f9; }");
        html.append(
                ".alert { background-color: #e74c3c; color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }");
        html.append(".info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }");
        html.append(".info-table td { padding: 10px; border-bottom: 1px solid #ddd; }");
        html.append(".info-table td:first-child { font-weight: bold; width: 40%; background-color: #ecf0f1; }");
        html.append(".footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; }");
        html.append("</style></head><body>");

        html.append("<div class='container'>");
        html.append("<div class='header'><h2>🔧 Intervention Préventive - Notification</h2></div>");
        html.append("<div class='content'>");

        html.append("<div class='alert'><p>").append(urgencyText).append("</p>");
        html.append("<p>").append(actionText).append("</p></div>");

        html.append("<h3>Détails de l'intervention:</h3>");
        html.append("<table class='info-table'>");
        html.append("<tr><td>Client</td><td>")
                .append(intervention.getNomClient() != null ? intervention.getNomClient() : "-").append("</td></tr>");
        html.append("<tr><td>Nombre d'interventions/an</td><td>")
                .append(intervention.getNbInterventionsParAn() != null ? intervention.getNbInterventionsParAn() : "-")
                .append("</td></tr>");
        html.append("<tr><td>Période (contrat)</td><td>")
                .append(formatDateRange(intervention.getPeriodeDe(), intervention.getPeriodeA())).append("</td></tr>");
        html.append("<tr><td>Période recommandée</td><td>")
                .append(formatDateRange(intervention.getPeriodeRecommandeDe(), intervention.getPeriodeRecommandeA()))
                .append("</td></tr>");
        html.append("<tr><td>Date d'intervention exigée</td><td>")
                .append(intervention.getDateInterventionExigee() != null
                        ? intervention.getDateInterventionExigee().toString()
                        : "Non définie")
                .append("</td></tr>");
        html.append("<tr><td>Date d'intervention</td><td>")
                .append(intervention.getDateIntervention() != null ? intervention.getDateIntervention().toString()
                        : "<span style='color:red'>Non planifiée</span>")
                .append("</td></tr>");
        html.append("<tr><td>Statut</td><td>")
                .append(intervention.getStatut() != null ? intervention.getStatut().toString() : "-")
                .append("</td></tr>");
        html.append("</table>");

        html.append("</div>");
        html.append("<div class='footer'>");
        html.append(
                "<p>Ce message a été envoyé automatiquement par le système de gestion des interventions préventives.</p>");
        html.append("</div>");
        html.append("</div></body></html>");

        return html.toString();
    }

    /**
     * Formate une plage de dates pour l'affichage
     */
    private String formatDateRange(LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return "-";
        }
        String fromStr = from != null ? from.toString() : "?";
        String toStr = to != null ? to.toString() : "?";
        return fromStr + " → " + toStr;
    }
}
