import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  Input,
  ViewChild
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Varonis } from 'app/Model/Varonis';
import { VaronisService } from 'app/Services/varonis.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-varonis',
  templateUrl: './ajoutervr.component.html',
  styleUrls: ['./ajoutervr.component.scss']
})
export class AjoutervrComponent implements OnInit, OnChanges {
  @Output() varonisAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() varonisToEdit: Varonis | null = null;

  clients: Client[] = [];
  varonisForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentVaronisId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private varonisService: VaronisService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => (this.clients = data));
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['varonisToEdit']?.currentValue && this.varonisForm) {
      this.varonisToEdit = changes['varonisToEdit'].currentValue;
      this.loadVaronisIntoForm();
    }
  }

  initializeForm(): void {
    this.varonisForm = this.fb.group({
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
    if (this.varonisToEdit) {
      this.loadVaronisIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.varonisForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.varonisForm.patchValue(
          {
            nomDuContact: found.nosVisAVis?.[0] || '',
            numero: found.numTel?.[0] || '',
            adresseEmailContact: found.adressesMail?.[0] || ''
          },
          { emitEvent: false }
        );
      }
    });
  }

  loadVaronisIntoForm(): void {
    if (!this.varonisToEdit) return;

    this.isEditing = true;
    this.currentVaronisId = this.varonisToEdit.varonisId;

    this.varonisForm.patchValue(
      {
        client: this.varonisToEdit.client,
        dureeDeLicence: this.varonisToEdit.dureeDeLicence,
        nomDuContact: this.varonisToEdit.nomDuContact,
        commandePasserPar: this.varonisToEdit.commandePasserPar,
        sousContrat: this.varonisToEdit.sousContrat,
        adresseEmailContact: this.varonisToEdit.adresseEmailContact,
        mailAdmin: this.varonisToEdit.mailAdmin,
        numero: this.varonisToEdit.numero,
        remarque: this.varonisToEdit.remarque
      },
      { emitEvent: false }
    );

    this.licences.clear();
    if (this.varonisToEdit.licences?.length) {
      this.varonisToEdit.licences.forEach(lic => {
        this.licences.push(
          this.fb.group({
            nomDesLicences: [lic.nomDesLicences, Validators.required],
            quantite: [lic.quantite, AppValidators.requiredQuantity],
            dateEx: [this.formatDate(lic.dateEx), Validators.required]
          })
        );
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.varonisToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.varonisForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.varonisForm.get('licences') as FormArray;
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
    this.selectedFile = file ?? null;
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

  saveVaronis(): void {
    if (!this.varonisForm.valid) {
      this.varonisForm.markAllAsTouched();
      return;
    }

    const payload: Varonis = {
      varonisId: this.isEditing ? this.currentVaronisId! : 0,
      client: this.varonisForm.value.client,
      dureeDeLicence: this.varonisForm.value.dureeDeLicence,
      nomDuContact: this.varonisForm.value.nomDuContact,
      adresseEmailContact: this.varonisForm.value.adresseEmailContact,
      mailAdmin: this.varonisForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.varonisForm.value.commandePasserPar,
      sousContrat: this.varonisForm.value.sousContrat,
      numero: this.varonisForm.value.numero,
      approuve: this.isEditing ? (this.varonisToEdit?.approuve ?? false) : false,
      remarque: this.varonisForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.varonisToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.varonisToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.varonisService.updateVaronis(payload)
      : this.varonisService.addVaronis(payload);

    request$.subscribe({
      next: (response: Varonis) => {
        const id = this.isEditing ? this.currentVaronisId! : response?.varonisId;
        if (this.selectedFile && id != null) {
          this.varonisService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(
                this.isEditing
                  ? 'Varonis mis à jour mais erreur upload fichier'
                  : 'Varonis ajouté mais erreur upload fichier'
              );
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Varonis', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : "Échec de l'ajout");
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? fromUpload
        ? 'Licence et fichier mis à jour'
        : 'Licence mise à jour avec succès'
      : fromUpload
      ? 'Licence et fichier ajoutés'
      : 'Licence ajoutée avec succès';
    window.alert(msg);
    if (this.varonisAdded.observers.length) {
      this.varonisAdded.emit();
    } else {
      this.router.navigate(['/Affichervr']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-varonis') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.varonisToEdit) {
      this.loadVaronisIntoForm();
    } else {
      this.isEditing = false;
      this.currentVaronisId = null;
      this.varonisForm.reset({
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
      this.router.navigate(['/Affichervr']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
