import { CommandePasserPar } from "app/Model/CommandePasserPar";
export class Fortra {
    fortraId: number;
    client: string;
    dureeDeLicence: string;
    nomDuContact: string;
    adresseEmailContact: string;
    commandePasserPar:CommandePasserPar; 
    mailAdmin: string;
    ccMail: string[];
    numero: string;
    approuve?: boolean;
    remarque: string;
    sousContrat: boolean;
    fichier?: string;
    fichierOriginalName?: string;
     licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
}
