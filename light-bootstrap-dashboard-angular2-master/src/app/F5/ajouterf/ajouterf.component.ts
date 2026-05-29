import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { F5 } from 'app/Model/F5';
import { F5Service } from 'app/Services/f5.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-f5',
  templateUrl: './ajouterf.component.html',
  styleUrls: ['./ajouterf.component.scss']
})
export class AjouterfComponent implements OnInit, OnChanges {
  @Output() f5Added = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() f5ToEdit: F5 | null = null;

  clients: Client[] = [];
  f5Form!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentF5Id: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private f5Service: F5Service,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['f5ToEdit']?.currentValue && this.f5Form) {
      this.f5ToEdit = changes['f5ToEdit'].currentValue;
      this.loadF5IntoForm();
    }
  }

  initializeForm(): void {
    this.f5Form = this.fb.group({
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
    if (this.f5ToEdit) {
      this.loadF5IntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.f5Form.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.f5Form.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadF5IntoForm(): void {
    if (!this.f5ToEdit) return;

    this.isEditing = true;
    this.currentF5Id = this.f5ToEdit.f5Id;

    this.f5Form.patchValue({
      client: this.f5ToEdit.client,
      dureeDeLicence: this.f5ToEdit.dureeDeLicence,
      nomDuContact: this.f5ToEdit.nomDuContact,
      commandePasserPar: this.f5ToEdit.commandePasserPar,
      sousContrat: this.f5ToEdit.sousContrat,
      adresseEmailContact: this.f5ToEdit.adresseEmailContact,
      mailAdmin: this.f5ToEdit.mailAdmin,
      numero: this.f5ToEdit.numero,
      remarque: this.f5ToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.f5ToEdit.licences?.length) {
      this.f5ToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.f5ToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.f5Form.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.f5Form.get('licences') as FormArray;
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

  addF5(): void {
    if (!this.f5Form.valid) {
      this.f5Form.markAllAsTouched();
      return;
    }

    const payload: F5 = {
      f5Id: this.isEditing ? this.currentF5Id! : 0,
      client: this.f5Form.value.client,
      dureeDeLicence: this.f5Form.value.dureeDeLicence,
      nomDuContact: this.f5Form.value.nomDuContact,
      adresseEmailContact: this.f5Form.value.adresseEmailContact,
      mailAdmin: this.f5Form.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.f5Form.value.commandePasserPar,
      sousContrat: this.f5Form.value.sousContrat,
      numero: this.f5Form.value.numero,
      approuve: this.isEditing ? (this.f5ToEdit?.approuve ?? false) : false,
      remarque: this.f5Form.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.f5ToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.f5ToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.f5Service.updateF5(payload)
      : this.f5Service.addF5(payload);

    request$.subscribe({
      next: (response: F5) => {
        const id = this.isEditing ? this.currentF5Id! : response?.f5Id;
        if (this.selectedFile && id != null) {
          this.f5Service.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'F5 mis à jour mais erreur upload fichier'
                : 'F5 ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement F5', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'F5 et fichier mis à jour' : 'F5 mis à jour avec succès')
      : (fromUpload ? 'F5 et fichier ajoutés' : 'F5 ajouté avec succès');
    window.alert(msg);
    if (this.f5Added.observers.length) {
      this.f5Added.emit();
    } else {
      this.router.navigate(['/Afficherf']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-f5') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.f5ToEdit) {
      this.loadF5IntoForm();
    } else {
      this.isEditing = false;
      this.currentF5Id = null;
      this.f5Form.reset({
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
      this.router.navigate(['/Afficherf']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
