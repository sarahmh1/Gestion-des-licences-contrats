import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { NetskopeService } from 'app/Services/neskope.service';
import { Netskope } from 'app/Model/Netskope';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { PermissionService } from 'app/Services/permission.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-netskope',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateNetskopeComponent implements OnInit {
  clients: Client[] = [];
  updateForm!: FormGroup;
  netskopeId!: number;
  netskope: Netskope | null = null;
  selectedFile: File | null = null;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private netskopeService: NetskopeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private clientService: ClientService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);

    this.updateForm = this.fb.group({
      client: ['', Validators.required],
      dureeDeLicence: [''],
      nomDuContact: [''],
      commandePasserPar: ['', Validators.required],
      adresseEmailContact: ['', Validators.email],
      mailAdmin: ['', Validators.email],
      ccMail: this.fb.array([this.fb.control('', Validators.email)]),
      numero: ['', AppValidators.optionalPhone],
      remarque: [''],
      sousContrat: [false],
      licences: this.fb.array([])
    });

    this.netskopeId = Number(this.route.snapshot.paramMap.get('id'));
    this.watchClientAutoFill();
    this.loadNetskope(this.netskopeId);
  }

  private watchClientAutoFill(): void {
    this.updateForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.updateForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  private getCommandePasserParValue(value: unknown): CommandePasserPar {
    if (value === null || value === undefined) return CommandePasserPar.GI_TN;
    const stringValue = String(value).toUpperCase().trim();
    switch (stringValue) {
      case 'GI_TN':
        return CommandePasserPar.GI_TN;
      case 'GI_FR':
        return CommandePasserPar.GI_FR;
      case 'GI_CI':
        return CommandePasserPar.GI_CI;
      default:
        return CommandePasserPar.GI_TN;
    }
  }

  get ccMail(): FormArray {
    return this.updateForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.updateForm.get('licences') as FormArray;
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
    if (this.ccMail.length <= 1) return;
    this.ccMail.removeAt(index);
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  }

  loadNetskope(id: number): void {
    this.netskopeService.getNetskopeById(id).subscribe({
      next: (data: Netskope) => {
        this.netskope = data;
        this.updateForm.patchValue({
          client: data.client ?? '',
          dureeDeLicence: data.dureeDeLicence ?? '',
          nomDuContact: data.nomDuContact ?? '',
          commandePasserPar: this.getCommandePasserParValue(data.commandePasserPar),
          adresseEmailContact: data.adresseEmailContact ?? '',
          mailAdmin: data.mailAdmin ?? '',
          numero: data.numero ?? '',
          remarque: data.remarque ?? '',
          sousContrat: data.sousContrat ?? false
        }, { emitEvent: false });

        this.licences.clear();
        if (data.licences?.length) {
          data.licences.forEach(lic => {
            this.licences.push(this.fb.group({
              nomDesLicences: [lic.nomDesLicences, Validators.required],
              quantite: [lic.quantite, AppValidators.requiredQuantity],
              dateEx: [this.formatDate(lic.dateEx), Validators.required]
            }));
          });
        } else {
          this.addLicence();
        }

        this.ccMail.clear();
        if (data.ccMail?.length) {
          data.ccMail.forEach(email => this.ccMail.push(this.fb.control(email, Validators.email)));
        } else {
          this.ccMail.push(this.fb.control('', Validators.email));
        }
        this.cdr.detectChanges();
      },
      error: err => console.error('Erreur récupération Netskope:', err)
    });
  }

  onSubmit(): void {
    if (!this.updateForm.valid || !this.netskope) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const updated: Netskope = {
      netskopeId: this.netskopeId,
      client: this.updateForm.value.client,
      dureeDeLicence: this.updateForm.value.dureeDeLicence,
      nomDuContact: this.updateForm.value.nomDuContact,
      adresseEmailContact: this.updateForm.value.adresseEmailContact,
      mailAdmin: this.updateForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.updateForm.value.commandePasserPar,
      sousContrat: this.updateForm.value.sousContrat,
      numero: this.updateForm.value.numero,
      approuve: this.netskope.approuve ?? false,
      remarque: this.updateForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.netskope.fichier,
      fichierOriginalName: this.netskope.fichierOriginalName
    };

    this.netskopeService.updateNetskope(updated).subscribe({
      next: () => {
        if (this.selectedFile) {
          this.netskopeService.uploadFile(this.netskopeId, this.selectedFile!).subscribe({
            next: () => {
              alert('Netskope et fichier mis à jour');
              this.router.navigate(['/Affichern']);
            },
            error: () => {
              alert('Netskope mis à jour mais erreur upload fichier');
              this.router.navigate(['/Affichern']);
            }
          });
        } else {
          alert('Netskope mis à jour avec succès');
          this.router.navigate(['/Affichern']);
        }
      },
      error: err => {
        console.error('Erreur mise à jour Netskope:', err);
        alert('Échec de la mise à jour');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/Affichern']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = file ?? null;
  }

  getFileDownloadUrl(): string {
    return this.netskopeService.getFileDownloadUrl(this.netskopeId);
  }

  deleteFile(): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;
    this.netskopeService.deleteFile(this.netskopeId).subscribe({
      next: res => {
        this.netskope = res ?? this.netskope;
        if (this.netskope) {
          this.netskope.fichier = undefined;
          this.netskope.fichierOriginalName = undefined;
        }
        alert('Fichier supprimé');
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        alert('Erreur lors de la suppression du fichier');
      }
    });
  }
}
