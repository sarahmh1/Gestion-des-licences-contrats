import { CommandePasserPar } from "./CommandePasserPar";
import { TypeLicence } from "./TypeLicence";

export class Veeam {
    veeamId: number;
    client: string;
    dureeDeLicence: string;
    nomDuContact: string;
    adresseEmailContact: string;
    mailAdmin: string;
    ccMail: string[];
    numero: string;
    approuve?: boolean;
    commandePasserPar: CommandePasserPar;
    sousContrat: boolean;
    remarque: string;
    licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
    fichier?: string;
    fichierOriginalName?: string;
}
