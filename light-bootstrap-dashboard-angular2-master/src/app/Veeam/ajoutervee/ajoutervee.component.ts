import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Veeam } from 'app/Model/Veeam';
import { VeeamService } from 'app/Services/veeam.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-ajouter-veeam',
  templateUrl: './ajoutervee.component.html',
  styleUrls: ['./ajoutervee.component.scss']
})
export class AjouterVeeComponent implements OnInit {
  clients: Client[] = [];
  veeamForm!: FormGroup;
  selectedFile: File | null = null;
 commandePasserParOptions = [
      { label: 'GI_TN', value: CommandePasserPar.GI_TN },
      { label: 'GI_FR', value: CommandePasserPar.GI_FR },
      { label: 'GI_CI', value: CommandePasserPar.GI_CI }
    ];
   constructor(
     private fb: FormBuilder,
     private router: Router,
     private veeamService: VeeamService,
    private clientService: ClientService) {}
 
   ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
     this.veeamForm= this.fb.group({
       client: ['', Validators.required],
       dureeDeLicence: [''],
       nomDuContact: [''],
       adresseEmailContact: [''],
       sousContrat: [false],
       mailAdmin: ['', [Validators.email]],
       type: ['', [Validators.required]],
       ccMail: this.fb.array([this.fb.control('', [Validators.email])]),
       commandePasserPar: ['', Validators.required],
       numero: [''],
       remarque: [''],
       licences: this.fb.array([
         this.createLicenceGroup()
       ])
     });
   }
 
   get ccMail(): FormArray {
     return this.veeamForm.get('ccMail') as FormArray;
   }
 
   get licences(): FormArray {
     return this.veeamForm.get('licences') as FormArray;
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

   onFileSelected(event: any): void {
     const file = event.target.files[0];
     if (file) {
       this.selectedFile = file;
     }
   }
 
   setCcMail(ccMails: string[]) {
     const ccMailFormArray = this.veeamForm.get('ccMail') as FormArray;
     ccMailFormArray.clear();
     if (ccMails && ccMails.length > 0) {
       ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
     } else {
       ccMailFormArray.push(this.fb.control('', Validators.email));
     }
   }
 
   loadVeeam(id: number) {
     this.veeamService.getVeeamById(id).subscribe(veeam => {
       this.veeamForm.patchValue({
         client: veeam.client,
         dureeDeLicence: veeam.dureeDeLicence,
         nomDuContact: veeam.nomDuContact,
         sousContrat: veeam.sousContrat,
         commandePasserPar: veeam.commandePasserPar,
         adresseEmailContact: veeam.adresseEmailContact,
         mailAdmin: veeam.mailAdmin,
         numero: veeam.numero,
         remarque: veeam.remarque
       });
 
       // Set licences (clear + patch)
       this.licences.clear();
       if (veeam.licences && veeam.licences.length > 0) {
         veeam.licences.forEach(lic => {
           this.licences.push(this.fb.group({
             nomDesLicences: [lic.nomDesLicences, Validators.required],
             quantite: [lic.quantite, Validators.required],
             dateEx: [this.formatDate(lic.dateEx), Validators.required]
           }));
         });
       }
 
       this.setCcMail(veeam.ccMail);
     });
   }
 
   formatDate(date: string | Date): string {
     const d = new Date(date);
     return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
   }
 
   addVeeam() {
     if (this.veeamForm.valid) {
       const newVeeam: Veeam = {
         veeamId: null!,
         client: this.veeamForm.value.client,
         dureeDeLicence: this.veeamForm.value.dureeDeLicence,
         nomDuContact: this.veeamForm.value.nomDuContact,
         commandePasserPar: this.veeamForm.value.commandePasserPar,
         adresseEmailContact: this.veeamForm.value.adresseEmailContact,
         mailAdmin: this.veeamForm.value.mailAdmin || '',
         ccMail: this.ccMail.value,
         sousContrat: this.veeamForm.value.sousContrat,
         numero: this.veeamForm.value.numero,
         approuve: false,
         remarque: this.veeamForm.value.remarque || '',
         licences: this.licences.value
       };
 
       this.veeamService.addVeeam(newVeeam).subscribe(
         (response: any) => {
           // Si un fichier a été sélectionné, l'uploader après la création
           if (this.selectedFile && response.veeamId) {
             this.veeamService.uploadFile(response.veeamId, this.selectedFile).subscribe(
               () => {
                 window.alert('Veeam ajouté avec fichier avec succès');
                 this.router.navigate(['/Afficherveeam']);
               },
               (uploadError) => {
                 console.error('Erreur lors de l\'upload du fichier', uploadError);
                 window.alert('Veeam ajouté mais erreur lors de l\'upload du fichier');
                 this.router.navigate(['/Afficherveeam']);
               }
             );
           } else {
             window.alert('Veeam ajouté avec succès');
             this.router.navigate(['/Afficherveeam']);
           }
         },
         error => {
           console.error('Erreur lors de l\'ajout du Veeam', error);
           window.alert('Échec de l\'ajout');
         }
       );
     } else {
       window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
     }
   }
   onCancel(): void {
     this.router.navigate(['/Afficherveeam']);
   }
 }
 
