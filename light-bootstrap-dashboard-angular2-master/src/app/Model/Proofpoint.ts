import { CommandePasserPar } from "./CommandePasserPar";
import { Duree } from "./Duree";

export class Proofpoint {
    proofpointId: number;
    client: string;
    nomDuContact: string;
    adresseEmailContact: string;
    mailAdmin: string;
    dureeDeLicence: string;
    ccMail: string[];
    commandePasserPar: CommandePasserPar;
    numero: string;
    sousContrat: boolean;
    approuve?: boolean;
    remarque: string;
    licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
    fichier?: string;
    fichierOriginalName?: string;
  }
