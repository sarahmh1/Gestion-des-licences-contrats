import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Bitdefender } from 'app/Model/Bitdefender';
import { BitdefenderService } from 'app/Services/bitdefender.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-bitdefender',
  templateUrl: './ajouterb.component.html',
  styleUrls: ['./ajouterb.component.scss']
})
export class AjouterbComponent implements OnInit, OnChanges {
  @Output() bitdefenderAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() bitdefenderToEdit: Bitdefender | null = null;

  clients: Client[] = [];
  bitdefenderForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentBitdefenderId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

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
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bitdefenderToEdit']?.currentValue && this.bitdefenderForm) {
      this.bitdefenderToEdit = changes['bitdefenderToEdit'].currentValue;
      this.loadBitdefenderIntoForm();
    }
  }

  initializeForm(): void {
    this.bitdefenderForm = this.fb.group({
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
    if (this.bitdefenderToEdit) {
      this.loadBitdefenderIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.bitdefenderForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.bitdefenderForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadBitdefenderIntoForm(): void {
    if (!this.bitdefenderToEdit) return;

    this.isEditing = true;
    this.currentBitdefenderId = this.bitdefenderToEdit.bitdefenderId;

    this.bitdefenderForm.patchValue({
      client: this.bitdefenderToEdit.client,
      dureeDeLicence: this.bitdefenderToEdit.dureeDeLicence,
      nomDuContact: this.bitdefenderToEdit.nomDuContact,
      commandePasserPar: this.bitdefenderToEdit.commandePasserPar,
      sousContrat: this.bitdefenderToEdit.sousContrat,
      adresseEmailContact: this.bitdefenderToEdit.adresseEmailContact,
      mailAdmin: this.bitdefenderToEdit.mailAdmin,
      numero: this.bitdefenderToEdit.numero,
      remarque: this.bitdefenderToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.bitdefenderToEdit.licences?.length) {
      this.bitdefenderToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.bitdefenderToEdit.ccMail);
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

  addBitdefender(): void {
    if (!this.bitdefenderForm.valid) {
      this.bitdefenderForm.markAllAsTouched();
      return;
    }

    const payload: Bitdefender = {
      bitdefenderId: this.isEditing ? this.currentBitdefenderId! : 0,
      client: this.bitdefenderForm.value.client,
      dureeDeLicence: this.bitdefenderForm.value.dureeDeLicence,
      nomDuContact: this.bitdefenderForm.value.nomDuContact,
      adresseEmailContact: this.bitdefenderForm.value.adresseEmailContact,
      mailAdmin: this.bitdefenderForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.bitdefenderForm.value.commandePasserPar,
      sousContrat: this.bitdefenderForm.value.sousContrat,
      numero: this.bitdefenderForm.value.numero,
      approuve: this.isEditing ? (this.bitdefenderToEdit?.approuve ?? false) : false,
      remarque: this.bitdefenderForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.bitdefenderToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.bitdefenderToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.bitdefenderService.updateBitdefender(payload)
      : this.bitdefenderService.addBitdefender(payload);

    request$.subscribe({
      next: (response: Bitdefender) => {
        const id = this.isEditing ? this.currentBitdefenderId! : response?.bitdefenderId;
        if (this.selectedFile && id != null) {
          this.bitdefenderService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Bitdefender mis à jour mais erreur upload fichier'
                : 'Bitdefender ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Bitdefender', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Bitdefender et fichier mis à jour' : 'Bitdefender mis à jour avec succès')
      : (fromUpload ? 'Bitdefender et fichier ajoutés' : 'Bitdefender ajouté avec succès');
    window.alert(msg);
    if (this.bitdefenderAdded.observers.length) {
      this.bitdefenderAdded.emit();
    } else {
      this.router.navigate(['/Afficherb']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-bitdefender') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.bitdefenderToEdit) {
      this.loadBitdefenderIntoForm();
    } else {
      this.isEditing = false;
      this.currentBitdefenderId = null;
      this.bitdefenderForm.reset({
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
      this.router.navigate(['/Afficherb']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
