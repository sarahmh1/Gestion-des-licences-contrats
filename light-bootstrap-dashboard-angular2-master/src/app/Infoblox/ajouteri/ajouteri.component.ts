import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Infoblox } from 'app/Model/Infoblox';
import { InfobloxService } from 'app/Services/infoblox.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-infoblox',
  templateUrl: './ajouteri.component.html',
  styleUrls: ['./ajouteri.component.scss']
})
export class AjouteriComponent implements OnInit, OnChanges {
  @Output() infobloxAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() infobloxToEdit: Infoblox | null = null;

  clients: Client[] = [];
  infobloxForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentInfobloxId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private infobloxService: InfobloxService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['infobloxToEdit']?.currentValue && this.infobloxForm) {
      this.infobloxToEdit = changes['infobloxToEdit'].currentValue;
      this.loadInfobloxIntoForm();
    }
  }

  initializeForm(): void {
    this.infobloxForm = this.fb.group({
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
    if (this.infobloxToEdit) {
      this.loadInfobloxIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.infobloxForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.infobloxForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadInfobloxIntoForm(): void {
    if (!this.infobloxToEdit) return;

    this.isEditing = true;
    this.currentInfobloxId = this.infobloxToEdit.infobloxId;

    this.infobloxForm.patchValue({
      client: this.infobloxToEdit.client,
      dureeDeLicence: this.infobloxToEdit.dureeDeLicence,
      nomDuContact: this.infobloxToEdit.nomDuContact,
      commandePasserPar: this.infobloxToEdit.commandePasserPar,
      sousContrat: this.infobloxToEdit.sousContrat,
      adresseEmailContact: this.infobloxToEdit.adresseEmailContact,
      mailAdmin: this.infobloxToEdit.mailAdmin,
      numero: this.infobloxToEdit.numero,
      remarque: this.infobloxToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.infobloxToEdit.licences?.length) {
      this.infobloxToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.infobloxToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.infobloxForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.infobloxForm.get('licences') as FormArray;
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

  addInfoblox(): void {
    if (!this.infobloxForm.valid) {
      this.infobloxForm.markAllAsTouched();
      return;
    }

    const payload: Infoblox = {
      infobloxId: this.isEditing ? this.currentInfobloxId! : 0,
      client: this.infobloxForm.value.client,
      dureeDeLicence: this.infobloxForm.value.dureeDeLicence,
      nomDuContact: this.infobloxForm.value.nomDuContact,
      adresseEmailContact: this.infobloxForm.value.adresseEmailContact,
      mailAdmin: this.infobloxForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.infobloxForm.value.commandePasserPar,
      sousContrat: this.infobloxForm.value.sousContrat,
      numero: this.infobloxForm.value.numero,
      approuve: this.isEditing ? (this.infobloxToEdit?.approuve ?? false) : false,
      remarque: this.infobloxForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.infobloxToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.infobloxToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.infobloxService.updateInfoblox(payload)
      : this.infobloxService.addInfoblox(payload);

    request$.subscribe({
      next: (response: Infoblox) => {
        const id = this.isEditing ? this.currentInfobloxId! : response?.infobloxId;
        if (this.selectedFile && id != null) {
          this.infobloxService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Infoblox mis à jour mais erreur upload fichier'
                : 'Infoblox ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Infoblox', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Licence et fichier mis à jour' : 'Licence mise à jour avec succès')
      : (fromUpload ? 'Licence et fichier ajoutés' : 'Licence ajoutée avec succès');
    window.alert(msg);
    if (this.infobloxAdded.observers.length) {
      this.infobloxAdded.emit();
    } else {
      this.router.navigate(['/Afficheri']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-infoblox') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.infobloxToEdit) {
      this.loadInfobloxIntoForm();
    } else {
      this.isEditing = false;
      this.currentInfobloxId = null;
      this.infobloxForm.reset({
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
      this.router.navigate(['/Afficheri']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
