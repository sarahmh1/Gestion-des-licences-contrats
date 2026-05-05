package com.example.projet2024.entite;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Session_Intervention")
public class SessionIntervention {

    @Id
    @Column(name = "SessionId")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sessionId;

    @Basic
    @Column(name = "Resume", length = 2000)
    private String resume;

    @Basic
    @Column(name = "Date_Heure_Intervention")
    private LocalDateTime dateHeureIntervention;

    @Basic
    @Column(name = "Duree_Intervention")
    private String dureeIntervention;

    @Basic
    @Column(name = "Fichier")
    private String fichier;

    @Basic
    @Column(name = "Fichier_Original_Name")
    private String fichierOriginalName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_assigne_id")
    private com.example.projet2024.entite.User userAssigne;

    @ManyToOne
    @JoinColumn(name = "InterventionCurativeId")
    @JsonBackReference("session-intervention")
    private InterventionCurative interventionCurative;
}
