import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { SentineIOne } from 'app/Model/SentineIOne';
import { SentineIOneService } from 'app/Services/sentineIOne.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-sentineione',
  templateUrl: './ajouters.component.html',
  styleUrls: ['./ajouters.component.scss']
})
export class AjouterssComponent implements OnInit, OnChanges {
  @Output() sentineIOneAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() sentineIOneToEdit: SentineIOne | null = null;

  clients: Client[] = [];
  sentineIOneForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentSentineIOneId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

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
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sentineIOneToEdit']?.currentValue && this.sentineIOneForm) {
      this.sentineIOneToEdit = changes['sentineIOneToEdit'].currentValue;
      this.loadSentineIOneIntoForm();
    }
  }

  initializeForm(): void {
    this.sentineIOneForm = this.fb.group({
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
    if (this.sentineIOneToEdit) {
      this.loadSentineIOneIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.sentineIOneForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.sentineIOneForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadSentineIOneIntoForm(): void {
    if (!this.sentineIOneToEdit) return;

    this.isEditing = true;
    this.currentSentineIOneId = this.sentineIOneToEdit.sentineIOneId;

    this.sentineIOneForm.patchValue({
      client: this.sentineIOneToEdit.client,
      dureeDeLicence: this.sentineIOneToEdit.dureeDeLicence,
      nomDuContact: this.sentineIOneToEdit.nomDuContact,
      commandePasserPar: this.sentineIOneToEdit.commandePasserPar,
      sousContrat: this.sentineIOneToEdit.sousContrat,
      adresseEmailContact: this.sentineIOneToEdit.adresseEmailContact,
      mailAdmin: this.sentineIOneToEdit.mailAdmin,
      numero: this.sentineIOneToEdit.numero,
      remarque: this.sentineIOneToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.sentineIOneToEdit.licences?.length) {
      this.sentineIOneToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.sentineIOneToEdit.ccMail);
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

  addSentineIOne(): void {
    if (!this.sentineIOneForm.valid) {
      this.sentineIOneForm.markAllAsTouched();
      return;
    }

    const payload: SentineIOne = {
      sentineIOneId: this.isEditing ? this.currentSentineIOneId! : 0,
      client: this.sentineIOneForm.value.client,
      dureeDeLicence: this.sentineIOneForm.value.dureeDeLicence,
      nomDuContact: this.sentineIOneForm.value.nomDuContact,
      adresseEmailContact: this.sentineIOneForm.value.adresseEmailContact,
      mailAdmin: this.sentineIOneForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.sentineIOneForm.value.commandePasserPar,
      sousContrat: this.sentineIOneForm.value.sousContrat,
      numero: this.sentineIOneForm.value.numero,
      approuve: this.isEditing ? (this.sentineIOneToEdit?.approuve ?? false) : false,
      remarque: this.sentineIOneForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.sentineIOneToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.sentineIOneToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.sentineIOneService.updateSentineIOne(payload)
      : this.sentineIOneService.addSentineIOne(payload);

    request$.subscribe({
      next: (response: SentineIOne) => {
        const id = this.isEditing ? this.currentSentineIOneId! : response?.sentineIOneId;
        if (this.selectedFile && id != null) {
          this.sentineIOneService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'SentinelOne mis à jour mais erreur upload fichier'
                : 'SentinelOne ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement SentinelOne', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Licence et fichier mis à jour' : 'Licence mise à jour avec succès')
      : (fromUpload ? 'Licence et fichier ajoutés' : 'Licence ajoutée avec succès');
    window.alert(msg);
    if (this.sentineIOneAdded.observers.length) {
      this.sentineIOneAdded.emit();
    } else {
      this.router.navigate(['/Afficherss']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-sentineione') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.sentineIOneToEdit) {
      this.loadSentineIOneIntoForm();
    } else {
      this.isEditing = false;
      this.currentSentineIOneId = null;
      this.sentineIOneForm.reset({
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
      this.router.navigate(['/Afficherss']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
