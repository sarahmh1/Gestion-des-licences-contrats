package com.example.projet2024.service;

import com.example.projet2024.entite.InterventionCurative;
import com.example.projet2024.entite.Intervenant;
import com.example.projet2024.entite.SessionIntervention;
import com.example.projet2024.entite.User;
import com.example.projet2024.repository.InterventionCurativeRepository;
import com.example.projet2024.repository.SessionInterventionRepository;
import com.example.projet2024.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class InterventionCurativeServiceImpl implements IInterventionCurativeService {

    private static final Logger logger = LoggerFactory.getLogger(InterventionCurativeServiceImpl.class);

    @Autowired
    private InterventionCurativeRepository interventionCurativeRepository;

    @Autowired
    private SessionInterventionRepository sessionInterventionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<InterventionCurative> getAllInterventionsCuratives() {
        return interventionCurativeRepository.findAll();
    }

    @Override
    public InterventionCurative getInterventionCurativeById(Long id) {
        return interventionCurativeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Intervention Curative non trouvée avec l'id: " + id));
    }

    @Override
    public InterventionCurative addInterventionCurative(InterventionCurative intervention) {
        // Associer les intervenants à l'intervention
        if (intervention.getIntervenants() != null) {
            for (Intervenant intervenant : intervention.getIntervenants()) {
                intervenant.setInterventionCurative(intervention);
            }
        }

        // Associer les sessions à l'intervention + résoudre user assigné
        if (intervention.getSessions() != null) {
            for (SessionIntervention session : intervention.getSessions()) {
                session.setInterventionCurative(intervention);
                if (session.getUserAssigne() != null && session.getUserAssigne().getId() != null) {
                    userRepository.findById(session.getUserAssigne().getId())
                        .ifPresent(session::setUserAssigne);
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

        // Résoudre resoluByUser
        if (intervention.getResoluByUser() != null && intervention.getResoluByUser().getId() != null) {
            userRepository.findById(intervention.getResoluByUser().getId())
                .ifPresent(intervention::setResoluByUser);
        }

        InterventionCurative saved = interventionCurativeRepository.save(intervention);

        // Notifier les utilisateurs assignés lors de la création
        if (saved.getAssignedUsers() != null && !saved.getAssignedUsers().isEmpty()) {
            String nomClient = saved.getNomClient() != null ? saved.getNomClient() : "N/A";
            String nomProduit = saved.getNomProduit() != null ? " (" + saved.getNomProduit() + ")" : "";

            StringBuilder msgBuilder = new StringBuilder();
            msgBuilder.append("👤 Nouvelle assignation - Intervention Curative\n");
            msgBuilder.append("📦 Client: ").append(nomClient).append(nomProduit).append("\n");
            if (saved.getProbleme() != null) {
                msgBuilder.append("⚠️ Problème: ").append(saved.getProbleme()).append("\n");
            }
            if (saved.getCriticite() != null) {
                msgBuilder.append("🔴 Criticité: ").append(saved.getCriticite()).append("\n");
            }
            String msg = msgBuilder.toString();
            sendInAppNotificationToAssignedUsers(saved.getAssignedUsers(), msg, saved.getInterventionCurativeId());
        }

        return saved;
    }

    @Override
    @Transactional
    public InterventionCurative updateInterventionCurative(Long id, InterventionCurative intervention) {
        InterventionCurative existing = getInterventionCurativeById(id);
        
        existing.setFicheIntervention(intervention.getFicheIntervention());
        existing.setNomClient(intervention.getNomClient());
        existing.setCriticite(intervention.getCriticite());
        existing.setProbleme(intervention.getProbleme());
        existing.setDelaiResolution(intervention.getDelaiResolution());
        existing.setResume(intervention.getResume());
        existing.setNomProduit(intervention.getNomProduit());
        existing.setIntervenant(intervention.getIntervenant());
        existing.setDateHeureDemande(intervention.getDateHeureDemande());
        existing.setDateHeureIntervention(intervention.getDateHeureIntervention());
        existing.setDateHeureResolution(intervention.getDateHeureResolution());
        existing.setDureeIntervention(intervention.getDureeIntervention());
        existing.setModeIntervention(intervention.getModeIntervention());
        existing.setVisAVisClient(intervention.getVisAVisClient());
        existing.setEnCoursDeResolution(intervention.getEnCoursDeResolution());
        existing.setResolu(intervention.getResolu());
        existing.setTachesEffectuees(intervention.getTachesEffectuees());
        // Ne pas écraser le contrat s'il n'est pas fourni dans la requête
        if (intervention.getContrat() != null) {
            existing.setContrat(intervention.getContrat());
        }
        
        // ── Détection des utilisateurs nouvellement assignés ──
        List<Long> oldUserIds = new ArrayList<>();
        if (existing.getAssignedUsers() != null) {
            oldUserIds = existing.getAssignedUsers().stream().map(User::getId).toList();
            existing.getAssignedUsers().clear();
        } else {
            existing.setAssignedUsers(new ArrayList<>());
        }
        
        List<User> newlyAssignedUsers = new ArrayList<>();
        if (intervention.getAssignedUsers() != null) {
            for (User u : intervention.getAssignedUsers()) {
                User managedUser = userRepository.findById(u.getId()).orElse(null);
                if (managedUser != null) {
                    existing.getAssignedUsers().add(managedUser);
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
            
            StringBuilder msgBuilder = new StringBuilder();
            msgBuilder.append("👤 Nouvelle assignation - Intervention Curative\n");
            msgBuilder.append("📦 Client: ").append(nomClient).append(nomProduit).append("\n");
            if (existing.getProbleme() != null) {
                msgBuilder.append("⚠️ Problème: ").append(existing.getProbleme()).append("\n");
            }
            if (existing.getCriticite() != null) {
                msgBuilder.append("🔴 Criticité: ").append(existing.getCriticite()).append("\n");
            }
            
            String msg = msgBuilder.toString();
            sendInAppNotificationToAssignedUsers(newlyAssignedUsers, msg, existing.getInterventionCurativeId());
        }
        
        // Mettre à jour les intervenants
        existing.getIntervenants().clear();
        entityManager.flush();
        if (intervention.getIntervenants() != null) {
            for (Intervenant intervenant : intervention.getIntervenants()) {
                intervenant.setIntervenantId(null);
                intervenant.setInterventionCurative(existing);
                existing.getIntervenants().add(intervenant);
            }
        }

        // Mettre à jour les sessions d'intervention.
        // Conserver le fichier déjà uploadé pour chaque session existante (si la nouvelle
        // payload ne contient pas de fichier), pour éviter de perdre l'upload précédent.
        if (intervention.getSessions() != null) {
            // Index des sessions existantes par id (avant clear)
            java.util.Map<Long, SessionIntervention> existingById = new java.util.HashMap<>();
            for (SessionIntervention old : existing.getSessions()) {
                if (old.getSessionId() != null) {
                    existingById.put(old.getSessionId(), old);
                }
            }

            existing.getSessions().clear();
            entityManager.flush();

            for (SessionIntervention payload : intervention.getSessions()) {
                SessionIntervention newSession = new SessionIntervention();
                newSession.setResume(payload.getResume());
                newSession.setDateHeureIntervention(payload.getDateHeureIntervention());
                newSession.setDureeIntervention(payload.getDureeIntervention());

                // Préserver le fichier déjà uploadé si présent et non remplacé
                if (payload.getFichier() != null && !payload.getFichier().isEmpty()) {
                    newSession.setFichier(payload.getFichier());
                    newSession.setFichierOriginalName(payload.getFichierOriginalName());
                } else if (payload.getSessionId() != null && existingById.containsKey(payload.getSessionId())) {
                    SessionIntervention prev = existingById.get(payload.getSessionId());
                    newSession.setFichier(prev.getFichier());
                    newSession.setFichierOriginalName(prev.getFichierOriginalName());
                }

                // Conserver l'utilisateur assigné existant ou prendre celui du payload
                if (payload.getUserAssigne() != null && payload.getUserAssigne().getId() != null) {
                    userRepository.findById(payload.getUserAssigne().getId())
                        .ifPresent(newSession::setUserAssigne);
                } else if (payload.getSessionId() != null && existingById.containsKey(payload.getSessionId())) {
                    SessionIntervention prev = existingById.get(payload.getSessionId());
                    newSession.setUserAssigne(prev.getUserAssigne());
                }

                newSession.setInterventionCurative(existing);
                existing.getSessions().add(newSession);
            }
        }

        // Mettre à jour resoluByUser uniquement si fourni (sinon conserver l'existant)
        if (intervention.getResoluByUser() != null && intervention.getResoluByUser().getId() != null) {
            userRepository.findById(intervention.getResoluByUser().getId())
                .ifPresent(existing::setResoluByUser);
        }
        
        return interventionCurativeRepository.save(existing);
    }

    private void sendInAppNotificationToAssignedUsers(List<User> assignedUsers, String message, Long interventionCurativeId) {
        if (assignedUsers == null || assignedUsers.isEmpty()) {
            return;
        }
        for (User user : assignedUsers) {
            try {
                notificationService.createCurativeNotification(user, message, interventionCurativeId);
            } catch (Exception e) {
                logger.error("Erreur notification in-app pour user {}: {}", user.getId(), e.getMessage());
            }
        }
    }

    @Override
    public void deleteInterventionCurative(Long id) {
        interventionCurativeRepository.deleteById(id);
    }

    @Override
    public List<InterventionCurative> searchInterventionsCuratives(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllInterventionsCuratives();
        }
        
        List<InterventionCurative> byClient = filterInterventionsByNomClientFlexible(searchTerm.trim());
        List<InterventionCurative> byIntervenant = interventionCurativeRepository.findByIntervenantContainingIgnoreCase(searchTerm);
        List<InterventionCurative> byAssign = interventionCurativeRepository.findByAssignedUserMatching(searchTerm);
        List<InterventionCurative> bySessionAssign = interventionCurativeRepository.findBySessionAssignedUserMatching(searchTerm);
        List<InterventionCurative> byCrit = interventionCurativeRepository.findByCriticiteContainingIgnoreCase(searchTerm);

        return Stream.of(byClient.stream(), byIntervenant.stream(), byAssign.stream(), bySessionAssign.stream(), byCrit.stream())
                .flatMap(s -> s)
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public List<InterventionCurative> searchByCriticite(String fragment) {
        if (fragment == null || fragment.trim().length() < 1) {
            return List.of();
        }
        return interventionCurativeRepository.findByCriticiteContainingIgnoreCase(fragment.trim());
    }

    @Override
    public List<InterventionCurative> searchByClientName(String fragment) {
        if (fragment == null || fragment.trim().length() < 2) {
            return List.of();
        }
        return filterInterventionsByNomClientFlexible(fragment.trim());
    }

    @Override
    public List<InterventionCurative> searchByUserAssignee(String fragment) {
        if (fragment == null || fragment.trim().length() < 2) {
            return List.of();
        }
        String t = fragment.trim();
        List<InterventionCurative> a = interventionCurativeRepository.findByAssignedUserMatching(t);
        List<InterventionCurative> b = interventionCurativeRepository.findBySessionAssignedUserMatching(t);
        return Stream.concat(a.stream(), b.stream()).distinct().collect(Collectors.toList());
    }

    @Override
    public List<InterventionCurative> getByContratId(Long contratId) {
        return interventionCurativeRepository.findByContratContratId(contratId);
    }

    @Override
    public void updateInterventionCurativeFile(Long id, String fichier, String fichierOriginalName) {
        InterventionCurative intervention = getInterventionCurativeById(id);
        intervention.setFichier(fichier);
        intervention.setFichierOriginalName(fichierOriginalName);
        interventionCurativeRepository.save(intervention);
    }

    /** Recherche nom client : LIKE puis repli sans accents (« delice » retrouve « Délice »). */
    private List<InterventionCurative> filterInterventionsByNomClientFlexible(String term) {
        if (term == null || term.length() < 2) {
            return List.of();
        }
        List<InterventionCurative> hit = interventionCurativeRepository.findByNomClientContainingIgnoreCase(term);
        if (!hit.isEmpty()) {
            return hit;
        }
        String folded = foldAccents(term);
        if (folded.length() < 2) {
            return List.of();
        }
        return interventionCurativeRepository.findAll().stream()
                .filter(ic -> ic.getNomClient() != null && foldAccents(ic.getNomClient()).contains(folded))
                .collect(Collectors.toList());
    }

    private static String foldAccents(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        String nfd = Normalizer.normalize(s, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
    }
}
