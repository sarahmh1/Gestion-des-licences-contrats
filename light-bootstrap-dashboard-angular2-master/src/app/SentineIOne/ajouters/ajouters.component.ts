import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { SentineIOne } from 'app/Model/SentineIOne';
import { SentineIOneService } from 'app/Services/sentineIOne.service';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouters',
  templateUrl: './ajouters.component.html',
  styleUrls: ['./ajouters.component.scss']
})
export class AjouterssComponent implements OnInit {
  clients: Client[] = [];
   sentineIOneForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
        { label: 'GI_TN', value: CommandePasserPar.GI_TN },
        { label: 'GI_FR', value: CommandePasserPar.GI_FR },
        { label: 'GI_CI', value: CommandePasserPar.GI_CI }
      ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private sentineIOneService: SentineIOneService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.sentineIOneForm= this.fb.group({
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
        return this.sentineIOneForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.sentineIOneForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.sentineIOneForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadSentineIOne(id: number) {
        this.sentineIOneService.getSentineIOneById(id).subscribe(sentineIOne => {
          this.sentineIOneForm.patchValue({
            client: sentineIOne.client,
            dureeDeLicence: sentineIOne.dureeDeLicence,
            nomDuContact: sentineIOne.nomDuContact,
             sousContrat: sentineIOne.sousContrat,
             commandePasserPar: sentineIOne.commandePasserPar,
            adresseEmailContact: sentineIOne.adresseEmailContact,
            mailAdmin: sentineIOne.mailAdmin,
            numero: sentineIOne.numero,
            remarque: sentineIOne.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (sentineIOne.licences && sentineIOne.licences.length > 0) {
            sentineIOne.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(sentineIOne.ccMail);
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
    
      addSentineIOne() {
        if (this.sentineIOneForm.valid) {
          const newSentineIOne: SentineIOne = {
            sentineIOneId: null!,
            client: this.sentineIOneForm.value.client,
            dureeDeLicence: this.sentineIOneForm.value.dureeDeLicence,
            nomDuContact: this.sentineIOneForm.value.nomDuContact,
            adresseEmailContact: this.sentineIOneForm.value.adresseEmailContact,
            mailAdmin: this.sentineIOneForm.value.mailAdmin || '',
            commandePasserPar: this.sentineIOneForm.value.commandePasserPar,
            ccMail: this.ccMail.value,
            sousContrat: this.sentineIOneForm.value.sousContrat,
            numero: this.sentineIOneForm.value.numero,
            approuve: false,
            remarque: this.sentineIOneForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.sentineIOneService.addSentineIOne(newSentineIOne).subscribe(
            (response: SentineIOne) => {
              // Upload du fichier si sélectionné
              if (this.selectedFile && response.sentineIOneId) {
                this.sentineIOneService.uploadFile(response.sentineIOneId, this.selectedFile).subscribe(
                  () => {
                    window.alert('SentineIOne ajouté avec succès');
                    this.router.navigate(['/Affichers']);
                  },
                  (error) => {
                    console.error('Erreur upload fichier:', error);
                    window.alert('SentineIOne ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Affichers']);
                  }
                );
              } else {
                window.alert('SentineIOne ajouté avec succès');
                this.router.navigate(['/Affichers']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du SentineIOne', error);
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
    
