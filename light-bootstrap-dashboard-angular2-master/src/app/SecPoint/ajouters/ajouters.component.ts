import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { SecPoint } from 'app/Model/SecPoint';
import { SecPointService } from 'app/Services/sec-point.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-secpoint',
  templateUrl: './ajouters.component.html',
  styleUrls: ['./ajouters.component.scss']
})
export class AjoutersComponent implements OnInit, OnChanges {
  @Output() secPointAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() secPointToEdit: SecPoint | null = null;

  clients: Client[] = [];
  secPointForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentSecPointId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

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
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['secPointToEdit']?.currentValue && this.secPointForm) {
      this.secPointToEdit = changes['secPointToEdit'].currentValue;
      this.loadSecPointIntoForm();
    }
  }

  initializeForm(): void {
    this.secPointForm = this.fb.group({
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
    if (this.secPointToEdit) {
      this.loadSecPointIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.secPointForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.secPointForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadSecPointIntoForm(): void {
    if (!this.secPointToEdit) return;

    this.isEditing = true;
    this.currentSecPointId = this.secPointToEdit.secPointId;

    this.secPointForm.patchValue({
      client: this.secPointToEdit.client,
      dureeDeLicence: this.secPointToEdit.dureeDeLicence,
      nomDuContact: this.secPointToEdit.nomDuContact,
      commandePasserPar: this.secPointToEdit.commandePasserPar,
      sousContrat: this.secPointToEdit.sousContrat,
      adresseEmailContact: this.secPointToEdit.adresseEmailContact,
      mailAdmin: this.secPointToEdit.mailAdmin,
      numero: this.secPointToEdit.numero,
      remarque: this.secPointToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.secPointToEdit.licences?.length) {
      this.secPointToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.secPointToEdit.ccMail);
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

  addSecPoint(): void {
    if (!this.secPointForm.valid) {
      this.secPointForm.markAllAsTouched();
      return;
    }

    const payload: SecPoint = {
      secPointId: this.isEditing ? this.currentSecPointId! : 0,
      client: this.secPointForm.value.client,
      dureeDeLicence: this.secPointForm.value.dureeDeLicence,
      nomDuContact: this.secPointForm.value.nomDuContact,
      adresseEmailContact: this.secPointForm.value.adresseEmailContact,
      mailAdmin: this.secPointForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.secPointForm.value.commandePasserPar,
      sousContrat: this.secPointForm.value.sousContrat,
      numero: this.secPointForm.value.numero,
      approuve: this.isEditing ? (this.secPointToEdit?.approuve ?? false) : false,
      remarque: this.secPointForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.secPointToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.secPointToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.secPointService.updateSecPoint(payload)
      : this.secPointService.addSecPoint(payload);

    request$.subscribe({
      next: (response: SecPoint) => {
        const id = this.isEditing ? this.currentSecPointId! : response?.secPointId;
        if (this.selectedFile && id != null) {
          this.secPointService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'SecPoint mis � jour mais erreur upload fichier'
                : 'SecPoint ajout� mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement SecPoint', err);
        window.alert(this.isEditing ? '�chec de la mise � jour' : '�chec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'SecPoint et fichier mis � jour' : 'SecPoint mis � jour avec succ�s')
      : (fromUpload ? 'SecPoint et fichier ajout�s' : 'SecPoint ajout� avec succ�s');
    window.alert(msg);
    if (this.secPointAdded.observers.length) {
      this.secPointAdded.emit();
    } else {
      this.router.navigate(['/Affichers']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-secpoint') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.secPointToEdit) {
      this.loadSecPointIntoForm();
    } else {
      this.isEditing = false;
      this.currentSecPointId = null;
      this.secPointForm.reset({
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
      this.router.navigate(['/Affichers']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
