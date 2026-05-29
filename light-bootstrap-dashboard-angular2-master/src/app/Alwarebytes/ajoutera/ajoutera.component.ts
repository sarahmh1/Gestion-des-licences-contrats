import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Alwarebytes } from 'app/Model/Alwarebytes';
import { AlwarebytesService } from 'app/Services/alwarebytes.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-alwarebytes',
  templateUrl: './ajoutera.component.html',
  styleUrls: ['./ajoutera.component.scss']
})
export class AjouteraComponent implements OnInit, OnChanges {
  @Output() alwarebytesAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() alwarebytesToEdit: Alwarebytes | null = null;

  clients: Client[] = [];
  alwarebytesForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentAlwarebytesId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alwarebytesService: AlwarebytesService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alwarebytesToEdit']?.currentValue && this.alwarebytesForm) {
      this.alwarebytesToEdit = changes['alwarebytesToEdit'].currentValue;
      this.loadAlwarebytesIntoForm();
    }
  }

  initializeForm(): void {
    this.alwarebytesForm = this.fb.group({
      client: ['', Validators.required],
      dureeDeLicence: [''],
      nomDuContact: [''],
      adresseEmailContact: ['', Validators.email],
      sousContrat: [false],
      mailAdmin: ['', Validators.email],
      commandePasserPar: ['', Validators.required],
      ccMail: this.fb.array([this.fb.control('', Validators.email)]),
      numero: ['', AppValidators.optionalPhone],
      remarque: [''],
      licences: this.fb.array([this.createLicenceGroup()])
    });
    this.watchClientAutoFill();
    if (this.alwarebytesToEdit) {
      this.loadAlwarebytesIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.alwarebytesForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.alwarebytesForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadAlwarebytesIntoForm(): void {
    if (!this.alwarebytesToEdit) return;

    this.isEditing = true;
    this.currentAlwarebytesId = this.alwarebytesToEdit.alwarebytesId;

    this.alwarebytesForm.patchValue({
      client: this.alwarebytesToEdit.client,
      dureeDeLicence: this.alwarebytesToEdit.dureeDeLicence,
      nomDuContact: this.alwarebytesToEdit.nomDuContact,
      commandePasserPar: this.alwarebytesToEdit.commandePasserPar,
      sousContrat: this.alwarebytesToEdit.sousContrat,
      adresseEmailContact: this.alwarebytesToEdit.adresseEmailContact,
      mailAdmin: this.alwarebytesToEdit.mailAdmin,
      numero: this.alwarebytesToEdit.numero,
      remarque: this.alwarebytesToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.alwarebytesToEdit.licences?.length) {
      this.alwarebytesToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.alwarebytesToEdit.ccMail);
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
      quantite: ['', AppValidators.requiredQuantity],
      dateEx: ['', Validators.required]
    });
  }

  addLicence(): void {
    this.licences.push(this.createLicenceGroup());
  }

  removeLicence(index: number): void {
    this.licences.removeAt(index);
  }

  addCcMail(): void {
    this.ccMail.push(this.fb.control('', Validators.email));
  }

  removeCcMail(index: number): void {
    this.ccMail.removeAt(index);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  setCcMail(ccMails: string[]): void {
    this.ccMail.clear();
    if (ccMails?.length) {
      ccMails.forEach(email => this.ccMail.push(this.fb.control(email, Validators.email)));
    } else {
      this.ccMail.push(this.fb.control('', Validators.email));
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  }

  addAlwarebytes(): void {
    if (!this.alwarebytesForm.valid) {
      this.alwarebytesForm.markAllAsTouched();
      return;
    }

    const payload: Alwarebytes = {
      alwarebytesId: this.isEditing ? this.currentAlwarebytesId! : 0,
      client: this.alwarebytesForm.value.client,
      dureeDeLicence: this.alwarebytesForm.value.dureeDeLicence,
      nomDuContact: this.alwarebytesForm.value.nomDuContact,
      adresseEmailContact: this.alwarebytesForm.value.adresseEmailContact,
      mailAdmin: this.alwarebytesForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.alwarebytesForm.value.commandePasserPar,
      sousContrat: this.alwarebytesForm.value.sousContrat,
      numero: this.alwarebytesForm.value.numero,
      approuve: this.isEditing ? (this.alwarebytesToEdit?.approuve ?? false) : false,
      remarque: this.alwarebytesForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.alwarebytesToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.alwarebytesToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.alwarebytesService.updateAlwarebytes(payload)
      : this.alwarebytesService.addAlwarebytes(payload);

    request$.subscribe({
      next: (response: Alwarebytes) => {
        const id = this.isEditing ? this.currentAlwarebytesId! : response?.alwarebytesId;
        if (this.selectedFile && id != null) {
          this.alwarebytesService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Malwarebytes mis à jour mais erreur upload fichier'
                : 'Malwarebytes ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Malwarebytes', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Licence et fichier mis à jour' : 'Licence mise à jour avec succès')
      : (fromUpload ? 'Licence et fichier ajoutés' : 'Licence ajoutée avec succès');
    window.alert(msg);
    if (this.alwarebytesAdded.observers.length) {
      this.alwarebytesAdded.emit();
    } else {
      this.router.navigate(['/Affichera']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-alwarebytes') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.alwarebytesToEdit) {
      this.loadAlwarebytesIntoForm();
    } else {
      this.isEditing = false;
      this.currentAlwarebytesId = null;
      this.alwarebytesForm.reset({
        client: '',
        dureeDeLicence: '',
        nomDuContact: '',
        adresseEmailContact: '',
        sousContrat: false,
        mailAdmin: '',
        commandePasserPar: '',
        numero: '',
        remarque: ''
      });
      this.licences.clear();
      this.licences.push(this.createLicenceGroup());
      this.ccMail.clear();
      this.ccMail.push(this.fb.control('', Validators.email));
    }
  }

  onCancel(): void {
    if (this.cancelled.observers.length) {
      this.cancelled.emit();
    } else {
      this.router.navigate(['/Affichera']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
