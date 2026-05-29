import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Crowdstrike } from 'app/Model/Crowdstrike';
import { CrowdstrikeService } from 'app/Services/crowdstrike.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-crowdstrike',
  templateUrl: './ajoutercr.component.html',
  styleUrls: ['./ajoutercr.component.scss']
})
export class AjouterCrowdstrikeComponent implements OnInit, OnChanges {
  @Output() crowdstrikeAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() crowdstrikeToEdit: Crowdstrike | null = null;

  clients: Client[] = [];
  crowdstrikeForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentCrowdstrikeId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private crowdstrikeService: CrowdstrikeService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['crowdstrikeToEdit']?.currentValue && this.crowdstrikeForm) {
      this.crowdstrikeToEdit = changes['crowdstrikeToEdit'].currentValue;
      this.loadCrowdstrikeIntoForm();
    }
  }

  initializeForm(): void {
    this.crowdstrikeForm = this.fb.group({
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
    if (this.crowdstrikeToEdit) {
      this.loadCrowdstrikeIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.crowdstrikeForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.crowdstrikeForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadCrowdstrikeIntoForm(): void {
    if (!this.crowdstrikeToEdit) return;

    this.isEditing = true;
    this.currentCrowdstrikeId = this.crowdstrikeToEdit.crowdstrikeid;

    this.crowdstrikeForm.patchValue({
      client: this.crowdstrikeToEdit.client,
      dureeLicence: this.crowdstrikeToEdit.dureeLicence,
      nomDuContact: this.crowdstrikeToEdit.nomDuContact,
      commandePasserPar: this.crowdstrikeToEdit.commandePasserPar,
      sousContrat: this.crowdstrikeToEdit.sousContrat,
      adresseEmailContact: this.crowdstrikeToEdit.adresseEmailContact,
      mailAdmin: this.crowdstrikeToEdit.mailAdmin,
      numero: this.crowdstrikeToEdit.numero,
      remarques: this.crowdstrikeToEdit.remarques
    }, { emitEvent: false });

    this.licences.clear();
    if (this.crowdstrikeToEdit.licences?.length) {
      this.crowdstrikeToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.crowdstrikeToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.crowdstrikeForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.crowdstrikeForm.get('licences') as FormArray;
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

  addCrowdstrike(): void {
    if (!this.crowdstrikeForm.valid) {
      this.crowdstrikeForm.markAllAsTouched();
      return;
    }

    const payload: Crowdstrike = {
      crowdstrikeid: this.isEditing ? this.currentCrowdstrikeId! : null!,
      client: this.crowdstrikeForm.value.client,
      dureeLicence: this.crowdstrikeForm.value.dureeLicence,
      nomDuContact: this.crowdstrikeForm.value.nomDuContact,
      adresseEmailContact: this.crowdstrikeForm.value.adresseEmailContact,
      mailAdmin: this.crowdstrikeForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.crowdstrikeForm.value.commandePasserPar,
      sousContrat: this.crowdstrikeForm.value.sousContrat,
      numero: this.crowdstrikeForm.value.numero,
      approuve: this.isEditing ? (this.crowdstrikeToEdit?.approuve ?? false) : false,
      remarques: this.crowdstrikeForm.value.remarques || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.crowdstrikeToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.crowdstrikeToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.crowdstrikeService.updateCrowdstrike(payload)
      : this.crowdstrikeService.addCrowdstrike(payload);

    request$.subscribe({
      next: (response: any) => {
        const id = this.isEditing ? this.currentCrowdstrikeId! : response?.crowdstrikeid;
        if (this.selectedFile && id != null) {
          this.crowdstrikeService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'CrowdStrike mis a jour mais erreur upload fichier'
                : 'CrowdStrike ajoute mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement CrowdStrike', err);
        window.alert(this.isEditing ? 'Echec de la mise a jour' : 'Echec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'CrowdStrike et fichier mis a jour' : 'CrowdStrike mis a jour avec succes')
      : (fromUpload ? 'CrowdStrike et fichier ajoutes' : 'CrowdStrike ajoute avec succes');
    window.alert(msg);
    if (this.crowdstrikeAdded.observers.length) {
      this.crowdstrikeAdded.emit();
    } else {
      this.router.navigate(['/AfficherCrowdstrike']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-crowdstrike') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.crowdstrikeToEdit) {
      this.loadCrowdstrikeIntoForm();
    } else {
      this.isEditing = false;
      this.currentCrowdstrikeId = null;
      this.crowdstrikeForm.reset({
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
      this.router.navigate(['/AfficherCrowdstrike']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
