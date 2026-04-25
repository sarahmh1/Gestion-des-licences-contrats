import { CommandePasserPar } from "./CommandePasserPar";

export class Palo {
    paloId: number;
    client: string;
    nomDuBoitier: string;
    numeroSerieBoitier: string;
    dureeDeLicence: string;
    nomDuContact: string;
    adresseEmailContact: string;
    mailAdmin: string;
    commandePasserPar: CommandePasserPar;
    ccMail: string[];
    numero: string;
    approuve?: boolean;
    sousContrat: boolean;
    remarque: string;
    fichier?: string;
    fichierOriginalName?: string;
    licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
}
