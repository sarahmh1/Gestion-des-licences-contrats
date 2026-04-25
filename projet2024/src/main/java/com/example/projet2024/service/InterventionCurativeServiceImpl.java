package com.example.projet2024.service;

import com.example.projet2024.entite.InterventionCurative;
import com.example.projet2024.entite.Intervenant;
import com.example.projet2024.entite.User;
import com.example.projet2024.repository.InterventionCurativeRepository;
import com.example.projet2024.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class InterventionCurativeServiceImpl implements IInterventionCurativeService {

    private static final Logger logger = LoggerFactory.getLogger(InterventionCurativeServiceImpl.class);

    @Autowired
    private InterventionCurativeRepository interventionCurativeRepository;

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
        
        // Résoudre les utilisateurs assignés
        if (intervention.getAssignedUsers() != null && !intervention.getAssignedUsers().isEmpty()) {
            List<User> resolvedUsers = new ArrayList<>();
            for (User u : intervention.getAssignedUsers()) {
                userRepository.findById(u.getId()).ifPresent(resolvedUsers::add);
            }
            intervention.setAssignedUsers(resolvedUsers);
        }
        
        return interventionCurativeRepository.save(intervention);
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
        existing.setContrat(intervention.getContrat());
        
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
        
        List<InterventionCurative> byClient = interventionCurativeRepository.findByNomClientContainingIgnoreCase(searchTerm);
        List<InterventionCurative> byIntervenant = interventionCurativeRepository.findByIntervenantContainingIgnoreCase(searchTerm);
        
        return Stream.concat(byClient.stream(), byIntervenant.stream())
                .distinct()
                .collect(Collectors.toList());
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
}
