import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Splunk } from 'app/Model/Splunk';
import { SplunkService } from 'app/Services/splunk.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-splunk',
  templateUrl: './ajouter-splunk.component.html',
  styleUrls: ['./ajouter-splunk.component.scss']
})
export class AjouterSplunkComponent implements OnInit, OnChanges {
  @Output() splunkAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() splunkToEdit: Splunk | null = null;

  clients: Client[] = [];
  splunkForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentSplunkId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private splunkService: SplunkService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['splunkToEdit']?.currentValue && this.splunkForm) {
      this.splunkToEdit = changes['splunkToEdit'].currentValue;
      this.loadSplunkIntoForm();
    }
  }

  initializeForm(): void {
    this.splunkForm = this.fb.group({
      client: ['', Validators.required],
      dureeLicence: [''],
      nomDuContact: [''],
      adresseEmailContact: ['', Validators.email],
      sousContrat: [false],
      mailAdmin: ['', Validators.email],
      commandePasserPar: ['', Validators.required],
      ccMail: this.fb.array([this.fb.control('', Validators.email)]),
      numero: ['', AppValidators.optionalPhone],
      remarques: [''],
      licences: this.fb.array([this.createLicenceGroup()])
    });
    this.watchClientAutoFill();
    if (this.splunkToEdit) {
      this.loadSplunkIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.splunkForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.splunkForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadSplunkIntoForm(): void {
    if (!this.splunkToEdit) return;

    this.isEditing = true;
    this.currentSplunkId = this.splunkToEdit.splunkid;

    this.splunkForm.patchValue({
      client: this.splunkToEdit.client,
      dureeLicence: this.splunkToEdit.dureeLicence,
      nomDuContact: this.splunkToEdit.nomDuContact,
      commandePasserPar: this.splunkToEdit.commandePasserPar,
      sousContrat: this.splunkToEdit.sousContrat,
      adresseEmailContact: this.splunkToEdit.adresseEmailContact,
      mailAdmin: this.splunkToEdit.mailAdmin,
      numero: this.splunkToEdit.numero,
      remarques: this.splunkToEdit.remarques
    }, { emitEvent: false });

    this.licences.clear();
    if (this.splunkToEdit.licences?.length) {
      this.splunkToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.splunkToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.splunkForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.splunkForm.get('licences') as FormArray;
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

  addSplunk(): void {
    if (!this.splunkForm.valid) {
      this.splunkForm.markAllAsTouched();
      return;
    }

    const payload: Splunk = {
      splunkid: this.isEditing ? this.currentSplunkId! : 0,
      client: this.splunkForm.value.client,
      dureeLicence: this.splunkForm.value.dureeLicence,
      nomDuContact: this.splunkForm.value.nomDuContact,
      adresseEmailContact: this.splunkForm.value.adresseEmailContact,
      mailAdmin: this.splunkForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.splunkForm.value.commandePasserPar,
      sousContrat: this.splunkForm.value.sousContrat,
      numero: this.splunkForm.value.numero,
      approuve: this.isEditing ? (this.splunkToEdit?.approuve ?? false) : false,
      remarques: this.splunkForm.value.remarques || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.splunkToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.splunkToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.splunkService.updateSplunk(payload)
      : this.splunkService.addSplunk(payload);

    request$.subscribe({
      next: (response: Splunk) => {
        const id = this.isEditing ? this.currentSplunkId! : response?.splunkid;
        if (this.selectedFile && id != null) {
          this.splunkService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'Splunk mis à jour mais erreur upload fichier'
                : 'Splunk ajouté mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement Splunk', err);
        window.alert(this.isEditing ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'Splunk et fichier mis à jour' : 'Splunk mis à jour avec succès')
      : (fromUpload ? 'Splunk et fichier ajoutés' : 'Splunk ajouté avec succès');
    window.alert(msg);
    if (this.splunkAdded.observers.length) {
      this.splunkAdded.emit();
    } else {
      this.router.navigate(['/Affichersplunk']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-splunk') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.splunkToEdit) {
      this.loadSplunkIntoForm();
    } else {
      this.isEditing = false;
      this.currentSplunkId = null;
      this.splunkForm.reset({
        client: '',
        dureeLicence: '',
        nomDuContact: '',
        adresseEmailContact: '',
        sousContrat: false,
        mailAdmin: '',
        commandePasserPar: '',
        numero: '',
        remarques: ''
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
      this.router.navigate(['/Affichersplunk']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
