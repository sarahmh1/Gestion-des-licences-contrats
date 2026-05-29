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
import { Cisco } from 'app/Model/Cisco';
import { CiscoService } from 'app/Services/cisco.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouterc',
  templateUrl: './ajouterc.component.html',
  styleUrls: ['./ajouterc.component.scss']
})
export class AjoutercComponent implements OnInit, OnChanges {
  @Output() ciscoAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() ciscoToEdit: Cisco | null = null;

  clients: Client[] = [];
  ciscoForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentCiscoId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ciscoService: CiscoService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => (this.clients = data));
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ciscoToEdit']?.currentValue && this.ciscoForm) {
      this.ciscoToEdit = changes['ciscoToEdit'].currentValue;
      this.loadCiscoIntoForm();
    }
  }

  initializeForm(): void {
    this.ciscoForm = this.fb.group({
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
    if (this.ciscoToEdit) {
      this.loadCiscoIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.ciscoForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.ciscoForm.patchValue(
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

  loadCiscoIntoForm(): void {
    if (!this.ciscoToEdit) return;

    this.isEditing = true;
    this.currentCiscoId = this.ciscoToEdit.ciscoId;

    this.ciscoForm.patchValue(
      {
        client: this.ciscoToEdit.client,
        dureeDeLicence: this.ciscoToEdit.dureeDeLicence,
        nomDuContact: this.ciscoToEdit.nomDuContact,
        commandePasserPar: this.ciscoToEdit.commandePasserPar,
        sousContrat: this.ciscoToEdit.sousContrat,
        adresseEmailContact: this.ciscoToEdit.adresseEmailContact,
        mailAdmin: this.ciscoToEdit.mailAdmin,
        numero: this.ciscoToEdit.numero,
        remarque: this.ciscoToEdit.remarque
      },
      { emitEvent: false }
    );

    this.licences.clear();
    if (this.ciscoToEdit.licences?.length) {
      this.ciscoToEdit.licences.forEach(lic => {
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

    this.setCcMail(this.ciscoToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.ciscoForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.ciscoForm.get('licences') as FormArray;
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

  saveCisco(): void {
    if (!this.ciscoForm.valid) {
      this.ciscoForm.markAllAsTouched();
      return;
    }

    const payload: Cisco = {
      ciscoId: this.isEditing ? this.currentCiscoId! : 0,
      client: this.ciscoForm.value.client,
      dureeDeLicence: this.ciscoForm.value.dureeDeLicence,
      nomDuContact: this.ciscoForm.value.nomDuContact,
      adresseEmailContact: this.ciscoForm.value.adresseEmailContact,
      mailAdmin: this.ciscoForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.ciscoForm.value.commandePasserPar,
      sousContrat: this.ciscoForm.value.sousContrat,
      numero: this.ciscoForm.value.numero,
      approuve: this.isEditing ? (this.ciscoToEdit?.approuve ?? false) : false,
      remarque: this.ciscoForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.ciscoToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.ciscoToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.ciscoService.updateCisco(payload)
      : this.ciscoService.addCisco(payload);

    request$.subscribe({
      next: (response: any) => {
        const id = this.isEditing ? this.currentCiscoId! : response?.ciscoId ?? response?.id;
        if (this.selectedFile && id != null) {
          this.ciscoService.uploadFile(id, this.selectedFile).subscribe({
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
        console.error('Erreur enregistrement Cisco', err);
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
    if (this.ciscoAdded.observers.length) {
      this.ciscoAdded.emit();
    } else {
      this.router.navigate(['/Afficherc']);
    }
  }

  getFileDownloadUrl(): string {
    if (!this.currentCiscoId) return '#';
    return this.ciscoService.getFileDownloadUrl(this.currentCiscoId);
  }

  deleteExistingFile(): void {
    if (!this.currentCiscoId || !confirm('Supprimer le fichier actuel ?')) return;
    this.ciscoService.deleteFile(this.currentCiscoId).subscribe({
      next: () => {
        if (this.ciscoToEdit) {
          this.ciscoToEdit.fichier = undefined;
          this.ciscoToEdit.fichierOriginalName = undefined;
        }
        window.alert('Fichier supprim�');
      },
      error: err => console.error('Erreur suppression fichier', err)
    });
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-cisco') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.ciscoToEdit) {
      this.loadCiscoIntoForm();
    } else {
      this.isEditing = false;
      this.currentCiscoId = null;
      this.ciscoForm.reset({
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
      this.router.navigate(['/Afficherc']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
