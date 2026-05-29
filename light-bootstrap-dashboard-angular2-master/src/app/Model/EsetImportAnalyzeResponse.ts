/** Réponse de POST /Eset/import/analyze */
export interface EsetImportAnalyzeResponse {
  client?: string;
  identifiant?: string;
  cle_de_Licence?: string;
  nom_produit?: string;
  nombre?: number;
  nmb_tlf?: string;
  nom_contact?: string;
  mail?: string;
  mailAdmin?: string;
  dateEx?: string;
  dureeDeLicence?: string;
  typeAchat?: string;
  commandePasserPar?: string;
  remarque?: string;
  sousContrat?: boolean;
  ccMail?: string[];
  extractionSkipped?: boolean;
  infoMessage?: string;
}
