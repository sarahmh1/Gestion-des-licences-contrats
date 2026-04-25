import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Varonis} from 'app/Model/Varonis';
import { VaronisService } from 'app/Services/varonis.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajoutervr',
  templateUrl: './ajoutervr.component.html',
  styleUrls: ['./ajoutervr.component.scss']
})
export class AjoutervrComponent implements OnInit {
  clients: Client[] = [];
   varonisForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
        { label: 'GI_TN', value: CommandePasserPar.GI_TN },
        { label: 'GI_FR', value: CommandePasserPar.GI_FR },
        { label: 'GI_CI', value: CommandePasserPar.GI_CI }
      ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private varonisService: VaronisService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.varonisForm= this.fb.group({
          client: ['', Validators.required],
          dureeDeLicence: [''],
          nomDuContact: [''],
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
        return this.varonisForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.varonisForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.varonisForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadVaronis(id: number) {
        this.varonisService.getVaronisById(id).subscribe(varonis => {
          this.varonisForm.patchValue({
            client: varonis.client,
            dureeDeLicence: varonis.dureeDeLicence,
            nomDuContact: varonis.nomDuContact,
            commandePasserPar: varonis.commandePasserPar,
             sousContrat: varonis.sousContrat,
            adresseEmailContact: varonis.adresseEmailContact,
            mailAdmin: varonis.mailAdmin,
            numero: varonis.numero,
            remarque: varonis.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (varonis.licences && varonis.licences.length > 0) {
            varonis.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(varonis.ccMail);
        });
      }
    
      formatDate(date: string | Date): string {
        const d = new Date(date);
        return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
      }
    
      addVaronis() {
        if (this.varonisForm.valid) {
          const newVaronis: Varonis = {
            varonisId: null!,
            client: this.varonisForm.value.client,
            dureeDeLicence: this.varonisForm.value.dureeDeLicence,
            nomDuContact: this.varonisForm.value.nomDuContact,
            adresseEmailContact: this.varonisForm.value.adresseEmailContact,
            commandePasserPar: this.varonisForm.value.commandePasserPar,
            mailAdmin: this.varonisForm.value.mailAdmin || '',
            ccMail: this.ccMail.value,
            sousContrat: this.varonisForm.value.sousContrat,
            numero: this.varonisForm.value.numero,
            approuve: false,
            remarque: this.varonisForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.varonisService.addVaronis(newVaronis).subscribe(
            (response: any) => {
              console.log('Réponse serveur Varonis:', response);
              const varonisId = response.varonisId || response.id;
              
              // Upload file if selected
              if (this.selectedFile && varonisId) {
                this.varonisService.uploadFile(varonisId, this.selectedFile).subscribe(
                  (uploadResponse) => {
                    console.log('Upload réussi:', uploadResponse);
                    window.alert('Varonis et fichier ajoutés avec succès');
                    this.router.navigate(['/Affichervr']);
                  },
                  error => {
                    console.error('Erreur lors de l\'upload du fichier:', error);
                    console.error('Status:', error.status);
                    console.error('Error body:', error.error);
                    window.alert('Varonis ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Affichervr']);
                  }
                );
              } else {
                window.alert('Varonis ajouté avec succès');
                this.router.navigate(['/Affichervr']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du Varonis:', error);
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
      this.router.navigate(['/Affichervr']);
    }
    }
    
