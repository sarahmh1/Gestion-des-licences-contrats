import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Alwarebytes } from 'app/Model/Alwarebytes';
import { AlwarebytesService } from 'app/Services/alwarebytes.service';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { ClientService, Client } from '../../Services/client.service';
@Component({
  selector: 'app-ajoutera',
  templateUrl: './ajoutera.component.html',
  styleUrls: ['./ajoutera.component.scss']
})
export class AjouteraComponent implements OnInit {
  clients: Client[] = [];
  alwarebytesForm!: FormGroup;
  selectedFile: File | null = null;
  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alwarebytesService: AlwarebytesService,
    private clientService: ClientService) { }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.alwarebytesForm = this.fb.group({
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
    return this.alwarebytesForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.alwarebytesForm.get('licences') as FormArray;
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
    const ccMailFormArray = this.alwarebytesForm.get('ccMail') as FormArray;
    ccMailFormArray.clear();
    if (ccMails && ccMails.length > 0) {
      ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
    } else {
      ccMailFormArray.push(this.fb.control('', Validators.email));
    }
  }

  loadAlwarebytes(id: number) {
    this.alwarebytesService.getAlwarebytesById(id).subscribe(alwarebytes => {
      this.alwarebytesForm.patchValue({
        client: alwarebytes.client,
        dureeDeLicence: alwarebytes.dureeDeLicence,
        nomDuContact: alwarebytes.nomDuContact,
        sousContrat: alwarebytes.sousContrat,
        commandePasserPar: alwarebytes.commandePasserPar,
        adresseEmailContact: alwarebytes.adresseEmailContact,
        mailAdmin: alwarebytes.mailAdmin,
        numero: alwarebytes.numero,
        remarque: alwarebytes.remarque
      });

      // Set licences (clear + patch)
      this.licences.clear();
      if (alwarebytes.licences && alwarebytes.licences.length > 0) {
        alwarebytes.licences.forEach(lic => {
          this.licences.push(this.fb.group({
            nomDesLicences: [lic.nomDesLicences, Validators.required],
            quantite: [lic.quantite, Validators.required],
            dateEx: [this.formatDate(lic.dateEx), Validators.required]
          }));
        });
      }

      this.setCcMail(alwarebytes.ccMail);
    });
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
  }

  addAlwarebytes() {
    if (this.alwarebytesForm.valid) {
      const newAlwarebytes: Alwarebytes = {
        alwarebytesId: null!,
        client: this.alwarebytesForm.value.client,
        dureeDeLicence: this.alwarebytesForm.value.dureeDeLicence,
        nomDuContact: this.alwarebytesForm.value.nomDuContact,
        commandePasserPar: this.alwarebytesForm.value.commandePasserPar,
        adresseEmailContact: this.alwarebytesForm.value.adresseEmailContact,
        mailAdmin: this.alwarebytesForm.value.mailAdmin || '',
        ccMail: this.ccMail.value,
        sousContrat: this.alwarebytesForm.value.sousContrat,
        numero: this.alwarebytesForm.value.numero,
        approuve: false,
        remarque: this.alwarebytesForm.value.remarque || '',
        licences: this.licences.value
      };

      this.alwarebytesService.addAlwarebytes(newAlwarebytes).subscribe(
        (response: any) => {
          console.log('Réponse serveur Alwarebytes:', response);
          const alwarebytesId = response.alwarebytesId || response.id;

          if (this.selectedFile && alwarebytesId) {
            this.alwarebytesService.uploadFile(alwarebytesId, this.selectedFile).subscribe(
              (uploadResponse) => {
                console.log('Upload réussi:', uploadResponse);
                window.alert('Alwarebytes et fichier ajoutés avec succès');
                this.router.navigate(['/Affichera']);
              },
              error => {
                console.error('Erreur lors de l\'upload du fichier:', error);
                console.error('Status:', error.status);
                console.error('Error body:', error.error);
                window.alert('Alwarebytes ajouté, mais erreur lors de l\'upload du fichier');
                this.router.navigate(['/Affichera']);
              }
            );
          } else {
            window.alert('Alwarebytes ajouté avec succès');
            this.router.navigate(['/Affichera']);
          }
        },
        error => {
          console.error('Erreur lors de l\'ajout du Alwarebytes:', error);
          window.alert('Échec de l\'ajout');
        }
      );
    } else {
      window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');
    }
  }
  onCancel(): void {
    this.router.navigate(['/Affichera']);
  }
}
