import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { OneIdentity } from 'app/Model/OneIdentity';
import { OneIdentityService } from 'app/Services/oneIdentity.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajoutero',
  templateUrl: './ajoutero.component.html',
  styleUrls: ['./ajoutero.component.scss']
})
export class AjouteroComponent implements OnInit {
  clients: Client[] = [];
   oneIdentityForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
        { label: 'GI_TN', value: CommandePasserPar.GI_TN },
        { label: 'GI_FR', value: CommandePasserPar.GI_FR },
        { label: 'GI_CI', value: CommandePasserPar.GI_CI }
      ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private oneIdentityService: OneIdentityService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.oneIdentityForm= this.fb.group({
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
        return this.oneIdentityForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.oneIdentityForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.oneIdentityForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadOneIdentity(id: number) {
        this.oneIdentityService.getOneIdentityById(id).subscribe(oneIdentity => {
          this.oneIdentityForm.patchValue({
            client: oneIdentity.client,
            dureeDeLicence: oneIdentity.dureeDeLicence,
            nomDuContact: oneIdentity.nomDuContact,
             sousContrat: oneIdentity.sousContrat,
             commandePasserPar: oneIdentity.commandePasserPar,
            adresseEmailContact: oneIdentity.adresseEmailContact,
            mailAdmin: oneIdentity.mailAdmin,
            numero: oneIdentity.numero,
            remarque: oneIdentity.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (oneIdentity.licences && oneIdentity.licences.length > 0) {
            oneIdentity.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(oneIdentity.ccMail);
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
    
      addOneIdentity() {
        if (this.oneIdentityForm.valid) {
          const newOneIdentity: OneIdentity = {
            oneIdentityId: null!,
            client: this.oneIdentityForm.value.client,
            dureeDeLicence: this.oneIdentityForm.value.dureeDeLicence,
            nomDuContact: this.oneIdentityForm.value.nomDuContact,
            adresseEmailContact: this.oneIdentityForm.value.adresseEmailContact,
            mailAdmin: this.oneIdentityForm.value.mailAdmin || '',
            commandePasserPar: this.oneIdentityForm.value.commandePasserPar,
            ccMail: this.ccMail.value,
            sousContrat: this.oneIdentityForm.value.sousContrat,
            numero: this.oneIdentityForm.value.numero,
            approuve: false,
            remarque: this.oneIdentityForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.oneIdentityService.addOneIdentity(newOneIdentity).subscribe(
            (response: OneIdentity) => {
              // Upload du fichier si sélectionné
              if (this.selectedFile && response.oneIdentityId) {
                this.oneIdentityService.uploadFile(response.oneIdentityId, this.selectedFile).subscribe(
                  () => {
                    window.alert('OneIdentity ajouté avec succès avec le fichier');
                    this.router.navigate(['/Affichero']);
                  },
                  (error) => {
                    console.error('Erreur upload fichier:', error);
                    window.alert('OneIdentity ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Affichero']);
                  }
                );
              } else {
                window.alert('OneIdentity ajouté avec succès');
                this.router.navigate(['/Affichero']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du oneIdentity', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
      onCancel(): void {
      this.router.navigate(['/Affichero']);
    }
    }
    
