package com.example.projet2024.entite;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "Intervention_Curative")
public class InterventionCurative {
    @Id
    @Column(name = "InterventionCurativeId")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long interventionCurativeId;

    @Basic
    @Column(name = "Fiche_Intervention")
    private String ficheIntervention;

    @Basic
    @Column(name = "Nom_Client")
    private String nomClient;

    @Basic
    @Column(name = "Criticite")
    private String criticite;

    @Basic
    @Column(name = "Intervenant")
    private String intervenant; // Garde pour compatibilité

    @OneToMany(mappedBy = "interventionCurative", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Intervenant> intervenants = new ArrayList<>();

    @Basic
    @Column(name = "Date_Heure_Demande")
    private LocalDateTime dateHeureDemande;

    @Basic
    @Column(name = "Date_Heure_Intervention")
    private LocalDateTime dateHeureIntervention;

    @Basic
    @Column(name = "Date_Heure_Resolution")
    private LocalDateTime dateHeureResolution;

    @Basic
    @Column(name = "Duree_Intervention")
    private String dureeIntervention;

    @Basic
    @Column(name = "Mode_Intervention")
    private String modeIntervention; // "Sur site" ou "A distance"

    @Basic
    @Column(name = "Vis_A_Vis_Client")
    private String visAVisClient;

    @Basic
    @Column(name = "En_Cours_De_Resolution")
    private Boolean enCoursDeResolution;

    @Basic
    @Column(name = "Resolu")
    private Boolean resolu;

    @Basic
    @Column(name = "Taches_Effectuees", length = 2000)
    private String tachesEffectuees;

    @Basic
    @Column(name = "Probleme", length = 1000)
    private String probleme;

    @Basic
    @Column(name = "Delai_Resolution")
    private Integer delaiResolution;

    @Basic
    @Column(name = "Resume", length = 2000)
    private String resume;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "intervention_curative_assigned_users",
        joinColumns = @JoinColumn(name = "intervention_curative_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> assignedUsers = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "ContratId")
    private Contrat contrat;

    @Basic
    @Column(name = "Fichier")
    private String fichier;

    @Basic
    @Column(name = "Fichier_Original_Name")
    private String fichierOriginalName;

    @Column(name = "nom_produit", length = 100)
    private String nomProduit;
}
