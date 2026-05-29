import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Proofpoint } from 'app/Model/Proofpoint';
import { ProofpointService } from 'app/Services/proofpoint.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-proofpoint',
  templateUrl: './ajouter-proofpoint.component.html',
  styleUrls: ['./ajouter-proofpoint.component.scss']
})
export class AjouterProofpointComponent implements OnInit, OnChanges {
  @Output() proofpointAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() proofpointToEdit: Proofpoint | null = null;

  clients: Client[] = [];
  proofpointForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentProofpointId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private proofpointService: ProofpointService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proofpointToEdit']?.currentValue && this.proofpointForm) {
      this.proofpointToEdit = changes['proofpointToEdit'].currentValue;
      this.loadProofpointIntoForm();
    }
  }

  initializeForm(): void {
    this.proofpointForm = this.fb.group({
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
    if (this.proofpointToEdit) {
      this.loadProofpointIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.proofpointForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.proofpointForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadProofpointIntoForm(): void {
    if (!this.proofpointToEdit) return;

    this.isEditing = true;
    this.currentProofpointId = this.proofpointToEdit.proofpointId;

    this.proofpointForm.patchValue({
      client: this.proofpointToEdit.client,
      dureeDeLicence: this.proofpointToEdit.dureeDeLicence,
      nomDuContact: this.proofpointToEdit.nomDuContact,
      commandePasserPar: this.proofpointToEdit.commandePasserPar,
      sousContrat: this.proofpointToEdit.sousContrat,
      adresseEmailContact: this.proofpointToEdit.adresseEmailContact,
      mailAdmin: this.proofpointToEdit.mailAdmin,
      numero: this.proofpointToEdit.numero,
      remarque: this.proofpointToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.proofpointToEdit.licences?.length) {
      this.proofpointToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.proofpointToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.proofpointForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.proofpointForm.get('licences') as FormArray;
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

  addProofpoint(): void {
    if (!this.proofpointForm.valid) {
      this.proofpointForm.markAllAsTouched();
      return;
    }

    const payload: Proofpoint = {
      proofpointId: this.isEditing ? this.currentProofpointId! : null!,
      client: this.proofpointForm.value.client,
      dureeDeLicence: this.proofpointForm.value.dureeDeLicence,
      nomDuContact: this.proofpointForm.value.nomDuContact,
      adresseEmailContact: this.proofpointForm.value.adresseEmailContact,
      mailAdmin: this.proofpointForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.proofpointForm.value.commandePasserPar,
      sousContrat: this.proofpointForm.value.sousContrat,
      numero: this.proofpointForm.value.numero,
      approuve: this.isEditing ? (this.proofpointToEdit?.approuve ?? false) : false,
      remarque: this.proofpointForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.proofpointToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.proofpointToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.proofpointService.updateProofpoint(payload)
      : this.proofpointService.addProofpoint(payload);

    request$.subscribe({
      next: (response: any) => {
        const id = this.isEditing ? this.currentProofpointId! : response?.proofpointId;
        if (this.selectedFile && id) {
          this.proofpointService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Proofpoint mis a jour mais erreur upload fichier'
                : 'Proofpoint ajoute mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Proofpoint', err);
        window.alert(this.isEditing ? 'Echec de la mise a jour' : 'Echec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Proofpoint et fichier mis a jour' : 'Proofpoint mis a jour avec succes')
      : (fromUpload ? 'Proofpoint et fichier ajoutes' : 'Proofpoint ajoute avec succes');
    window.alert(msg);
    if (this.proofpointAdded.observers.length) {
      this.proofpointAdded.emit();
    } else {
      this.router.navigate(['/Afficherproof']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.proofpointToEdit) {
      this.loadProofpointIntoForm();
    } else {
      this.isEditing = false;
      this.currentProofpointId = null;
      this.proofpointForm.reset({
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
      this.router.navigate(['/Afficherproof']);
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentProofpointId = null;
    this.selectedFile = null;
    this.proofpointForm.reset();
    this.licences.clear();
    this.licences.push(this.createLicenceGroup());
    this.ccMail.clear();
    this.ccMail.push(this.fb.control('', Validators.email));
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
