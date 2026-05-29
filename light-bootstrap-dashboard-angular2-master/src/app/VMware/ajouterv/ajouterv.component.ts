import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { VMware } from 'app/Model/VMware';
import { VMwareService } from 'app/Services/vmware.service';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-vmware',
  templateUrl: './ajouterv.component.html',
  styleUrls: ['./ajouterv.component.scss']
})
export class AjoutervComponent implements OnInit, OnChanges {
  @Output() vmwareAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() vmwareToEdit: VMware | null = null;

  clients: Client[] = [];
  vmwareForm!: FormGroup;
  selectedFile: File | null = null;
  isEditing = false;
  currentVmwareId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private vmwareService: VMwareService,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vmwareToEdit']?.currentValue && this.vmwareForm) {
      this.vmwareToEdit = changes['vmwareToEdit'].currentValue;
      this.loadVmwareIntoForm();
    }
  }

  initializeForm(): void {
    this.vmwareForm = this.fb.group({
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
    if (this.vmwareToEdit) {
      this.loadVmwareIntoForm();
    }
  }

  private watchClientAutoFill(): void {
    this.vmwareForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.vmwareForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  loadVmwareIntoForm(): void {
    if (!this.vmwareToEdit) return;

    this.isEditing = true;
    this.currentVmwareId = this.vmwareToEdit.vmwareId;

    this.vmwareForm.patchValue({
      client: this.vmwareToEdit.client,
      dureeDeLicence: this.vmwareToEdit.dureeDeLicence,
      nomDuContact: this.vmwareToEdit.nomDuContact,
      commandePasserPar: this.vmwareToEdit.commandePasserPar,
      sousContrat: this.vmwareToEdit.sousContrat,
      adresseEmailContact: this.vmwareToEdit.adresseEmailContact,
      mailAdmin: this.vmwareToEdit.mailAdmin,
      numero: this.vmwareToEdit.numero,
      remarque: this.vmwareToEdit.remarque
    }, { emitEvent: false });

    this.licences.clear();
    if (this.vmwareToEdit.licences?.length) {
      this.vmwareToEdit.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences, Validators.required],
          quantite: [lic.quantite, AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx), Validators.required]
        }));
      });
    } else {
      this.licences.push(this.createLicenceGroup());
    }

    this.setCcMail(this.vmwareToEdit.ccMail);
  }

  get ccMail(): FormArray {
    return this.vmwareForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.vmwareForm.get('licences') as FormArray;
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

  addVMware(): void {
    if (!this.vmwareForm.valid) {
      this.vmwareForm.markAllAsTouched();
      return;
    }

    const payload: VMware = {
      vmwareId: this.isEditing ? this.currentVmwareId! : null!,
      client: this.vmwareForm.value.client,
      dureeDeLicence: this.vmwareForm.value.dureeDeLicence,
      nomDuContact: this.vmwareForm.value.nomDuContact,
      adresseEmailContact: this.vmwareForm.value.adresseEmailContact,
      mailAdmin: this.vmwareForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.vmwareForm.value.commandePasserPar,
      sousContrat: this.vmwareForm.value.sousContrat,
      numero: this.vmwareForm.value.numero,
      approuve: this.isEditing ? (this.vmwareToEdit?.approuve ?? false) : false,
      remarque: this.vmwareForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.isEditing ? this.vmwareToEdit?.fichier : undefined,
      fichierOriginalName: this.isEditing ? this.vmwareToEdit?.fichierOriginalName : undefined
    };

    const request$ = this.isEditing
      ? this.vmwareService.updateVMware(payload)
      : this.vmwareService.addVMware(payload);

    request$.subscribe({
      next: (response: VMware) => {
        const id = this.isEditing ? this.currentVmwareId! : response?.vmwareId;
        if (this.selectedFile && id != null) {
          this.vmwareService.uploadFile(id, this.selectedFile).subscribe({
            next: () => this.finishSave(true),
            error: () => {
              window.alert(this.isEditing
                ? 'VMware mis a jour mais erreur upload fichier'
                : 'VMware ajoute mais erreur upload fichier');
              this.finishSave(true);
            }
          });
        } else {
          this.finishSave(false);
        }
      },
      error: err => {
        console.error('Erreur enregistrement VMware', err);
        window.alert(this.isEditing ? 'Echec de la mise a jour' : 'Echec de l\'ajout');
      }
    });
  }

  private finishSave(fromUpload: boolean): void {
    const msg = this.isEditing
      ? (fromUpload ? 'VMware et fichier mis a jour' : 'VMware mis a jour avec succes')
      : (fromUpload ? 'VMware et fichier ajoutes' : 'VMware ajoute avec succes');
    window.alert(msg);
    if (this.vmwareAdded.observers.length) {
      this.vmwareAdded.emit();
    } else {
      this.router.navigate(['/Affichervmware']);
    }
  }

  onReinitialiser(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichier-vmware') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    if (this.isEditing && this.vmwareToEdit) {
      this.loadVmwareIntoForm();
    } else {
      this.isEditing = false;
      this.currentVmwareId = null;
      this.vmwareForm.reset({
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
      this.router.navigate(['/Affichervmware']);
    }
  }

  closeClientDropdown(): void {
    this.clientSelect?.closeDropdown();
  }
}
