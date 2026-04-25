import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Bitdefender } from 'app/Model/Bitdefender';
import { BitdefenderService } from 'app/Services/bitdefender.service';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajouterb',
  templateUrl: './ajouterb.component.html',
  styleUrls: ['./ajouterb.component.scss']
})
export class AjouterbComponent implements OnInit {
  clients: Client[] = [];
   bitdefenderForm!: FormGroup;
   selectedFile: File | null = null;
   commandePasserParOptions = [
     { label: 'GI_TN', value: CommandePasserPar.GI_TN },
     { label: 'GI_FR', value: CommandePasserPar.GI_FR },
     { label: 'GI_CI', value: CommandePasserPar.GI_CI }
   ];
    constructor(
      private fb: FormBuilder,
      private router: Router,
      private bitdefenderService: BitdefenderService,
    private clientService: ClientService) {}
  
     ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
        this.bitdefenderForm= this.fb.group({
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
        return this.bitdefenderForm.get('ccMail') as FormArray;
      }
    
      get licences(): FormArray {
        return this.bitdefenderForm.get('licences') as FormArray;
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
        const ccMailFormArray = this.bitdefenderForm.get('ccMail') as FormArray;
        ccMailFormArray.clear();
        if (ccMails && ccMails.length > 0) {
          ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
        } else {
          ccMailFormArray.push(this.fb.control('', Validators.email));
        }
      }
    
      loadBitdefender(id: number) {
        this.bitdefenderService.getBitdefenderById(id).subscribe(bitdefender => {
          this.bitdefenderForm.patchValue({
            client: bitdefender.client,
            dureeDeLicence: bitdefender.dureeDeLicence,
            nomDuContact: bitdefender.nomDuContact,
             sousContrat: bitdefender.sousContrat,
             commandePasserPar: bitdefender.commandePasserPar,
            adresseEmailContact: bitdefender.adresseEmailContact,
            mailAdmin: bitdefender.mailAdmin,
            numero: bitdefender.numero,
            remarque: bitdefender.remarque
          });
    
          // Set licences (clear + patch)
          this.licences.clear();
          if (bitdefender.licences && bitdefender.licences.length > 0) {
            bitdefender.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          }
    
          this.setCcMail(bitdefender.ccMail);
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
    
      addBitdefender() {
        if (this.bitdefenderForm.valid) {
          const newBitdefender: Bitdefender = {
            bitdefenderId: null!,
            client: this.bitdefenderForm.value.client,
            dureeDeLicence: this.bitdefenderForm.value.dureeDeLicence,
            nomDuContact: this.bitdefenderForm.value.nomDuContact,
            commandePasserPar: this.bitdefenderForm.value.commandePasserPar,
            adresseEmailContact: this.bitdefenderForm.value.adresseEmailContact,
            mailAdmin: this.bitdefenderForm.value.mailAdmin || '',
            ccMail: this.ccMail.value,
            sousContrat: this.bitdefenderForm.value.sousContrat,
            numero: this.bitdefenderForm.value.numero,
            approuve: false,
            remarque: this.bitdefenderForm.value.remarque || '',
            licences: this.licences.value
          };
    
          this.bitdefenderService.addBitdefender(newBitdefender).subscribe(
            (response: Bitdefender) => {
              // Upload du fichier si sélectionné
              if (this.selectedFile && response.bitdefenderId) {
                this.bitdefenderService.uploadFile(response.bitdefenderId, this.selectedFile).subscribe(
                  () => {
                    window.alert('Bitdefender ajouté avec succès');
                    this.router.navigate(['/Afficherb']);
                  },
                  (error) => {
                    console.error('Erreur upload fichier:', error);
                    window.alert('Bitdefender ajouté mais erreur lors de l\'upload du fichier');
                    this.router.navigate(['/Afficherb']);
                  }
                );
              } else {
                window.alert('Bitdefender ajouté avec succès');
                this.router.navigate(['/Afficherb']);
              }
            },
            error => {
              console.error('Erreur lors de l\'ajout du Bitdefender', error);
              window.alert('Échec de l\'ajout');
            }
          );
        } else {
          window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
        }
      }
       onCancel(): void {
      this.router.navigate(['/Afficherb']);
    }
    }
    
