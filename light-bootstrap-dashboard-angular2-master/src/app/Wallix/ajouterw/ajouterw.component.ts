import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Wallix } from 'app/Model/Wallix';
import { WallixService } from 'app/Services/wallix.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouterw',
  templateUrl: './ajouterw.component.html',
  styleUrls: ['./ajouterw.component.scss']
})
export class AjouterwComponent implements OnInit, OnChanges {
  @Output() wallixAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() wallixToEdit: Wallix | null = null;

  clients: Client[] = [];
  wallixForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentWallixId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private wallixService: WallixService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['wallixToEdit']?.currentValue && this.wallixForm) {
      this.wallixToEdit = changes['wallixToEdit'].currentValue;
      this.loadWallixIntoForm();
    }
  }

  initializeForm(): void {
    this.wallixForm = this.fb.group({
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
    if (this.wallixToEdit) {
      this.loadWallixIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.wallixForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.wallixForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadWallixIntoForm(): void {
    if (!this.wallixToEdit) return;

    this.isEditing = true;
    this.currentWallixId = this.wallixToEdit.wallixId;

    this.wallixForm.patchValue({
      client: this.wallixToEdit.client,
      dureeDeLicence: this.wallixToEdit.dureeDeLicence,
      nomDuContact: this.wallixToEdit.nomDuContact,
      commandePasserPar: this.wallixToEdit.commandePasserPar,
      sousContrat: this.wallixToEdit.sousContrat,
      adresseEmailContact: this.wallixToEdit.adresseEmailContact,
      mailAdmin: this.wallixToEdit.mailAdmin,
      numero: this.wallixToEdit.numero,
      remarque: this.wallixToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.wallixToEdit.licences?.length) {
      this.wallixToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.wallixToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.wallixForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.wallixForm.get('licences') as FormArray;
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

  addWallix(): void {
    if (!this.wallixForm.valid) {
      this.wallixForm.markAllAsTouched();
      return;
    }

    const payload: Wallix = {
      wallixId: this.isEditing ? this.currentWallixId! : null!,
      client: this.wallixForm.value.client,
      dureeDeLicence: this.wallixForm.value.dureeDeLicence,
      nomDuContact: this.wallixForm.value.nomDuContact,
      adresseEmailContact: this.wallixForm.value.adresseEmailContact,
      mailAdmin: this.wallixForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.wallixForm.value.commandePasserPar,
      sousContrat: this.wallixForm.value.sousContrat,
      numero: this.wallixForm.value.numero,
      approuve: this.isEditing ? (this.wallixToEdit?.approuve ?? false) : false,
      remarque: this.wallixForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.wallixToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.wallixToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.wallixService.updateWallix(payload)
      : this.wallixService.addWallix(payload);

    request$.subscribe({
      next: (response: any) => {
        const id = this.isEditing ? this.currentWallixId! : response?.wallixId;
        if (this.selectedFile && id) {
          this.wallixService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Wallix mis a jour mais erreur upload fichier'
                : 'Wallix ajoute mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Wallix', err);
        window.alert(this.isEditing ? 'Echec de la mise a jour' : 'Echec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Wallix et fichier mis a jour' : 'Wallix mis a jour avec succes')
      : (fromUpload ? 'Wallix et fichier ajoutes' : 'Wallix ajoute avec succes');
    window.alert(msg);
    if (this.wallixAdded.observers.length) {
      this.wallixAdded.emit();
    } else {
      this.router.navigate(['/Afficherwallix']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-wallix') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.wallixToEdit) {
      this.loadWallixIntoForm();
    } else {
      this.isEditing = false;
      this.currentWallixId = null;
      this.wallixForm.reset({
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
      this.router.navigate(['/Afficherwallix']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
