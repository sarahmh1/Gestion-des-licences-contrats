import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Splunk } from 'app/Model/Splunk';
import { SplunkService } from 'app/Services/splunk.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-ajouter-splunk',
  templateUrl: './ajouter-splunk.component.html',
  styleUrls: ['./ajouter-splunk.component.scss']
})
export class AjouterSplunkComponent implements OnInit {
  clients: Client[] = [];
 splunkForm!: FormGroup;
 selectedFile: File | null = null;
 commandePasserParOptions = [
      { label: 'GI_TN', value: CommandePasserPar.GI_TN },
      { label: 'GI_FR', value: CommandePasserPar.GI_FR },
      { label: 'GI_CI', value: CommandePasserPar.GI_CI }
    ];
     constructor(
       private fb: FormBuilder,
       private router: Router,
       private splunkService: SplunkService,
    private clientService: ClientService) {}
   
      ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
         this.splunkForm= this.fb.group({
           client: ['', Validators.required],
           dureeLicence: [''],
           nomDuContact: [''],
           adresseEmailContact: [''],
           sousContrat: [false],
           commandePasserPar: ['', Validators.required],
           mailAdmin: ['', [Validators.email]],
           ccMail: this.fb.array([this.fb.control('', [Validators.email])]),
           numero: [''],
           remarques: [''],
           licences: this.fb.array([
             this.createLicenceGroup()
           ])
         });
       }
     
       get ccMail(): FormArray {
         return this.splunkForm.get('ccMail') as FormArray;
       }
     
       get licences(): FormArray {
         return this.splunkForm.get('licences') as FormArray;
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
         const ccMailFormArray = this.splunkForm.get('ccMail') as FormArray;
         ccMailFormArray.clear();
         if (ccMails && ccMails.length > 0) {
           ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
         } else {
           ccMailFormArray.push(this.fb.control('', Validators.email));
         }
       }
     
       loadSplunk(id: number) {
         this.splunkService.getSplunkById(id).subscribe(splunk => {
           this.splunkForm.patchValue({
             client: splunk.client,
             dureeLicence: splunk.dureeLicence,
             nomDuContact: splunk.nomDuContact,
              sousContrat: splunk.sousContrat,
              commandePasserPar: splunk.commandePasserPar,
             adresseEmailContact: splunk.adresseEmailContact,
             mailAdmin: splunk.mailAdmin,
             numero: splunk.numero,
             remarque: splunk.remarques
           });
     
           // Set licences (clear + patch)
           this.licences.clear();
           if (splunk.licences && splunk.licences.length > 0) {
             splunk.licences.forEach(lic => {
               this.licences.push(this.fb.group({
                 nomDesLicences: [lic.nomDesLicences, Validators.required],
                 quantite: [lic.quantite, Validators.required],
                 dateEx: [this.formatDate(lic.dateEx), Validators.required]
               }));
             });
           }
     
           this.setCcMail(splunk.ccMail);
         });
       }
     
       formatDate(date: string | Date): string {
         const d = new Date(date);
         return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
       }

       onFileSelected(event: any): void {
         const file = event.target.files[0];
         if (file) {
           this.selectedFile = file;
         }
       }
     
       addSplunk() {
         if (this.splunkForm.valid) {
           const newSplunk: Splunk = {
             splunkid: null!,
             client: this.splunkForm.value.client,
             dureeLicence: this.splunkForm.value.dureeLicence,
             nomDuContact: this.splunkForm.value.nomDuContact,
             adresseEmailContact: this.splunkForm.value.adresseEmailContact,
             mailAdmin: this.splunkForm.value.mailAdmin || '',
             commandePasserPar: this.splunkForm.value.commandePasserPar,
             ccMail: this.ccMail.value,
             sousContrat: this.splunkForm.value.sousContrat,
             numero: this.splunkForm.value.numero,
             approuve: false,
             remarques: this.splunkForm.value.remarques || '',
             licences: this.licences.value
           };
     
           this.splunkService.addSplunk(newSplunk).subscribe(
             (response: Splunk) => {
               // Upload du fichier si sélectionné
               if (this.selectedFile && response.splunkid) {
                 this.splunkService.uploadFile(response.splunkid, this.selectedFile).subscribe(
                   () => {
                     window.alert('Splunk ajouté avec succès avec le fichier');
                     this.router.navigate(['/Affichersplunk']);
                   },
                   (error) => {
                     console.error('Erreur upload fichier:', error);
                     window.alert('Splunk ajouté mais erreur lors de l\'upload du fichier');
                     this.router.navigate(['/Affichersplunk']);
                   }
                 );
               } else {
                 window.alert('Splunk ajouté avec succès');
                 this.router.navigate(['/Affichersplunk']);
               }
             },
             error => {
               console.error('Erreur lors de l\'ajout du splunk', error);
               window.alert('Échec de l\'ajout');
             }
           );
         } else {
           window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
         }
       }
       onCancel(): void {
        this.router.navigate(['/Affichersplunk']);
      }
     }
     
