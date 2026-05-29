import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { FortraService } from 'app/Services/fortra.service';
import { Fortra } from 'app/Model/Fortra';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { PermissionService } from 'app/Services/permission.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-fortra',
  templateUrl: './updatefortra.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateFortraComponent implements OnInit {
  clients: Client[] = [];
  updateForm!: FormGroup;
  fortraId!: number;
  fortra: Fortra | null = null;
  selectedFile: File | null = null;

  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private fortraService: FortraService,
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

    this.fortraId = Number(this.route.snapshot.paramMap.get('id'));
    this.watchClientAutoFill();
    this.loadFortra(this.fortraId);
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

  loadFortra(id: number): void {
    this.fortraService.getFortraById(id).subscribe({
      next: (data: Fortra) => {
        this.fortra = data;
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
      error: err => console.error('Erreur récupération Fortra:', err)
    });
  }

  onSubmit(): void {
    if (!this.updateForm.valid || !this.fortra) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const updated: Fortra = {
      fortraId: this.fortraId,
      client: this.updateForm.value.client,
      dureeDeLicence: this.updateForm.value.dureeDeLicence,
      nomDuContact: this.updateForm.value.nomDuContact,
      adresseEmailContact: this.updateForm.value.adresseEmailContact,
      mailAdmin: this.updateForm.value.mailAdmin || '',
      ccMail: this.ccMail.value.filter((e: string) => e?.trim()),
      commandePasserPar: this.updateForm.value.commandePasserPar,
      sousContrat: this.updateForm.value.sousContrat,
      numero: this.updateForm.value.numero,
      approuve: this.fortra.approuve ?? false,
      remarque: this.updateForm.value.remarque || '',
      licences: this.licences.value,
      fichier: this.fortra.fichier,
      fichierOriginalName: this.fortra.fichierOriginalName
    };

    this.fortraService.updateFortra(updated).subscribe({
      next: () => {
        if (this.selectedFile) {
          this.fortraService.uploadFile(this.fortraId, this.selectedFile!).subscribe({
            next: () => {
              alert('Fortra et fichier mis à jour');
              this.router.navigate(['/Afficherfortra']);
            },
            error: () => {
              alert('Fortra mis à jour mais erreur upload fichier');
              this.router.navigate(['/Afficherfortra']);
            }
          });
        } else {
          alert('Fortra mis à jour avec succès');
          this.router.navigate(['/Afficherfortra']);
        }
      },
      error: err => {
        console.error('Erreur mise à jour Fortra:', err);
        alert('Échec de la mise à jour');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/Afficherfortra']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = file ?? null;
  }

  getFileDownloadUrl(): string {
    return this.fortraService.getFileDownloadUrl(this.fortraId);
  }

  deleteFile(): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;
    this.fortraService.deleteFile(this.fortraId).subscribe({
      next: res => {
        this.fortra = res ?? this.fortra;
        if (this.fortra) {
          this.fortra.fichier = undefined;
          this.fortra.fichierOriginalName = undefined;
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
