import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Fortra } from 'app/Model/Fortra';
import { FortraService } from 'app/Services/fortra.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-fortra',
  templateUrl: './ajouterfortra.component.html',
  styleUrls: ['./ajouterfortra.component.scss']
})
export class AjouterfortraComponent implements OnInit, OnChanges {
  @Output() fortraAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() fortraToEdit: Fortra | null = null;

  clients: Client[] = [];
  fortraForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentFortraId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

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
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fortraToEdit']?.currentValue && this.fortraForm) {
      this.fortraToEdit = changes['fortraToEdit'].currentValue;
      this.loadFortraIntoForm();
    }
  }

  initializeForm(): void {
    this.fortraForm = this.fb.group({
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
    if (this.fortraToEdit) {
      this.loadFortraIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.fortraForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.fortraForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadFortraIntoForm(): void {
    if (!this.fortraToEdit) return;

    this.isEditing = true;
    this.currentFortraId = this.fortraToEdit.fortraId;

    this.fortraForm.patchValue({
      client: this.fortraToEdit.client,
      dureeDeLicence: this.fortraToEdit.dureeDeLicence,
      nomDuContact: this.fortraToEdit.nomDuContact,
      commandePasserPar: this.fortraToEdit.commandePasserPar,
      sousContrat: this.fortraToEdit.sousContrat,
      adresseEmailContact: this.fortraToEdit.adresseEmailContact,
      mailAdmin: this.fortraToEdit.mailAdmin,
      numero: this.fortraToEdit.numero,
      remarque: this.fortraToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.fortraToEdit.licences?.length) {
      this.fortraToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.fortraToEdit.ccMail);
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

  addFortra(): void {
    if (!this.fortraForm.valid) {
      this.fortraForm.markAllAsTouched();
      return;
    }

    const payload: Fortra = {
      fortraId: this.isEditing ? this.currentFortraId! : 0,
      client: this.fortraForm.value.client,
      dureeDeLicence: this.fortraForm.value.dureeDeLicence,
      nomDuContact: this.fortraForm.value.nomDuContact,
      adresseEmailContact: this.fortraForm.value.adresseEmailContact,
      mailAdmin: this.fortraForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.fortraForm.value.commandePasserPar,
      sousContrat: this.fortraForm.value.sousContrat,
      numero: this.fortraForm.value.numero,
      approuve: this.isEditing ? (this.fortraToEdit?.approuve ?? false) : false,
      remarque: this.fortraForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.fortraToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.fortraToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.fortraService.updateFortra(payload)
      : this.fortraService.addFortra(payload);

    request$.subscribe({
      next: (response: Fortra) => {
        const id = this.isEditing ? this.currentFortraId! : response?.fortraId;
        if (this.selectedFile && id != null) {
          this.fortraService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Fortra mis à jour mais erreur upload fichier'
                : 'Fortra ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Fortra', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Fortra et fichier mis à jour' : 'Fortra mis à jour avec succès')
      : (fromUpload ? 'Fortra et fichier ajoutés' : 'Fortra ajouté avec succès');
    window.alert(msg);
    if (this.fortraAdded.observers.length) {
      this.fortraAdded.emit();
    } else {
      this.router.navigate(['/Afficherfortra']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-fortra') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.fortraToEdit) {
      this.loadFortraIntoForm();
    } else {
      this.isEditing = false;
      this.currentFortraId = null;
      this.fortraForm.reset({
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
      this.router.navigate(['/Afficherfortra']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
