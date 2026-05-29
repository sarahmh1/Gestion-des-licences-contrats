import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { Fortinet } from 'app/Model/Fortinet';
import { FortinetService } from 'app/Services/fortinet.service';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { HttpEventType } from '@angular/common/http';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter',
  templateUrl: './ajouter.component.html',
  styleUrls: ['./ajouter.component.scss']
})
export class AjouterComponent implements OnInit {
  @Output() fortinetAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  clients: Client[] = [];
  fortinetForm!: FormGroup;
  
  // Variables pour l'upload de fichier
  selectedFile: File | null = null;
  uploadMessage: string | null = null;
  uploadSuccess = false;

  @ViewChild('clientSelect') clientSelect: SearchableClientSelectComponent | undefined;

  commandePasserParOptions = [
  { label: 'GI_TN', value: CommandePasserPar.GI_TN },
  { label: 'GI_FR', value: CommandePasserPar.GI_FR },
  { label: 'GI_CI', value: CommandePasserPar.GI_CI }
];


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private fortinetService: FortinetService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.fortinetForm = this.fb.group({
      client: ['', Validators.required],
      nomDuBoitier: ['', Validators.required],
      numeroSerie: ['', Validators.required],
      commandePasserPar: ['', Validators.required], 
      dureeDeLicence: [''],
      nomDuContact: [''],
      adresseEmailContact: [''],
      sousContrat: [false],
      mailAdmin: ['', [Validators.email]],
      ccMail: this.fb.array([this.fb.control('', [Validators.email])]),
      numero: ['', AppValidators.optionalPhone],
      remarque: [''],
      licences: this.fb.array([
        this.createLicenceGroup()
      ])
    });
    this.watchClientAutoFill();
  }

  private watchClientAutoFill(): void {
    this.fortinetForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.fortinetForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  get ccMail(): FormArray {
    return this.fortinetForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.fortinetForm.get('licences') as FormArray;
  }

  createLicenceGroup(): FormGroup {
    return this.fb.group({
      nomDesLicences: ['', Validators.required],
      quantite: ['', AppValidators.requiredQuantity],
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
    const ccMailFormArray = this.fortinetForm.get('ccMail') as FormArray;
    ccMailFormArray.clear();
    if (ccMails && ccMails.length > 0) {
      ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
    } else {
      ccMailFormArray.push(this.fb.control('', Validators.email));
    }
  }

  loadFortinet(id: number) {
    this.fortinetService.getFortinetById(id).subscribe(fortinet => {
      this.fortinetForm.patchValue({
        client: fortinet.client,
        nomDuBoitier: fortinet.nomDuBoitier,
        numeroSerie: fortinet.numeroSerie,
        commandePasserPar: fortinet.commandePasserPar,
        dureeDeLicence: fortinet.dureeDeLicence,
        nomDuContact: fortinet.nomDuContact,
         sousContrat: fortinet.sousContrat,
        adresseEmailContact: fortinet.adresseEmailContact,
        mailAdmin: fortinet.mailAdmin,
        numero: fortinet.numero,
        remarque: fortinet.remarque
      });

      // Set licences (clear + patch)
      this.licences.clear();
      if (fortinet.licences && fortinet.licences.length > 0) {
        fortinet.licences.forEach(lic => {
          this.licences.push(this.fb.group({
            nomDesLicences: [lic.nomDesLicences, Validators.required],
            quantite: [lic.quantite, AppValidators.requiredQuantity],
            dateEx: [this.formatDate(lic.dateEx), Validators.required]
          }));
        });
      }

      this.setCcMail(fortinet.ccMail);
    });
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
  }

addFortinet() {
  if (!this.fortinetForm.valid) {
    this.fortinetForm.markAllAsTouched();
    return;
  }

  const newFortinet: Fortinet = {
      fortinetId: null!,
      client: this.fortinetForm.value.client,
      nomDuBoitier: this.fortinetForm.value.nomDuBoitier,
      numeroSerie: this.fortinetForm.value.numeroSerie,
      commandePasserPar: this.fortinetForm.value.commandePasserPar,
      dureeDeLicence: this.fortinetForm.value.dureeDeLicence,
      nomDuContact: this.fortinetForm.value.nomDuContact,
      adresseEmailContact: this.fortinetForm.value.adresseEmailContact,
      mailAdmin: this.fortinetForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((email: string) => email !== ''), // Filtrer les emails vides
      sousContrat: this.fortinetForm.value.sousContrat,
      numero: this.fortinetForm.value.numero,
      approuve: false,
      remarque: this.fortinetForm.value.remarque || '',
      licences: this.licences.value
    };

    console.log('Données à envoyer:', newFortinet);

    this.fortinetService.addFortinet(newFortinet).subscribe(
      (response: any) => {
        console.log('Réponse serveur:', response);
        
        // Si un fichier est sélectionné, l'uploader après la création
        if (this.selectedFile && response.fortinetId) {
          this.uploadFileAfterCreation(response.fortinetId);
        } else {
          window.alert('Fortinet ajouté avec succès');
          this.fortinetAdded.emit();
        }
      },
      error => {
        console.error('Erreur complète:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error body:', error.error);
        window.alert('Échec de l\'ajout: ' + (error.error?.message || error.message));
      }
    );
}

onCancel(): void {
  this.cancelled.emit();
}

resetForm(): void {
  this.fortinetForm.reset();
  this.selectedFile = null;
  this.uploadMessage = null;
  // Réinitialiser les arrays
  while (this.licences.length > 1) {
    this.licences.removeAt(1);
  }
  while (this.ccMail.length > 0) {
    this.ccMail.removeAt(0);
  }
}

  // ==================== GESTION DES FICHIERS ====================
  
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadMessage = null;
    }
  }

  uploadFileAfterCreation(fortinetId: number): void {
    if (!this.selectedFile) {
      window.alert('Fortinet ajouté avec succès');
      this.fortinetAdded.emit();
      return;
    }

    this.fortinetService.uploadFile(fortinetId, this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.Response) {
          if (event.body.success) {
            this.uploadSuccess = true;
            this.uploadMessage = 'Fichier uploadé avec succès!';
            window.alert('Fortinet et fichier ajoutés avec succès');
            this.fortinetAdded.emit();
          } else {
            this.uploadSuccess = false;
            this.uploadMessage = event.body.message || 'Erreur lors de l\'upload';
            window.alert('Fortinet ajouté mais erreur lors de l\'upload du fichier');
            this.fortinetAdded.emit();
          }
        }
      },
      error: (error) => {
        this.uploadSuccess = false;
        this.uploadMessage = 'Erreur lors de l\'upload: ' + (error.error?.message || error.message);
        console.error('Erreur upload:', error);
        window.alert('Fortinet ajouté mais erreur lors de l\'upload du fichier: ' + this.uploadMessage);
        this.fortinetAdded.emit();
      }
    });
  }

  /**
   * Ferme le dropdown du client
   */
  closeClientDropdown(): void {
    if (this.clientSelect) {
      this.clientSelect.closeDropdown();
    }
  }
}
