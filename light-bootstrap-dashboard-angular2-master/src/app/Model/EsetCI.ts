import { NomProduit } from "./NomProduit";
import { TypeAchat } from "./TypeAchat";
export class EsetCI
{
  
  esetid: number;            
      client: string;           
      identifiant: string;   
      //**** */    
      cle_de_Licence: string;      
      nom_produit:NomProduit;        
      nombre: number;            
      nmb_tlf: number;            
      nom_contact: string;        
      mail: string;              
      mailAdmin: string;         
      dateEx: Date;              
      typeAchat:TypeAchat;      
      approuve?:Boolean; 
      concernedPersonsEmails: string[];
    }
    
