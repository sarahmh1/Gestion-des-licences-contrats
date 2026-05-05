export interface DateAvenant {
  dateAvenantId?: number;
  dateAvenant: string;
  numeroAvenant: number;
  details?: string;
}

export interface ContratSla {
  slaId?: number;
  criticite: string;            // C1 / C2 / C3
  delaiMaxIntervention?: number; // en heures
  delaiMaxResolution?: number;   // en heures
}

export interface Contrat {
  contratId?: number;
  client: string;
  objetContrat: string;
  nbInterventionsPreventives: number;
  nbInterventionsCuratives: number;
  dateDebut: string;
  dateFin: string;
  renouvelable: boolean;
  remarque?: string;
  fichier?: string;
  fichierOriginalName?: string;
  emailCommercial?: string;
  ccMail?: string[];
  datesAvenants?: DateAvenant[];
  nomProduit?: string;
  slaList?: ContratSla[];
  // Anciens champs (legacy, conservés pour rétro-compat backend mais non utilisés côté UI)
  criticite?: string;
  delaiMaxIntervention?: number;
  delaiMaxResolution?: number;
}
