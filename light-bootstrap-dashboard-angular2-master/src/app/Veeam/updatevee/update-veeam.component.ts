import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Veeam } from 'app/Model/Veeam';
import { VeeamService } from 'app/Services/veeam.service';
import { ClientService, Client } from '../../Services/client.service';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-update-veeam',
  templateUrl: './update-veeam.component.html',
  styleUrls: ['./update-veeam.component.scss']
})
export class UpdateVeeamComponent implements OnInit, OnChanges {
  @Input() veeamToEdit: Veeam | null = null;
  @Output() updated = new EventEmitter<Veeam>();
  @Output() cancelled = new EventEmitter<void>();

  clients: Client[] = [];
  updateForm!: FormGroup;
  VeeamId!: number;
  veeam!: Veeam;
  selectedFile: File | null = null;
  public Validators = Validators;
  commandePasserParOptions = [
    { label: 'GI_TN', value: 'GI_TN' },
    { label: 'GI_FR', value: 'GI_FR' },
    { label: 'GI_CI', value: 'GI_CI' }
  ];

  constructor(
    public fb: FormBuilder,
    private veeamService: VeeamService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private clientService: ClientService,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();

    this.loadFromInputOrRoute();
    this.watchClientAutoFill();
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

  ngOnChanges(changes: SimpleChanges): void {
    const id = changes['veeamToEdit']?.currentValue?.veeamId;
    if (id && this.updateForm) {
      this.loadVeeam(id);
    }
  }

  private loadFromInputOrRoute(): void {
    if (this.veeamToEdit?.veeamId) {
      this.loadVeeam(this.veeamToEdit.veeamId);
      return;
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadVeeam(id);
    }
  }

  initializeForm(): void {
    this.updateForm = this.fb.group({
      client: ['', Validators.required],
      dureeDeLicence: ['', Validators.required],
      nomDuContact: [''],
      commandePasserPar: ['GI_TN', Validators.required],
      adresseEmailContact: ['', Validators.email],
      mailAdmin: ['', Validators.email],
      ccMail: this.fb.array([]),
      numero: ['', AppValidators.optionalPhone],
      remarque: [''],
      sousContrat: [false],
      licences: this.fb.array([])
    });
  }

  get ccMail(): FormArray {
    return this.updateForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.updateForm.get('licences') as FormArray;
  }

  private normalizeCommandePasserPar(value: unknown): string {
    if (value == null || value === '') return 'GI_TN';
    const s = String(value).toUpperCase().trim();
    if (s === '0' || s === 'GI_TN') return 'GI_TN';
    if (s === '1' || s === 'GI_CI') return 'GI_CI';
    if (s === '2' || s === 'GI_FR') return 'GI_FR';
    if (s === 'GI_FR' || s === 'GI_CI') return s;
    return 'GI_TN';
  }

  private normalizeCcMails(ccMail: unknown): string[] {
    if (!ccMail) return [];
    if (Array.isArray(ccMail)) {
      return ccMail.map(e => String(e).trim()).filter(Boolean);
    }
    if (typeof ccMail === 'string') {
      return ccMail.split(/[,;]/).map(e => e.trim()).filter(Boolean);
    }
    return [];
  }

  createLicenceGroup(): FormGroup {
    return this.fb.group({
      nomDesLicences: ['', Validators.required],
      quantite: ['', AppValidators.requiredQuantity],
      dateEx: ['']
    });
  }

  addCcMail(): void {
    this.ccMail.push(this.fb.control(''));
  }

  addLicence(): void {
    this.licences.push(this.createLicenceGroup());
  }

  removeLicence(index: number): void {
    this.licences.removeAt(index);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.VeeamId) return;
    this.selectedFile = file;
    this.veeamService.uploadFile(this.VeeamId, file).subscribe(
      (updatedVeeam) => {
        this.veeam = updatedVeeam;
        this.selectedFile = null;
        this.cdr.detectChanges();
        window.alert('Fichier uploadé avec succès');
      },
      (error) => {
        console.error('Erreur lors de l\'upload du fichier', error);
        window.alert('Erreur lors de l\'upload du fichier');
      }
    );
  }

