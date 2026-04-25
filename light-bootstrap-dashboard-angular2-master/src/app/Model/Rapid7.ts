import { CommandePasserPar } from "./CommandePasserPar";

export class Rapid7 {
    rapid7Id: number;
    client: string;
    dureeDeLicence: string;
    nomDuContact: string;
    adresseEmailContact: string;
     mailAdmin: string;
    ccMail: string[];
    numero: string;
    commandePasserPar: CommandePasserPar;
    approuve?: boolean;
    sousContrat: boolean;
    remarque: string;
    cleLicences: string;
     licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
    fichier?: string;
    fichierOriginalName?: string;
}
