import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { SecPoint } from 'app/Model/SecPoint';
import { SecPointService } from 'app/Services/sec-point.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouters',
  templateUrl: './ajouters.component.html',
  styleUrls: ['./ajouters.component.scss']
})
export class AjoutersComponent implements OnInit {
  clients: Client[] = [];
   secPointForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
        { label: 'GI_TN', value: CommandePasserPar.GI_TN },
        { label: 'GI_FR', value: CommandePasserPar.GI_FR },
        { label: 'GI_CI', value: CommandePasserPar.GI_CI }
      ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private secPointService: SecPointService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.secPointForm= this.fb.group({
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
        return this.secPointForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.secPointForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.secPointForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadSecPoint(id: number) {
        this.secPointService.getSecPointById(id).subscribe(secPoint => {
          this.secPointForm.patchValue({
            client: secPoint.client,
            dureeDeLicence: secPoint.dureeDeLicence,
            nomDuContact: secPoint.nomDuContact,
             sousContrat: secPoint.sousContrat,
             commandePasserPar: secPoint.commandePasserPar,
            adresseEmailContact: secPoint.adresseEmailContact,
            mailAdmin: secPoint.mailAdmin,
            numero: secPoint.numero,
            remarque: secPoint.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (secPoint.licences && secPoint.licences.length > 0) {
            secPoint.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(secPoint.ccMail);
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
    
      addSecPoint() {
        if (this.secPointForm.valid) {
          const newSecPoint: SecPoint = {
            secPointId: null!,
            client: this.secPointForm.value.client,
            dureeDeLicence: this.secPointForm.value.dureeDeLicence,
            nomDuContact: this.secPointForm.value.nomDuContact,
            adresseEmailContact: this.secPointForm.value.adresseEmailContact,
            mailAdmin: this.secPointForm.value.mailAdmin || '',
            ccMail: this.ccMail.value,
            commandePasserPar: this.secPointForm.value.commandePasserPar,
            sousContrat: this.secPointForm.value.sousContrat,
            numero: this.secPointForm.value.numero,
            approuve: false,
            remarque: this.secPointForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.secPointService.addSecPoint(newSecPoint).subscribe(
            (response: SecPoint) => {
              // Upload du fichier si sélectionné
              if (this.selectedFile && response.secPointId) {
                this.secPointService.uploadFile(response.secPointId, this.selectedFile).subscribe(
                  () => {
                    window.alert('SecPoint ajouté avec succès');
                    this.router.navigate(['/Affichers']);
                  },
                  (error) => {
                    console.error('Erreur upload fichier:', error);
                    window.alert('SecPoint ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Affichers']);
                  }
                );
              } else {
                window.alert('SecPoint ajouté avec succès');
                this.router.navigate(['/Affichers']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du secPoint', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
      onCancel(): void {
      this.router.navigate(['/Affichers']);
    }
    }
    
