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
import { Imperva } from 'app/Model/Imperva';
import { ImpervaService } from 'app/Services/imperva.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouterim',
  templateUrl: './ajouterim.component.html',
  styleUrls: ['./ajouterim.component.scss']
})
export class AjouterimComponent implements OnInit, OnChanges {
  @Output() impervaAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() impervaToEdit: Imperva | null = null;

  clients: Client[] = [];
  impervaForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentImpervaId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private impervaService: ImpervaService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => (this.clients = data));
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['impervaToEdit']?.currentValue && this.impervaForm) {
      this.impervaToEdit = changes['impervaToEdit'].currentValue;
      this.loadImpervaIntoForm();
    }
  }

  initializeForm(): void {
    this.impervaForm = this.fb.group({
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
    if (this.impervaToEdit) {
      this.loadImpervaIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.impervaForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.impervaForm.patchValue(
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

  loadImpervaIntoForm(): void {
    if (!this.impervaToEdit) return;

    this.isEditing = true;
    this.currentImpervaId = this.impervaToEdit.impervaId;

    this.impervaForm.patchValue(
      {
        client: this.impervaToEdit.client,
        dureeDeLicence: this.impervaToEdit.dureeDeLicence,
        nomDuContact: this.impervaToEdit.nomDuContact,
        commandePasserPar: this.impervaToEdit.commandePasserPar,
        sousContrat: this.impervaToEdit.sousContrat,
        adresseEmailContact: this.impervaToEdit.adresseEmailContact,
        mailAdmin: this.impervaToEdit.mailAdmin,
        numero: this.impervaToEdit.numero,
        remarque: this.impervaToEdit.remarque
      },
      { emitEvent: false }
    );

    this.licences.clear();
    if (this.impervaToEdit.licences?.length) {
      this.impervaToEdit.licences.forEach(lic => {
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

    this.setCcMail(this.impervaToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.impervaForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.impervaForm.get('licences') as FormArray;
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

  saveImperva(): void {
    if (!this.impervaForm.valid) {
      this.impervaForm.markAllAsTouched();
      return;
    }

    const payload: Imperva = {
      impervaId: this.isEditing ? this.currentImpervaId! : 0,
      client: this.impervaForm.value.client,
      dureeDeLicence: this.impervaForm.value.dureeDeLicence,
      nomDuContact: this.impervaForm.value.nomDuContact,
      adresseEmailContact: this.impervaForm.value.adresseEmailContact,
      mailAdmin: this.impervaForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.impervaForm.value.commandePasserPar,
      sousContrat: this.impervaForm.value.sousContrat,
      numero: this.impervaForm.value.numero,
      approuve: this.isEditing ? (this.impervaToEdit?.approuve ?? false) : false,
      remarque: this.impervaForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.impervaToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.impervaToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.impervaService.updateImperva(payload)
      : this.impervaService.addImperva(payload);

    request$.subscribe({
      next: (response: any) => {
        const id = this.isEditing ? this.currentImpervaId! : response?.impervaId ?? response?.id;
        if (this.selectedFile && id != null) {
          this.impervaService.uploadFile(id, this.selectedFile).subscribe({
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
        console.error('Erreur enregistrement Imperva', err);
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
    if (this.impervaAdded.observers.length) {
      this.impervaAdded.emit();
    } else {
      this.router.navigate(['/Afficherim']);
    }
  }

  getFileDownloadUrl(): string {
    if (!this.currentImpervaId) return '#';
    return this.impervaService.getFileDownloadUrl(this.currentImpervaId);
  }

  deleteExistingFile(): void {
    if (!this.currentImpervaId || !confirm('Supprimer le fichier actuel ?')) return;
    this.impervaService.deleteFile(this.currentImpervaId).subscribe({
      next: () => {
        if (this.impervaToEdit) {
          this.impervaToEdit.fichier = undefined;
          this.impervaToEdit.fichierOriginalName = undefined;
        }
        window.alert('Fichier supprim�');
      },
      error: err => console.error('Erreur suppression fichier', err)
    });
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-imperva') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.impervaToEdit) {
      this.loadImpervaIntoForm();
    } else {
      this.isEditing = false;
      this.currentImpervaId = null;
      this.impervaForm.reset({
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
      this.router.navigate(['/Afficherim']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
