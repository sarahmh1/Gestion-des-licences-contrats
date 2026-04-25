import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Netskope } from 'app/Model/Netskope';
import { NetskopeService } from 'app/Services/neskope.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajoutern',
  templateUrl: './ajouter.component.html',
  styleUrls: ['./ajouter.component.scss']
})
export class AjouternComponent implements OnInit {
   clients: Client[] = [];
   netskopeForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
        { label: 'GI_TN', value: CommandePasserPar.GI_TN },
        { label: 'GI_FR', value: CommandePasserPar.GI_FR },
        { label: 'GI_CI', value: CommandePasserPar.GI_CI }
      ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private netskopeService: NetskopeService,
      private clientService: ClientService
    ) {}
  
     ngOnInit(): void {
        this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.netskopeForm= this.fb.group({
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
        return this.netskopeForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.netskopeForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.netskopeForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadNetskope(id: number) {
        this.netskopeService.getNetskopeById(id).subscribe(netskope => {
          this.netskopeForm.patchValue({
            client: netskope.client,
            dureeDeLicence: netskope.dureeDeLicence,
            nomDuContact: netskope.nomDuContact,
             sousContrat: netskope.sousContrat,
             commandePasserPar: netskope.commandePasserPar,
            adresseEmailContact: netskope.adresseEmailContact,
            mailAdmin: netskope.mailAdmin,
            numero: netskope.numero,
            remarque: netskope.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (netskope.licences && netskope.licences.length > 0) {
            netskope.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(netskope.ccMail);
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
    
      addNetskope() {
        if (this.netskopeForm.valid) {
          const newNetskope: Netskope = {
            netskopeId: null!,
            client: this.netskopeForm.value.client,
            dureeDeLicence: this.netskopeForm.value.dureeDeLicence,
            nomDuContact: this.netskopeForm.value.nomDuContact,
            adresseEmailContact: this.netskopeForm.value.adresseEmailContact,
            mailAdmin: this.netskopeForm.value.mailAdmin || '',
            commandePasserPar: this.netskopeForm.value.commandePasserPar,
            ccMail: this.ccMail.value,
            sousContrat: this.netskopeForm.value.sousContrat,
            numero: this.netskopeForm.value.numero,
            approuve: false,
            remarque: this.netskopeForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.netskopeService.addNetskope(newNetskope).subscribe(
            (response: Netskope) => {
              // Upload du fichier si sélectionné
              if (this.selectedFile && response.netskopeId) {
                this.netskopeService.uploadFile(response.netskopeId, this.selectedFile).subscribe(
                  () => {
                    window.alert('Netskope ajouté avec succès');
                    this.router.navigate(['/Affichern']);
                  },
                  (error) => {
                    console.error('Erreur upload fichier:', error);
                    window.alert('Netskope ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Affichern']);
                  }
                );
              } else {
                window.alert('Netskope ajouté avec succès');
                this.router.navigate(['/Affichern']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du Netskope', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
      onCancel(): void {
      this.router.navigate(['/Affichern']);
    }
    }
    
