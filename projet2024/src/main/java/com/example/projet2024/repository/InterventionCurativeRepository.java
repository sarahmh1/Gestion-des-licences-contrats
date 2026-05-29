package com.example.projet2024.repository;

import com.example.projet2024.entite.InterventionCurative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterventionCurativeRepository extends JpaRepository<InterventionCurative, Long> {
    List<InterventionCurative> findByNomClientContainingIgnoreCase(String nomClient);
    List<InterventionCurative> findByIntervenantContainingIgnoreCase(String intervenant);
    List<InterventionCurative> findByCriticiteContainingIgnoreCase(String criticite);
    List<InterventionCurative> findByContratContratId(Long contratId);

    @Query("""
            SELECT DISTINCT ic FROM InterventionCurative ic
            JOIN ic.assignedUsers u
            WHERE LOWER(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')))
                  LIKE LOWER(CONCAT('%', :t, '%'))
               OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :t, '%'))
            """)
    List<InterventionCurative> findByAssignedUserMatching(@Param("t") String t);

    @Query("""
            SELECT DISTINCT ic FROM InterventionCurative ic
            JOIN ic.sessions s JOIN s.userAssigne u
            WHERE LOWER(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')))
                  LIKE LOWER(CONCAT('%', :t, '%'))
               OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :t, '%'))
            """)
    List<InterventionCurative> findBySessionAssignedUserMatching(@Param("t") String t);
}
