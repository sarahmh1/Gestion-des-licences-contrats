import { CommandePasserPar } from "./CommandePasserPar";
import { TypeLicence } from "./TypeLicence";

export class OneIdentity {
    oneIdentityId: number;
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
    fichier?: string;
    fichierOriginalName?: string;
     licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
}
