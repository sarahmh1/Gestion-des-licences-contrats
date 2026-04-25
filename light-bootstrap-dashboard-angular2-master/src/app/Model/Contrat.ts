export interface DateAvenant {
  dateAvenantId?: number;
  dateAvenant: string;
  numeroAvenant: number;
  details?: string;
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
  criticite?: string;
  delaiMaxIntervention?: number;
  delaiMaxResolution?: number;
}
