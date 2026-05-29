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
import { MicrosoftO365 } from 'app/Model/MicrosoftO365';
import { MicrosoftO365Service } from 'app/Services/microsoft-o365.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouterm',
  templateUrl: './ajouterm.component.html',
  styleUrls: ['./ajouterm.component.scss']
})
export class AjoutermComponent implements OnInit, OnChanges {
  @Output() microsoftAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() microsoftToEdit: MicrosoftO365 | null = null;

  clients: Client[] = [];
  microsoftForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentMicrosoftId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private microsoftService: MicrosoftO365Service,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => (this.clients = data));
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['microsoftToEdit']?.currentValue && this.microsoftForm) {
      this.microsoftToEdit = changes['microsoftToEdit'].currentValue;
      this.loadMicrosoftIntoForm();
    }
  }

  initializeForm(): void {
    this.microsoftForm = this.fb.group({
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
    if (this.microsoftToEdit) {
      this.loadMicrosoftIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.microsoftForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.microsoftForm.patchValue(
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

  loadMicrosoftIntoForm(): void {
    if (!this.microsoftToEdit) return;

    this.isEditing = true;
    this.currentMicrosoftId = this.microsoftToEdit.microsoftO365Id;

    this.microsoftForm.patchValue(
      {
        client: this.microsoftToEdit.client,
        dureeDeLicence: this.microsoftToEdit.dureeDeLicence,
        nomDuContact: this.microsoftToEdit.nomDuContact,
        commandePasserPar: this.microsoftToEdit.commandePasserPar,
        sousContrat: this.microsoftToEdit.sousContrat,
        adresseEmailContact: this.microsoftToEdit.adresseEmailContact,
        mailAdmin: this.microsoftToEdit.mailAdmin,
        numero: this.microsoftToEdit.numero,
        remarque: this.microsoftToEdit.remarque
      },
      { emitEvent: false }
    );

    this.licences.clear();
    if (this.microsoftToEdit.licences?.length) {
      this.microsoftToEdit.licences.forEach(lic => {
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

    this.setCcMail(this.microsoftToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.microsoftForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.microsoftForm.get('licences') as FormArray;
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
    this.selectedFile = input.files?.[0] ?? null;
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

  saveMicrosoft(): void {
    if (!this.microsoftForm.valid) {
      this.microsoftForm.markAllAsTouched();
      return;
    }

    const payload: MicrosoftO365 = {
      microsoftO365Id: this.isEditing ? this.currentMicrosoftId! : 0,
      client: this.microsoftForm.value.client,
      dureeDeLicence: this.microsoftForm.value.dureeDeLicence,
      nomDuContact: this.microsoftForm.value.nomDuContact,
      adresseEmailContact: this.microsoftForm.value.adresseEmailContact,
      mailAdmin: this.microsoftForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.microsoftForm.value.commandePasserPar,
      sousContrat: this.microsoftForm.value.sousContrat,
      numero: this.microsoftForm.value.numero,
      approuve: this.isEditing ? (this.microsoftToEdit?.approuve ?? false) : false,
      remarque: this.microsoftForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.microsoftToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.microsoftToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.microsoftService.updateMicrosoftO365(payload)
      : this.microsoftService.addMicrosoftO365(payload);

    request$.subscribe({
      next: (response: any) => {
        const id = this.isEditing
          ? this.currentMicrosoftId!
          : response?.microsoftO365Id ?? response?.id;
        if (this.selectedFile && id != null) {
          this.microsoftService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(
                this.isEditing
                  ? 'Licence mise � jour mais erreur upload fichier'
                  : 'Licence ajout�e mais erreur upload fichier'
              );
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Microsoft O365', err);
        window.alert(this.isEditing ? '�chec de la mise � jour' : "�chec de l'ajout");
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? fromUpload
        ? 'Licence et fichier mis � jour'
        : 'Licence mise � jour avec succ�s'
      : fromUpload
      ? 'Licence et fichier ajout�s'
      : 'Licence ajout�e avec succ�s';
    window.alert(msg);
    if (this.microsoftAdded.observers.length) {
      this.microsoftAdded.emit();
    } else {
      this.router.navigate(['/Affichermicro']);
    }
  }

  getFileDownloadUrl(): string {
    if (!this.currentMicrosoftId) return '#';
    return this.microsoftService.getFileDownloadUrl(this.currentMicrosoftId);
  }

  deleteExistingFile(): void {
    if (!this.currentMicrosoftId || !confirm('Supprimer le fichier actuel ?')) return;
    this.microsoftService.deleteFile(this.currentMicrosoftId).subscribe({
      next: res => {
        if (this.microsoftToEdit) {
          this.microsoftToEdit.fichier = undefined;
          this.microsoftToEdit.fichierOriginalName = undefined;
        }
        window.alert('Fichier supprim�');
      },
      error: err => console.error('Erreur suppression fichier', err)
    });
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-microsoft') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.microsoftToEdit) {
      this.loadMicrosoftIntoForm();
    } else {
      this.isEditing = false;
      this.currentMicrosoftId = null;
      this.microsoftForm.reset({
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
      this.router.navigate(['/Affichermicro']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
