import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Cisco } from 'app/Model/Cisco';
import { CiscoService } from 'app/Services/cisco.service';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouterc',
  templateUrl: './ajouterc.component.html',
  styleUrls: ['./ajouterc.component.scss']
})
export class AjoutercComponent implements OnInit {
  clients: Client[] = [];
   ciscoForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
     { label: 'GI_TN', value: CommandePasserPar.GI_TN },
     { label: 'GI_FR', value: CommandePasserPar.GI_FR },
     { label: 'GI_CI', value: CommandePasserPar.GI_CI }
   ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private ciscoService: CiscoService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.ciscoForm= this.fb.group({
          client: ['', Validators.required],
          dureeDeLicence: [''],
          nomDuContact: [''],
          adresseEmailContact: [''],
          commandePasserPar: ['', Validators.required], 
          sousContrat: [false],
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
        return this.ciscoForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.ciscoForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.ciscoForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadCisco(id: number) {
        this.ciscoService.getCiscoById(id).subscribe(cisco => {
          this.ciscoForm.patchValue({
            client: cisco.client,
            dureeDeLicence: cisco.dureeDeLicence,
            nomDuContact: cisco.nomDuContact,
             sousContrat: cisco.sousContrat,
             commandePasserPar: cisco.commandePasserPar,
            adresseEmailContact: cisco.adresseEmailContact,
            mailAdmin: cisco.mailAdmin,
            numero: cisco.numero,
            remarque: cisco.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (cisco.licences && cisco.licences.length > 0) {
           cisco.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(cisco.ccMail);
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

      addCisco() {
        if (this.ciscoForm.valid) {
          const newCisco: Cisco = {
            ciscoId: null!,
            client: this.ciscoForm.value.client,
            dureeDeLicence: this.ciscoForm.value.dureeDeLicence,
            nomDuContact: this.ciscoForm.value.nomDuContact,
            adresseEmailContact: this.ciscoForm.value.adresseEmailContact,
            mailAdmin: this.ciscoForm.value.mailAdmin || '',
            ccMail: this.ccMail.value,
            commandePasserPar: this.ciscoForm.value.commandePasserPar,
            sousContrat: this.ciscoForm.value.sousContrat,
            numero: this.ciscoForm.value.numero,
            approuve: false,
            remarque: this.ciscoForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.ciscoService.addCisco(newCisco).subscribe(
            (response: any) => {
              console.log('Réponse serveur Cisco:', response);
              const ciscoId = response.ciscoId || response.id;
              
              if (this.selectedFile && ciscoId) {
                this.ciscoService.uploadFile(ciscoId, this.selectedFile).subscribe(
                  (uploadResponse) => {
                    console.log('Upload réussi:', uploadResponse);
                    window.alert('Cisco et fichier ajoutés avec succès');
                    this.router.navigate(['/Afficherc']);
                  },
                  error => {
                    console.error('Erreur lors de l\'upload du fichier:', error);
                    console.error('Status:', error.status);
                    console.error('Error body:', error.error);
                    window.alert('Cisco ajouté mais échec de l\'upload du fichier');
                    this.router.navigate(['/Afficherc']);
                  }
                );
              } else {
                window.alert('Cisco ajouté avec succès');
                this.router.navigate(['/Afficherc']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du Cisco:', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
      onCancel(): void {
      this.router.navigate(['/Afficherc']);
    }
    }
    
