import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Fortra } from 'app/Model/Fortra';
import { FortraService } from 'app/Services/fortra.service';
import { CommandePasserPar } from "app/Model/CommandePasserPar";
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouterfortra',
  templateUrl: './ajouterfortra.component.html',
  styleUrls: ['./ajouterfortra.component.scss']
})
export class AjouterfortraComponent implements OnInit {
  clients: Client[] = [];
   fortraForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
     { label: 'GI_TN', value: CommandePasserPar.GI_TN },
     { label: 'GI_FR', value: CommandePasserPar.GI_FR },
     { label: 'GI_CI', value: CommandePasserPar.GI_CI }
   ];
   
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private fortraService: FortraService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.fortraForm= this.fb.group({
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
        return this.fortraForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.fortraForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.fortraForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadFortra(id: number) {
        this.fortraService.getFortraById(id).subscribe(fortra => {
          this.fortraForm.patchValue({
            client: fortra.client,
            dureeDeLicence: fortra.dureeDeLicence,
            nomDuContact: fortra.nomDuContact,
             sousContrat: fortra.sousContrat,
             commandePasserPar: fortra.commandePasserPar,
            adresseEmailContact: fortra.adresseEmailContact,
            mailAdmin: fortra.mailAdmin,
            numero: fortra.numero,
            remarque: fortra.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (fortra.licences && fortra.licences.length > 0) {
            fortra.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(fortra.ccMail);
        });
      }

      onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
          this.selectedFile = file;
        }
      }
    
      formatDate(date: string | Date): string {
        const d = new Date(date);
        return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
      }
    
      addFortra() {
        if (this.fortraForm.valid) {
          const newFortra: Fortra = {
            fortraId: null!,
            client: this.fortraForm.value.client,
            dureeDeLicence: this.fortraForm.value.dureeDeLicence,
            nomDuContact: this.fortraForm.value.nomDuContact,
            adresseEmailContact: this.fortraForm.value.adresseEmailContact,
            mailAdmin: this.fortraForm.value.mailAdmin || '',
            commandePasserPar: this.fortraForm.value.commandePasserPar,
            ccMail: this.ccMail.value,
            sousContrat: this.fortraForm.value.sousContrat,
            numero: this.fortraForm.value.numero,
            approuve: false,
            remarque: this.fortraForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.fortraService.addFortra(newFortra).subscribe(
            (response: Fortra) => {
              // Upload du fichier si sélectionné
              if (this.selectedFile && response.fortraId) {
                this.fortraService.uploadFile(response.fortraId, this.selectedFile).subscribe(
                  () => {
                    window.alert('Fortra ajouté avec succès');
                    this.router.navigate(['/Afficherfortra']);
                  },
                  (error) => {
                    console.error('Erreur upload fichier:', error);
                    window.alert('Fortra ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Afficherfortra']);
                  }
                );
              } else {
                window.alert('Fortra ajouté avec succès');
                this.router.navigate(['/Afficherfortra']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du Fortra', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
       onCancel(): void {
      this.router.navigate(['/Afficherfortra']);
    }
    }
    
