export interface Intervenant {
  intervenantId?: number;
  nom: string;
}

export interface SessionIntervention {
  sessionId?: number;
  resume?: string;
  dateHeureIntervention?: string | null;
  dureeIntervention?: string;
  fichier?: string;
  fichierOriginalName?: string;
  userAssigne?: any;
}

export interface InterventionCurative {
  interventionCurativeId?: number;
  ficheIntervention?: string;
  nomClient?: string;
  criticite?: string;
  probleme?: string;
  delaiResolution?: string | number;
  resume?: string;
  assignedUsers?: any[];
  intervenant?: string; // Pour compatibilité
  intervenants?: Intervenant[];
  sessions?: SessionIntervention[];
  dateHeureDemande?: string;
  dateHeureIntervention?: string;
  dateHeureResolution?: string;
  dureeIntervention?: string;
  modeIntervention?: string;
  visAVisClient?: string;
  enCoursDeResolution?: boolean;
  resolu?: boolean;
  tachesEffectuees?: string;
  contratId?: number;
  contrat?: any;
  fichier?: string;
  fichierOriginalName?: string;
  nomProduit?: string;
  resoluByUser?: any;
}
