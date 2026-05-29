import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Rapid7 } from 'app/Model/Rapid7';
import { Rapid7Service } from 'app/Services/rapid7.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-rapid7',
  templateUrl: './ajouter-rapid7.component.html',
  styleUrls: ['./ajouter-rapid7.component.scss']
})
export class AjouterRapid7Component implements OnInit, OnChanges {
  @Output() rapid7Added = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() rapid7ToEdit: Rapid7 | null = null;

  clients: Client[] = [];
  rapid7Form!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentRapid7Id: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private rapid7Service: Rapid7Service,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rapid7ToEdit']?.currentValue && this.rapid7Form) {
      this.rapid7ToEdit = changes['rapid7ToEdit'].currentValue;
      this.loadRapid7IntoForm();
    }
  }

  initializeForm(): void {
    this.rapid7Form = this.fb.group({
      client: ['', Validators.required],
      cleLicences: [''],
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
    if (this.rapid7ToEdit) {
      this.loadRapid7IntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.rapid7Form.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.rapid7Form.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadRapid7IntoForm(): void {
    if (!this.rapid7ToEdit) return;

    this.isEditing = true;
    this.currentRapid7Id = this.rapid7ToEdit.rapid7Id;

    this.rapid7Form.patchValue({
      client: this.rapid7ToEdit.client,
      cleLicences: this.rapid7ToEdit.cleLicences,
      dureeDeLicence: this.rapid7ToEdit.dureeDeLicence,
      nomDuContact: this.rapid7ToEdit.nomDuContact,
      commandePasserPar: this.rapid7ToEdit.commandePasserPar,
      sousContrat: this.rapid7ToEdit.sousContrat,
      adresseEmailContact: this.rapid7ToEdit.adresseEmailContact,
      mailAdmin: this.rapid7ToEdit.mailAdmin,
      numero: this.rapid7ToEdit.numero,
      remarque: this.rapid7ToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.rapid7ToEdit.licences?.length) {
      this.rapid7ToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.rapid7ToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.rapid7Form.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.rapid7Form.get('licences') as FormArray;
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

  addRapid7(): void {
    if (!this.rapid7Form.valid) {
      this.rapid7Form.markAllAsTouched();
      return;
    }

    const payload: Rapid7 = {
      rapid7Id: this.isEditing ? this.currentRapid7Id! : null!,
      client: this.rapid7Form.value.client,
      cleLicences: this.rapid7Form.value.cleLicences || '',
      dureeDeLicence: this.rapid7Form.value.dureeDeLicence,
      nomDuContact: this.rapid7Form.value.nomDuContact,
      adresseEmailContact: this.rapid7Form.value.adresseEmailContact,
      mailAdmin: this.rapid7Form.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.rapid7Form.value.commandePasserPar,
      sousContrat: this.rapid7Form.value.sousContrat,
      numero: this.rapid7Form.value.numero,
      approuve: this.isEditing ? (this.rapid7ToEdit?.approuve ?? false) : false,
      remarque: this.rapid7Form.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.rapid7ToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.rapid7ToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.rapid7Service.updateRapid7(payload)
      : this.rapid7Service.addRapid7(payload);

    request$.subscribe({
      next: (response: any) => {
        const id = this.isEditing ? this.currentRapid7Id! : response?.rapid7Id;
        if (this.selectedFile && id) {
          this.rapid7Service.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Rapid7 mis a jour mais erreur upload fichier'
                : 'Rapid7 ajoute mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Rapid7', err);
        window.alert(this.isEditing ? 'Echec de la mise a jour' : 'Echec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Rapid7 et fichier mis a jour' : 'Rapid7 mis a jour avec succes')
      : (fromUpload ? 'Rapid7 et fichier ajoutes' : 'Rapid7 ajoute avec succes');
    window.alert(msg);
    if (this.rapid7Added.observers.length) {
      this.rapid7Added.emit();
    } else {
      this.router.navigate(['/Afficherrapid7']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-rapid7') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.rapid7ToEdit) {
      this.loadRapid7IntoForm();
    } else {
      this.isEditing = false;
      this.currentRapid7Id = null;
      this.rapid7Form.reset({
        client: '',
        cleLicences: '',
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
      this.router.navigate(['/Afficherrapid7']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
