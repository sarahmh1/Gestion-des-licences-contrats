import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Netskope } from 'app/Model/Netskope';
import { NetskopeService } from 'app/Services/neskope.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-netskope',
  templateUrl: './ajouter.component.html',
  styleUrls: ['./ajouter.component.scss']
})
export class AjouternComponent implements OnInit, OnChanges {
  @Output() netskopeAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() netskopeToEdit: Netskope | null = null;

  clients: Client[] = [];
  netskopeForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentNetskopeId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private netskopeService: NetskopeService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['netskopeToEdit']?.currentValue && this.netskopeForm) {
      this.netskopeToEdit = changes['netskopeToEdit'].currentValue;
      this.loadNetskopeIntoForm();
    }
  }

  initializeForm(): void {
    this.netskopeForm = this.fb.group({
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
    if (this.netskopeToEdit) {
      this.loadNetskopeIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.netskopeForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.netskopeForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadNetskopeIntoForm(): void {
    if (!this.netskopeToEdit) return;

    this.isEditing = true;
    this.currentNetskopeId = this.netskopeToEdit.netskopeId;

    this.netskopeForm.patchValue({
      client: this.netskopeToEdit.client,
      dureeDeLicence: this.netskopeToEdit.dureeDeLicence,
      nomDuContact: this.netskopeToEdit.nomDuContact,
      commandePasserPar: this.netskopeToEdit.commandePasserPar,
      sousContrat: this.netskopeToEdit.sousContrat,
      adresseEmailContact: this.netskopeToEdit.adresseEmailContact,
      mailAdmin: this.netskopeToEdit.mailAdmin,
      numero: this.netskopeToEdit.numero,
      remarque: this.netskopeToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.netskopeToEdit.licences?.length) {
      this.netskopeToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.netskopeToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.netskopeForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.netskopeForm.get('licences') as FormArray;
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

  addNetskope(): void {
    if (!this.netskopeForm.valid) {
      this.netskopeForm.markAllAsTouched();
      return;
    }

    const payload: Netskope = {
      netskopeId: this.isEditing ? this.currentNetskopeId! : 0,
      client: this.netskopeForm.value.client,
      dureeDeLicence: this.netskopeForm.value.dureeDeLicence,
      nomDuContact: this.netskopeForm.value.nomDuContact,
      adresseEmailContact: this.netskopeForm.value.adresseEmailContact,
      mailAdmin: this.netskopeForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.netskopeForm.value.commandePasserPar,
      sousContrat: this.netskopeForm.value.sousContrat,
      numero: this.netskopeForm.value.numero,
      approuve: this.isEditing ? (this.netskopeToEdit?.approuve ?? false) : false,
      remarque: this.netskopeForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.netskopeToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.netskopeToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.netskopeService.updateNetskope(payload)
      : this.netskopeService.addNetskope(payload);

    request$.subscribe({
      next: (response: Netskope) => {
        const id = this.isEditing ? this.currentNetskopeId! : response?.netskopeId;
        if (this.selectedFile && id != null) {
          this.netskopeService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Netskope mis à jour mais erreur upload fichier'
                : 'Netskope ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Netskope', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Netskope et fichier mis à jour' : 'Netskope mis à jour avec succès')
      : (fromUpload ? 'Netskope et fichier ajoutés' : 'Netskope ajouté avec succès');
    window.alert(msg);
    if (this.netskopeAdded.observers.length) {
      this.netskopeAdded.emit();
    } else {
      this.router.navigate(['/Affichern']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-netskope') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.netskopeToEdit) {
      this.loadNetskopeIntoForm();
    } else {
      this.isEditing = false;
      this.currentNetskopeId = null;
      this.netskopeForm.reset({
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
      this.router.navigate(['/Affichern']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
