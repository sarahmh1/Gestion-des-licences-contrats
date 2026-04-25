import { CommandePasserPar } from 'app/Model/CommandePasserPar';
export class Cisco {
    ciscoId: number;
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
     licences: {
      nomDesLicences: string;
      quantite: string;
      dateEx: Date;
}[];
    fichier?: string;
    fichierOriginalName?: string;
}
