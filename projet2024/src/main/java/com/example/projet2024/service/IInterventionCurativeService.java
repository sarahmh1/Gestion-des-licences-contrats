package com.example.projet2024.service;

import com.example.projet2024.entite.InterventionCurative;

import java.util.List;

public interface IInterventionCurativeService {
    List<InterventionCurative> getAllInterventionsCuratives();
    InterventionCurative getInterventionCurativeById(Long id);
    InterventionCurative addInterventionCurative(InterventionCurative intervention);
    InterventionCurative updateInterventionCurative(Long id, InterventionCurative intervention);
    void deleteInterventionCurative(Long id);
    List<InterventionCurative> searchInterventionsCuratives(String searchTerm);

    /** Filtre uniquement sur {@code nomClient} (contient, insensible à la casse). */
    List<InterventionCurative> searchByClientName(String fragment);

    /** Filtre sur utilisateurs assignés à l’intervention ou sur une session (prénom, nom, email). */
    List<InterventionCurative> searchByUserAssignee(String fragment);

    /** Filtre sur le champ criticité (contient, insensible à la casse), ex. C1, P2. */
    List<InterventionCurative> searchByCriticite(String fragment);

    List<InterventionCurative> getByContratId(Long contratId);
    void updateInterventionCurativeFile(Long id, String fichier, String fichierOriginalName);
}
