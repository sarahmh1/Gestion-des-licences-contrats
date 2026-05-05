package com.example.projet2024.repository;

import com.example.projet2024.entite.SessionIntervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionInterventionRepository extends JpaRepository<SessionIntervention, Long> {
    List<SessionIntervention> findByInterventionCurative_InterventionCurativeId(Long interventionCurativeId);
}
