import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Infoblox } from 'app/Model/Infoblox';
import { InfobloxService } from 'app/Services/infoblox.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouteri',
  templateUrl: './ajouteri.component.html',
  styleUrls: ['./ajouteri.component.scss']
})
export class AjouteriComponent implements OnInit {
  clients: Client[] = [];
   infobloxForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
        { label: 'GI_TN', value: CommandePasserPar.GI_TN },
        { label: 'GI_FR', value: CommandePasserPar.GI_FR },
        { label: 'GI_CI', value: CommandePasserPar.GI_CI }
      ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private infobloxService: InfobloxService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.infobloxForm= this.fb.group({
          client: ['', Validators.required],
          dureeDeLicence: [''],
          nomDuContact: [''],
          adresseEmailContact: [''],
          sousContrat: [false],
          mailAdmin: ['', [Validators.email]],
          ccMail: this.fb.array([this.fb.control('', [Validators.email])]),
          numero: [''],
          remarque: [''],
          commandePasserPar: ['', Validators.required],
          licences: this.fb.array([
            this.createLicenceGroup()
          ])
        });
      }
    
      get ccMail(): FormArray {
        return this.infobloxForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.infobloxForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.infobloxForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadInfoblox(id: number) {
        this.infobloxService.getInfobloxById(id).subscribe(infoblox => {
          this.infobloxForm.patchValue({
            client: infoblox.client,
            dureeDeLicence: infoblox.dureeDeLicence,
            nomDuContact: infoblox.nomDuContact,
             sousContrat: infoblox.sousContrat,
             commandePasserPar: infoblox.commandePasserPar,
            adresseEmailContact: infoblox.adresseEmailContact,
            mailAdmin: infoblox.mailAdmin,
            numero: infoblox.numero,
            remarque: infoblox.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (infoblox.licences && infoblox.licences.length > 0) {
            infoblox.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(infoblox.ccMail);
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
    
      addInfoblox() {
        if (this.infobloxForm.valid) {
          const newInfoblox: Infoblox = {
            infobloxId: null!,
            client: this.infobloxForm.value.client,
            dureeDeLicence: this.infobloxForm.value.dureeDeLicence,
            nomDuContact: this.infobloxForm.value.nomDuContact,
            adresseEmailContact: this.infobloxForm.value.adresseEmailContact,
            mailAdmin: this.infobloxForm.value.mailAdmin || '',
            commandePasserPar: this.infobloxForm.value.commandePasserPar,
            ccMail: this.ccMail.value,
            sousContrat: this.infobloxForm.value.sousContrat,
            numero: this.infobloxForm.value.numero,
            approuve: false,
            remarque: this.infobloxForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.infobloxService.addInfoblox(newInfoblox).subscribe(
            (response: any) => {
              console.log('Réponse serveur Infoblox:', response);
              const infobloxId = response.infobloxId || response.id;
              
              // Si un fichier est sélectionné, l'uploader après création
              if (this.selectedFile && infobloxId) {
                this.infobloxService.uploadFile(infobloxId, this.selectedFile).subscribe(
                  (uploadResponse) => {
                    console.log('Upload réussi:', uploadResponse);
                    window.alert('Infoblox et fichier ajoutés avec succès');
                    this.router.navigate(['/Afficheri']);
                  },
                  error => {
                    console.error('Erreur lors de l\'upload du fichier:', error);
                    console.error('Status:', error.status);
                    console.error('Error body:', error.error);
                    window.alert('Infoblox ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Afficheri']);
                  }
                );
              } else {
                window.alert('Infoblox ajouté avec succès');
                this.router.navigate(['/Afficheri']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du Infoblox:', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
       onCancel(): void {
      this.router.navigate(['/Afficheri']);
    }
    }
    
