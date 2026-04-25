import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { F5 } from 'app/Model/F5';
import { F5Service } from 'app/Services/f5.service';
import { CommandePasserPar } from "app/Model/CommandePasserPar";
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouterf',
  templateUrl: './ajouterf.component.html',
  styleUrls: ['./ajouterf.component.scss']
})
export class AjouterfComponent implements OnInit {
  clients: Client[] = [];
   f5Form!: FormGroup;
   selectedFile: File | null = null;
    commandePasserParOptions = [
     { label: 'GI_TN', value: CommandePasserPar.GI_TN },
     { label: 'GI_FR', value: CommandePasserPar.GI_FR },
     { label: 'GI_CI', value: CommandePasserPar.GI_CI }
   ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private f5Service: F5Service,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.f5Form= this.fb.group({
          client: ['', Validators.required],
          dureeDeLicence: [''],
          nomDuContact: [''],
          adresseEmailContact: [''],
          sousContrat: [false],
          mailAdmin: ['', [Validators.email]],
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
        return this.f5Form.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.f5Form.get('licences') as FormArray;
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
        const ccMailFormArray = this.f5Form.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadF5(id: number) {
        this.f5Service.getF5ById(id).subscribe(f5 => {
          this.f5Form.patchValue({
            client: f5.client,
            dureeDeLicence: f5.dureeDeLicence,
            nomDuContact: f5.nomDuContact,
             sousContrat: f5.sousContrat,
             commandePasserPar: f5.commandePasserPar,
            adresseEmailContact: f5.adresseEmailContact,
            mailAdmin: f5.mailAdmin,
            numero: f5.numero,
            remarque: f5.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (f5.licences && f5.licences.length > 0) {
            f5.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(f5.ccMail);
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
    
      addF5() {
        if (this.f5Form.valid) {
          const newF5: F5 = {
            f5Id: null!,
            client: this.f5Form.value.client,
            dureeDeLicence: this.f5Form.value.dureeDeLicence,
            nomDuContact: this.f5Form.value.nomDuContact,
            adresseEmailContact: this.f5Form.value.adresseEmailContact,
            mailAdmin: this.f5Form.value.mailAdmin || '',
            ccMail: this.ccMail.value,
            sousContrat: this.f5Form.value.sousContrat,
            commandePasserPar: this.f5Form.value.commandePasserPar,
            numero: this.f5Form.value.numero,
            approuve: false,
            remarque: this.f5Form.value.remarque || '',
            licences: this.licences.value
          };
    
          this.f5Service.addF5(newF5).subscribe(
            (response: F5) => {
              // Upload du fichier si sélectionné
              if (this.selectedFile && response.f5Id) {
                this.f5Service.uploadFile(response.f5Id, this.selectedFile).subscribe(
                  () => {
                    window.alert('F5 ajouté avec succès');
                    this.router.navigate(['/Afficherf']);
                  },
                  (error) => {
                    console.error('Erreur upload fichier:', error);
                    window.alert('F5 ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Afficherf']);
                  }
                );
              } else {
                window.alert('F5 ajouté avec succès');
                this.router.navigate(['/Afficherf']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du f5', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
      onCancel(): void {
      this.router.navigate(['/Afficherf']);
    }
    }
    
