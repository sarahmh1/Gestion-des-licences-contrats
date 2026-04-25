import { MicrosoftO365 } from './../../Model/MicrosoftO365';
import { Component, OnInit } from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { MicrosoftO365Service } from 'app/Services/microsoft-o365.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouterm',
  templateUrl: './ajouterm.component.html',
  styleUrls: ['./ajouterm.component.scss']
})
export class AjoutermComponent implements OnInit {
  clients: Client[] = [];

 microsoftForm!: FormGroup;
 selectedFile: File | null = null;
 commandePasserParOptions = [
      { label: 'GI_TN', value: CommandePasserPar.GI_TN },
      { label: 'GI_FR', value: CommandePasserPar.GI_FR },
      { label: 'GI_CI', value: CommandePasserPar.GI_CI }
    ];
     constructor(
       private fb: FormBuilder,
       private router: Router,
       private microsoftService: MicrosoftO365Service,
    private clientService: ClientService) {}
   
      ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
         this.microsoftForm= this.fb.group({
           client: ['', Validators.required],
           dureeDeLicence: [''],
           nomDuContact: [''],
           adresseEmailContact: [''],
           sousContrat: [false],
           mailAdmin: ['', [Validators.email]],
           commandePasserPar: ['', Validators.required],
           ccMail: this.fb.array([this.fb.control('', [Validators.email])]),
           numero: [''],
           remarque: [''],
           licences: this.fb.array([
             this.createLicenceGroup()
           ])
         });
       }
     
       get ccMail(): FormArray {
         return this.microsoftForm.get('ccMail') as FormArray;
       }
     
       get licences(): FormArray {
         return this.microsoftForm.get('licences') as FormArray;
       }
     
       createLicenceGroup(): FormGroup {
         return this.fb.group({
           nomDesLicences: ['', Validators.required],
           quantite: ['', Validators.required],
           dateEx: ['', Validators.required]
         });
       }
     
       addLicence() {
         this.licences.push(this.createLicenceGroup());
       }
     
       removeLicence(index: number) {
         this.licences.removeAt(index);
       }
     
       addCcMail() {
         this.ccMail.push(this.fb.control('', [Validators.email]));
       }
     
       removeCcMail(index: number) {
         this.ccMail.removeAt(index);  
       }
     
       setCcMail(ccMails: string[]) {
         const ccMailFormArray = this.microsoftForm.get('ccMail') as FormArray;
         ccMailFormArray.clear();
         if (ccMails && ccMails.length > 0) {
           ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
         } else {
           ccMailFormArray.push(this.fb.control('', Validators.email));
         }
       }
     
       loadMicrosoft(id: number) {
         this.microsoftService.getMicrosoftO365ById(id).subscribe(microsoftO365 => {
           this.microsoftForm.patchValue({
             client: microsoftO365.client,
             dureeDeLicence: microsoftO365.dureeDeLicence,
             nomDuContact: microsoftO365.nomDuContact,
              sousContrat: microsoftO365.sousContrat,
              commandePasserPar: microsoftO365.commandePasserPar,
             adresseEmailContact: microsoftO365.adresseEmailContact,
             mailAdmin: microsoftO365.mailAdmin,
             numero: microsoftO365.numero,
             remarque: microsoftO365.remarque
           });
     
           // Set licences (clear + patch)
           this.licences.clear();
           if (microsoftO365.licences && microsoftO365.licences.length > 0) {
             microsoftO365.licences.forEach(lic => {
               this.licences.push(this.fb.group({
                 nomDesLicences: [lic.nomDesLicences, Validators.required],
                 quantite: [lic.quantite, Validators.required],
                 dateEx: [this.formatDate(lic.dateEx), Validators.required]
               }));
             });
           }
     
           this.setCcMail(microsoftO365.ccMail);
         });
       }
     
       formatDate(date: string | Date): string {
         const d = new Date(date);
         return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
       }
     
       addMicrosoft0365() {
         if (this.microsoftForm.valid) {
           const newMicrosoft0365: MicrosoftO365 = {
             microsoftO365Id: null!,
             client: this.microsoftForm.value.client,
             dureeDeLicence: this.microsoftForm.value.dureeDeLicence,
             nomDuContact: this.microsoftForm.value.nomDuContact,
             adresseEmailContact: this.microsoftForm.value.adresseEmailContact,
             mailAdmin: this.microsoftForm.value.mailAdmin || '',
              commandePasserPar: this.microsoftForm.value.commandePasserPar,
             ccMail: this.ccMail.value,
             sousContrat: this.microsoftForm.value.sousContrat,
             numero: this.microsoftForm.value.numero,
             approuve: false,
             remarque: this.microsoftForm.value.remarque || '',
             licences: this.licences.value
           };
     
           this.microsoftService.addMicrosoftO365(newMicrosoft0365).subscribe(
             (response: any) => {
               console.log('Réponse serveur MicrosoftO365:', response);
               const microsoftO365Id = response.microsoftO365Id || response.id;
               
               // Upload file if selected
               if (this.selectedFile && microsoftO365Id) {
                 this.microsoftService.uploadFile(microsoftO365Id, this.selectedFile).subscribe(
                   (uploadResponse) => {
                     console.log('Upload réussi:', uploadResponse);
                     window.alert('MicrosoftO365 et fichier ajoutés avec succès');
                     this.router.navigate(['/Affichermicro']);
                   },
                   error => {
                     console.error('Erreur lors de l\'upload du fichier:', error);
                     console.error('Status:', error.status);
                     console.error('Error body:', error.error);
                     window.alert('MicrosoftO365 ajouté mais erreur lors de l\'upload du fichier');
                     this.router.navigate(['/Affichermicro']);
                   }
                 );
               } else {
                 window.alert('MicrosoftO365 ajouté avec succès');
                 this.router.navigate(['/Affichermicro']);
               }
             },
             error => {
               console.error('Erreur lors de l\'ajout du MicrosoftO365:', error);
               window.alert('Échec de l\'ajout');
             }
           );
         } else {
           window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
         }
       }

       onFileSelected(event: any): void {
         this.selectedFile = event.target.files[0];
       }

       onCancel(): void {
      this.router.navigate(['/Affichermicro']);
    }
     }
     
