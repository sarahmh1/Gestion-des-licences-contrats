import { CommandePasserPar } from "./CommandePasserPar";


export class Crowdstrike {
    crowdstrikeid: number;
    client: string;
     licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
    dureeLicence: string;
    nomDuContact: string;
    adresseEmailContact: string;
    mailAdmin: string;
    commandePasserPar: CommandePasserPar;
    ccMail: string[];
    numero: string;
    sousContrat: boolean;
    approuve?: boolean;
    remarques: string;
    fichier?: string;
    fichierOriginalName?: string;
    
}
