import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Rapid7 } from 'app/Model/Rapid7';
import { Rapid7Service } from 'app/Services/rapid7.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-ajouter-rapid7',
  templateUrl: './ajouter-rapid7.component.html',
  styleUrls: ['./ajouter-rapid7.component.scss']
})
export class AjouterRapid7Component implements OnInit {
  clients: Client[] = [];
  rapid7Form!: FormGroup;
  selectedFile: File | null = null;
  commandePasserParOptions = [
       { label: 'GI_TN', value: CommandePasserPar.GI_TN },
       { label: 'GI_FR', value: CommandePasserPar.GI_FR },
       { label: 'GI_CI', value: CommandePasserPar.GI_CI }
     ];
   constructor(
     private fb: FormBuilder,
     private router: Router,
     private rapid7Service: Rapid7Service,
    private clientService: ClientService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
 
    ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
       this.rapid7Form= this.fb.group({
         client: ['', Validators.required],
         dureeDeLicence: [''],
         nomDuContact: [''],
         cleLicences: [''],
         adresseEmailContact: [''],
         sousContrat: [false],
         commandePasserPar: ['', Validators.required],
         mailAdmin: ['', [Validators.email]],
         ccMail: this.fb.array([this.fb.control('', [Validators.email])]),
         numero: [''],
         remarque: [''],
         licences: this.fb.array([
           this.createLicenceGroup()
         ])
       });
     }
   
     get ccMail(): FormArray {
       return this.rapid7Form.get('ccMail') as FormArray;
     }
   
     get licences(): FormArray {
       return this.rapid7Form.get('licences') as FormArray;
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
       const ccMailFormArray = this.rapid7Form.get('ccMail') as FormArray;
       ccMailFormArray.clear();
       if (ccMails && ccMails.length > 0) {
         ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
       } else {
         ccMailFormArray.push(this.fb.control('', Validators.email));
       }
     }
   
     loadRapid7(id: number) {
       this.rapid7Service.getRapid7ById(id).subscribe(rapid7 => {
         this.rapid7Form.patchValue({
           client: rapid7.client,
           dureeDeLicence: rapid7.dureeDeLicence,
           nomDuContact: rapid7.nomDuContact,
           sousContrat: rapid7.sousContrat,
           cleLicences: rapid7.cleLicences,
           commandePasserPar: rapid7.commandePasserPar,
           adresseEmailContact: rapid7.adresseEmailContact,
           mailAdmin: rapid7.mailAdmin,
           numero: rapid7.numero,
           remarque: rapid7.remarque
         });
   
         // Set licences (clear + patch)
         this.licences.clear();
         if (rapid7.licences && rapid7.licences.length > 0) {
           rapid7.licences.forEach(lic => {
             this.licences.push(this.fb.group({
               nomDesLicences: [lic.nomDesLicences, Validators.required],
               quantite: [lic.quantite, Validators.required],
               dateEx: [this.formatDate(lic.dateEx), Validators.required]
             }));
           });
         }
   
         this.setCcMail(rapid7.ccMail);
       });
     }
   
     formatDate(date: string | Date): string {
       const d = new Date(date);
       return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
     }
   
     addRapid7() {
       if (this.rapid7Form.valid) {
         const newRapid7: Rapid7 = {
           rapid7Id: null!,
           client: this.rapid7Form.value.client,
           cleLicences: this.rapid7Form.value.cleLicences,
           dureeDeLicence: this.rapid7Form.value.dureeDeLicence,
           nomDuContact: this.rapid7Form.value.nomDuContact,
           commandePasserPar: this.rapid7Form.value.commandePasserPar,
           adresseEmailContact: this.rapid7Form.value.adresseEmailContact,
           mailAdmin: this.rapid7Form.value.mailAdmin || '',
           ccMail: this.ccMail.value,
           sousContrat: this.rapid7Form.value.sousContrat,
           numero: this.rapid7Form.value.numero,
           approuve: false,
           remarque: this.rapid7Form.value.remarque || '',
           licences: this.licences.value
         };
   
         this.rapid7Service.addRapid7(newRapid7).subscribe(
           (response: Rapid7) => {
             // Si un fichier a été sélectionné, l'uploader après la création
             if (this.selectedFile && response.rapid7Id) {
               this.rapid7Service.uploadFile(response.rapid7Id, this.selectedFile).subscribe(
                 () => {
                   window.alert('Rapid7 ajouté avec fichier');
                   this.router.navigate(['/Afficherrapid7']);
                 },
                 (fileError) => {
                   console.error('Erreur upload fichier', fileError);
                   window.alert('Rapid7 ajouté mais échec upload fichier');
                   this.router.navigate(['/Afficherrapid7']);
                 }
               );
             } else {
               window.alert('Rapid7 ajouté avec succès');
               this.router.navigate(['/Afficherrapid7']);
             }
           },
           error => {
             console.error('Erreur lors de l\'ajout du rapid7', error);
             window.alert('Échec de l\'ajout');
           }
         );
       } else {
         window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
       }
     }
      onCancel(): void {
      this.router.navigate(['/Afficherrapid7']);
    }
   }
   
