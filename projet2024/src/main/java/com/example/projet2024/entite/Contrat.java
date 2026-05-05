package com.example.projet2024.entite;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "Contrat")
public class Contrat {
    @Id
    @Column(name = "ContratId")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long contratId;

    @Basic
    @Column(name = "Client")
    private String client;

    @Basic
    @Column(name = "Objet_Contrat")
    private String objetContrat;

    @Basic
    @Column(name = "Nb_Interventions_Preventives")
    private String nbInterventionsPreventives;

    @Basic
    @Column(name = "Nb_Interventions_Curatives")
    private String nbInterventionsCuratives;

    @Basic
    @Column(name = "Date_Debut")
    private LocalDate dateDebut;

    @Basic
    @Column(name = "Date_Fin")
    private LocalDate dateFin;

    @Basic
    @Column(name = "Renouvelable")
    private Boolean renouvelable;

    @Basic
    @Column(name = "Remarque", length = 1000)
    private String remarque;

    @Column(name = "fichier")
    private String fichier;

    @Column(name = "fichier_original_name")
    private String fichierOriginalName;

    @Column(name = "email_commercial")
    private String emailCommercial;

    @ElementCollection
    @CollectionTable(name = "contrat_cc_mail", joinColumns = @JoinColumn(name = "contrat_id"))
    @Column(name = "cc_mail")
    private List<String> ccMail = new ArrayList<>();

    @Column(name = "email_sent_30_days")
    private Boolean emailSent30Days = false;

    @Column(name = "email_sent_day_of")
    private Boolean emailSentDayOf = false;

    @Column(name = "email_sent_6_months")
    private Boolean emailSent6Months = false;

    @Column(name = "email_sent_3_months")
    private Boolean emailSent3Months = false;

    @Column(name = "email_sent_1_week")
    private Boolean emailSent1Week = false;

    @Column(name = "nom_produit", length = 100)
    private String nomProduit;

    @Column(name = "criticite", length = 50)
    private String criticite;

    @Column(name = "delai_max_intervention")
    private Integer delaiMaxIntervention;

    @Column(name = "delai_max_resolution")
    private Integer delaiMaxResolution;

    @OneToMany(mappedBy = "contrat", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<DateAvenant> datesAvenants = new ArrayList<>();

    @OneToMany(mappedBy = "contrat", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("contrat-sla")
    private List<ContratSla> slaList = new ArrayList<>();
}
