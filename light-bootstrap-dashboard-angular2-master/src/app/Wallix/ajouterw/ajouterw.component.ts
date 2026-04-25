import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Wallix } from 'app/Model/Wallix';
import { WallixService } from 'app/Services/wallix.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouterw',
  templateUrl: './ajouterw.component.html',
  styleUrls: ['./ajouterw.component.scss']
})
export class AjouterwComponent implements OnInit {
  clients: Client[] = [];
  wallixForm!: FormGroup;
  selectedFile: File | null = null;
  commandePasserParOptions = [
       { label: 'GI_TN', value: CommandePasserPar.GI_TN },
       { label: 'GI_FR', value: CommandePasserPar.GI_FR },
       { label: 'GI_CI', value: CommandePasserPar.GI_CI }
     ];
   constructor(
     private fb: FormBuilder,
     private router: Router,
     private wallixService: WallixService,
    private clientService: ClientService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
 
    ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
       this.wallixForm= this.fb.group({
         client: ['', Validators.required],
         dureeDeLicence: ['', Validators.required],
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
       return this.wallixForm.get('ccMail') as FormArray;
     }
   
     get licences(): FormArray {
       return this.wallixForm.get('licences') as FormArray;
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
       const ccMailFormArray = this.wallixForm.get('ccMail') as FormArray;
       ccMailFormArray.clear();
       if (ccMails && ccMails.length > 0) {
         ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
       } else {
         ccMailFormArray.push(this.fb.control('', Validators.email));
       }
     }
   
     loadWallix(id: number) {
       this.wallixService.getWallixById(id).subscribe(wallix => {
         this.wallixForm.patchValue({
           client: wallix.client,
           dureeDeLicence: wallix.dureeDeLicence,
           nomDuContact: wallix.nomDuContact,
            sousContrat: wallix.sousContrat,
            commandePasserPar: wallix.commandePasserPar,
           adresseEmailContact: wallix.adresseEmailContact,
           mailAdmin: wallix.mailAdmin,
           numero: wallix.numero,
           remarque: wallix.remarque
         });
   
         // Set licences (clear + patch)
         this.licences.clear();
         if (wallix.licences && wallix.licences.length > 0) {
           wallix.licences.forEach(lic => {
             this.licences.push(this.fb.group({
               nomDesLicences: [lic.nomDesLicences, Validators.required],
               quantite: [lic.quantite, Validators.required],
               dateEx: [this.formatDate(lic.dateEx), Validators.required]
             }));
           });
         }
   
         this.setCcMail(wallix.ccMail);
       });
     }
   
     formatDate(date: string | Date): string {
       const d = new Date(date);
       return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
     }
   
     addWallix() {
       if (this.wallixForm.valid) {
         const newWallix: Wallix = {
           wallixId: null!,
           client: this.wallixForm.value.client,
           dureeDeLicence: this.wallixForm.value.dureeDeLicence,
           nomDuContact: this.wallixForm.value.nomDuContact,
           adresseEmailContact: this.wallixForm.value.adresseEmailContact,
           mailAdmin: this.wallixForm.value.mailAdmin || '',
           ccMail: this.ccMail.value,
           commandePasserPar: this.wallixForm.value.commandePasserPar,
           sousContrat: this.wallixForm.value.sousContrat,
           numero: this.wallixForm.value.numero,
           approuve: false,
           remarque: this.wallixForm.value.remarque || '',
           licences: this.licences.value
         };
   
         this.wallixService.addWallix(newWallix).subscribe(
           (response: Wallix) => {
             // Si un fichier a été sélectionné, l'uploader après la création
             if (this.selectedFile && response.wallixId) {
               this.wallixService.uploadFile(response.wallixId, this.selectedFile).subscribe(
                 () => {
                   window.alert('Wallix ajouté avec fichier');
                   this.router.navigate(['/Afficherwallix']);
                 },
                 (fileError) => {
                   console.error('Erreur upload fichier', fileError);
                   window.alert('Wallix ajouté mais échec upload fichier');
                   this.router.navigate(['/Afficherwallix']);
                 }
               );
             } else {
               window.alert('Wallix ajouté avec succès');
               this.router.navigate(['/Afficherwallix']);
             }
           },
           error => {
             console.error('Erreur lors de l\'ajout du wallix', error);
             window.alert('Échec de l\'ajout');
           }
         );
       } else {
         window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
       }
     }
     onCancel(): void {
      this.router.navigate(['/Afficherwallix']);
    }
   }
   
