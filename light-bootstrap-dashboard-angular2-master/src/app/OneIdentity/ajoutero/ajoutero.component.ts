import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { OneIdentity } from 'app/Model/OneIdentity';
import { OneIdentityService } from 'app/Services/oneIdentity.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-oneidentity',
  templateUrl: './ajoutero.component.html',
  styleUrls: ['./ajoutero.component.scss']
})
export class AjouteroComponent implements OnInit, OnChanges {
  @Output() oneIdentityAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() oneIdentityToEdit: OneIdentity | null = null;

  clients: Client[] = [];
  oneIdentityForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentOneIdentityId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private oneIdentityService: OneIdentityService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['oneIdentityToEdit']?.currentValue && this.oneIdentityForm) {
      this.oneIdentityToEdit = changes['oneIdentityToEdit'].currentValue;
      this.loadOneIdentityIntoForm();
    }
  }

  initializeForm(): void {
    this.oneIdentityForm = this.fb.group({
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
    if (this.oneIdentityToEdit) {
      this.loadOneIdentityIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.oneIdentityForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.oneIdentityForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadOneIdentityIntoForm(): void {
    if (!this.oneIdentityToEdit) return;

    this.isEditing = true;
    this.currentOneIdentityId = this.oneIdentityToEdit.oneIdentityId;

    this.oneIdentityForm.patchValue({
      client: this.oneIdentityToEdit.client,
      dureeDeLicence: this.oneIdentityToEdit.dureeDeLicence,
      nomDuContact: this.oneIdentityToEdit.nomDuContact,
      commandePasserPar: this.oneIdentityToEdit.commandePasserPar,
      sousContrat: this.oneIdentityToEdit.sousContrat,
      adresseEmailContact: this.oneIdentityToEdit.adresseEmailContact,
      mailAdmin: this.oneIdentityToEdit.mailAdmin,
      numero: this.oneIdentityToEdit.numero,
      remarque: this.oneIdentityToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.oneIdentityToEdit.licences?.length) {
      this.oneIdentityToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.oneIdentityToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.oneIdentityForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.oneIdentityForm.get('licences') as FormArray;
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

  addOneIdentity(): void {
    if (!this.oneIdentityForm.valid) {
      this.oneIdentityForm.markAllAsTouched();
      return;
    }

    const payload: OneIdentity = {
      oneIdentityId: this.isEditing ? this.currentOneIdentityId! : 0,
      client: this.oneIdentityForm.value.client,
      dureeDeLicence: this.oneIdentityForm.value.dureeDeLicence,
      nomDuContact: this.oneIdentityForm.value.nomDuContact,
      adresseEmailContact: this.oneIdentityForm.value.adresseEmailContact,
      mailAdmin: this.oneIdentityForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.oneIdentityForm.value.commandePasserPar,
      sousContrat: this.oneIdentityForm.value.sousContrat,
      numero: this.oneIdentityForm.value.numero,
      approuve: this.isEditing ? (this.oneIdentityToEdit?.approuve ?? false) : false,
      remarque: this.oneIdentityForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.oneIdentityToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.oneIdentityToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.oneIdentityService.updateOneIdentity(payload)
      : this.oneIdentityService.addOneIdentity(payload);

    request$.subscribe({
      next: (response: OneIdentity) => {
        const id = this.isEditing ? this.currentOneIdentityId! : response?.oneIdentityId;
        if (this.selectedFile && id != null) {
          this.oneIdentityService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'OneIdentity mis à jour mais erreur upload fichier'
                : 'OneIdentity ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement OneIdentity', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'OneIdentity et fichier mis à jour' : 'OneIdentity mis à jour avec succès')
      : (fromUpload ? 'OneIdentity et fichier ajoutés' : 'OneIdentity ajouté avec succès');
    window.alert(msg);
    if (this.oneIdentityAdded.observers.length) {
      this.oneIdentityAdded.emit();
    } else {
      this.router.navigate(['/Affichero']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-oneidentity') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.oneIdentityToEdit) {
      this.loadOneIdentityIntoForm();
    } else {
      this.isEditing = false;
      this.currentOneIdentityId = null;
      this.oneIdentityForm.reset({
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
      this.router.navigate(['/Affichero']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
