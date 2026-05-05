package com.example.projet2024.entite;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "contrat_sla")
public class ContratSla {

    @Id
    @Column(name = "sla_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long slaId;

    @Column(name = "criticite", length = 10)
    private String criticite;

    @Column(name = "delai_max_intervention")
    private Integer delaiMaxIntervention;

    @Column(name = "delai_max_resolution")
    private Integer delaiMaxResolution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrat_id")
    @JsonBackReference("contrat-sla")
    private Contrat contrat;
}