  getFileDownloadUrl(): string {
    return this.veeamService.getFileDownloadUrlById(this.VeeamId);
  }

  deleteFile(): void {
    if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
      this.veeamService.deleteFile(this.VeeamId).subscribe(
        (updatedVeeam) => {
          this.veeam = updatedVeeam;
          this.cdr.detectChanges();
          window.alert('Fichier supprimé avec succès');
        },
        (error) => {
          console.error('Erreur lors de la suppression du fichier', error);
          window.alert('Erreur lors de la suppression du fichier');
        }
      );
    }
  }

  loadVeeam(id: number): void {
    this.veeamService.getVeeamById(id).subscribe(
      (data: Veeam) => {
        this.veeam = data;
        this.VeeamId = data.veeamId!;
        this.loadVeeamIntoForm(data);
      },
      error => console.error('Erreur r�cup�ration Veeam:', error)
    );
  }

  loadVeeamIntoForm(data: Veeam): void {
    this.updateForm.patchValue({
      client: data.client ?? '',
      dureeDeLicence: data.dureeDeLicence ?? '',
      nomDuContact: data.nomDuContact ?? '',
      adresseEmailContact: data.adresseEmailContact ?? '',
      mailAdmin: data.mailAdmin ?? '',
      numero: data.numero ?? '',
      commandePasserPar: this.normalizeCommandePasserPar(data.commandePasserPar),
      remarque: data.remarque ?? '',
      sousContrat: data.sousContrat ?? false
    });

    this.licences.clear();
    if (data.licences?.length) {
      data.licences.forEach(lic => {
        this.licences.push(this.fb.group({
          nomDesLicences: [lic.nomDesLicences ?? '', Validators.required],
          quantite: [lic.quantite != null ? String(lic.quantite) : '', AppValidators.requiredQuantity],
          dateEx: [this.formatDate(lic.dateEx)]
        }));
      });
    } else {
      this.addLicence();
    }

    this.ccMail.clear();
    const ccMails = this.normalizeCcMails(data.ccMail);
    if (ccMails.length) {
      ccMails.forEach(email => {
        this.ccMail.push(this.fb.control(email, Validators.email));
      });
    } else {
      this.ccMail.push(this.fb.control(''));
    }

    this.updateForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.substring(0, 10);
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  }

  updateVeeam(): void {
    if (!this.updateForm.valid) {
      this.updateForm.markAllAsTouched();
      window.alert('Veuillez corriger les champs en rouge (client, licences, emails invalides, etc.).');
      return;
    }

    const formValue = this.updateForm.value;
    const updatedVeeam: Veeam = {
      veeamId: this.VeeamId,
      ...formValue,
      ccMail: (formValue.ccMail as string[]).filter((e: string) => e && String(e).trim()),
      commandePasserPar: this.normalizeCommandePasserPar(formValue.commandePasserPar) as unknown as CommandePasserPar,
      fichier: this.veeam?.fichier,
      fichierOriginalName: this.veeam?.fichierOriginalName
    };

    this.veeamService.updateVeeam(updatedVeeam).subscribe(
      () => {
        window.alert('Veeam mis à jour avec succès');
        if (this.veeamToEdit) {
          this.updated.emit(updatedVeeam);
        } else {
          this.router.navigate(['/Afficherveeam']);
        }
      },
      error => console.error('Erreur mise à jour Veeam:', error)
    );
  }

  onSubmit(): void {
    this.updateVeeam();
  }

  onCancel(): void {
    if (this.veeamToEdit) {
      this.cancelled.emit();
    } else {
      this.router.navigate(['/Afficherveeam']);
    }
  }
}
