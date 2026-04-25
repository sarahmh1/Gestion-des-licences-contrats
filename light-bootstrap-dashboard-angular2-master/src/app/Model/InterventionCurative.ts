export interface Intervenant {
  intervenantId?: number;
  nom: string;
}

export interface InterventionCurative {
  interventionCurativeId?: number;
  ficheIntervention: string;
  nomClient: string;
  criticite: string;
  probleme?: string;
  delaiResolution?: string;
  resume?: string;
  assignedUsers?: any[];
  intervenant?: string; // Pour compatibilité
  intervenants?: Intervenant[];
  dateHeureDemande: string;
  dateHeureIntervention: string;
  dateHeureResolution: string;
  dureeIntervention: string;
  modeIntervention: string;
  visAVisClient: string;
  enCoursDeResolution: boolean;
  resolu: boolean;
  tachesEffectuees: string;
  contratId?: number;
  fichier?: string;
  fichierOriginalName?: string;
  nomProduit?: string;
}
