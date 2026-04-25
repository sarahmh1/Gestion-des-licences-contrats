import { CommandePasserPar } from "./CommandePasserPar";
import { TypeLicence } from "./TypeLicence";

export class Wallix {
    wallixId: number;
    client: string;
    dureeDeLicence: string;
    nomDuContact: string;
    adresseEmailContact: string;
    mailAdmin: string;
    ccMail: string[];
    numero: string;
    approuve?: boolean;
    remarque: string;
    commandePasserPar: CommandePasserPar;
    sousContrat: boolean;
    licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
    fichier?: string;
    fichierOriginalName?: string;
}
