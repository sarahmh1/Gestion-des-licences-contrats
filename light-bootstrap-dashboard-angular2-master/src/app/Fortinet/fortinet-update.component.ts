import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { FortinetService } from 'app/Services/fortinet.service';
import { Fortinet } from 'app/Model/Fortinet';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { HttpEventType } from '@angular/common/http';
import { ClientService, Client } from '../Services/client.service';

@Component({
  selector: 'app-fortinet-update',
  templateUrl: './fortinet-update.component.html',
  styleUrls: ['./fortinet-update.component.scss']
})
export class UpdateFortinetComponent implements OnInit, OnChanges {
  @Input() fortinetToEdit: Fortinet | null = null;
  @Output() updated = new EventEmitter<Fortinet>();
  @Output() cancelled = new EventEmitter<void>();

  clients: Client[] = [];
  updateForm!: FormGroup;
  fortinetId!: number;
  fortinet!: Fortinet;
  
  // Variables pour l'upload de fichier
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = 0;
  uploadMessage: string | null = null;
  uploadSuccess = false;
  currentFileName: string | null = null;
  currentFileOriginalName: string | null = null;
  
  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    private fb: FormBuilder,
    private fortinetService: FortinetService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
    
    // Mode modal: utiliser @Input fortinetToEdit
    if (this.fortinetToEdit) {
      this.fortinet = this.fortinetToEdit;
      this.fortinetId = this.fortinetToEdit.fortinetId!;
      this.loadFortinetIntoForm(this.fortinet);
    } else {
      // Mode route normal: récupérer l'ID depuis l'URL
      this.fortinetId = Number(this.route.snapshot.paramMap.get('id'));
      
      if (this.fortinetId) {
        this.loadFortinet(this.fortinetId);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fortinetToEdit'] && changes['fortinetToEdit'].currentValue) {
      this.fortinetToEdit = changes['fortinetToEdit'].currentValue;
      if (this.updateForm) {
        this.loadFortinetIntoForm(this.fortinetToEdit);
        this.cdr.detectChanges();
      }
    }
  }

  initializeForm(): void {
    this.updateForm = this.fb.group({
      client: ['', Validators.required],
      nomDuBoitier: ['', Validators.required],
      numeroSerie: ['', Validators.required],
      commandePasserPar: ['', Validators.required],
      dureeDeLicence: [''],
      nomDuContact: [''],
      adresseEmailContact: [''],
      sousContrat: [false],
      mailAdmin: [''],
      ccMail: this.fb.array([this.fb.control('')]),
      numero: ['', AppValidators.optionalPhone],
      remarque: [''],
      licences: this.fb.array([this.createLicenceGroup()])
    });
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

  get ccMail(): FormArray {
    return this.updateForm.get('ccMail') as FormArray;
  }

  get licences(): FormArray {
    return this.updateForm.get('licences') as FormArray;
  }

  createLicenceGroup(): FormGroup {
    return this.fb.group({
      nomDesLicences: [''],
      quantite: [''],
      dateEx: ['']
    });
  }

  addLicence(): void {
    this.licences.push(this.createLicenceGroup());
  }

  removeLicence(index: number): void {
    this.licences.removeAt(index);
  }

  addCcMail(): void {
    this.ccMail.push(this.fb.control(''));
  }

  removeCcMail(index: number): void {
    this.ccMail.removeAt(index);
  }

  setCcMail(ccMails: string[]): void {
    const ccMailFormArray = this.updateForm.get('ccMail') as FormArray;
    ccMailFormArray.clear();
    if (ccMails && ccMails.length > 0) {
      ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email)));
    } else {
      ccMailFormArray.push(this.fb.control(''));
    }
  }

  // Fonction pour convertir la valeur en enum CommandePasserPar
  private getCommandePasserParValue(value: any): CommandePasserPar {
    if (!value) return CommandePasserPar.GI_TN; // Valeur par défaut
    
    const stringValue = String(value).toUpperCase().trim();
    
    switch (stringValue) {
      case 'GI_TN':
        return CommandePasserPar.GI_TN;
      case 'GI_FR':
        return CommandePasserPar.GI_FR;
      case 'GI_CI':
        return CommandePasserPar.GI_CI;
      default:
        console.warn('Valeur CommandePasserPar non reconnue:', value);
        return CommandePasserPar.GI_TN; // Valeur par défaut
    }
  }

  loadFortinetIntoForm(fortinet: Fortinet): void {
    console.log('Fortinet chargé:', fortinet);
    console.log('Licences reçues:', fortinet.licences);
    
    // Convertir la valeur en enum
    const commandePasserParValue = this.getCommandePasserParValue(fortinet.commandePasserPar);
    
    this.updateForm.patchValue({
      client: fortinet.client,
      nomDuBoitier: fortinet.nomDuBoitier,
      numeroSerie: fortinet.numeroSerie,
      commandePasserPar: commandePasserParValue,
      dureeDeLicence: fortinet.dureeDeLicence,
      nomDuContact: fortinet.nomDuContact,
      sousContrat: fortinet.sousContrat,
      adresseEmailContact: fortinet.adresseEmailContact,
      mailAdmin: fortinet.mailAdmin,
      numero: fortinet.numero,
      remarque: fortinet.remarque
    }, { emitEvent: false });

    // Charger les licences
    if (fortinet.licences && fortinet.licences.length > 0) {
      const licencesArray = this.updateForm.get('licences') as FormArray;
      licencesArray.clear();
      
      fortinet.licences.forEach((licence: any) => {
        licencesArray.push(this.fb.group({
          nomDesLicences: [licence.nomDesLicences, Validators.required],
          quantite: [licence.quantite, [Validators.required, Validators.min(1)]],
          dateEx: [licence.dateEx]
        }));
      });
    }

    // Charger les CC mails
    if (fortinet.ccMail && fortinet.ccMail.length > 0) {
      const ccMailArray = this.updateForm.get('ccMail') as FormArray;
      ccMailArray.clear();
      
      fortinet.ccMail.forEach((email: string) => {
        ccMailArray.push(this.fb.control(email.trim(), [Validators.email]));
      });
    }

    this.currentFileName = fortinet.fichier || null;
    this.currentFileOriginalName = fortinet.fichierOriginalName || null;
  }

  loadFortinet(id: number): void {
    this.fortinetService.getFortinetById(id).subscribe(
      (fortinet: Fortinet) => {
        this.fortinet = fortinet;
        this.loadFortinetIntoForm(fortinet);
      },
      error => {
        console.error('Erreur lors du chargement du Fortinet:', error);
      }
    );
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    
    // Si c'est déjà une string au format YYYY-MM-DD, la retourner telle quelle
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    const d = new Date(date);
    
    // Vérifier si la date est valide
    if (isNaN(d.getTime())) {
      console.warn('Date invalide:', date);
      return '';
    }
    
    return d.toISOString().substring(0, 10);
  }

  updateFortinet(): void {
    if (!this.updateForm.valid) {
      this.markFormGroupTouched(this.updateForm);
      return;
    }

    const updatedFortinet: Fortinet = {
        fortinetId: this.fortinetId,
        client: this.updateForm.value.client,
        nomDuBoitier: this.updateForm.value.nomDuBoitier,
        numeroSerie: this.updateForm.value.numeroSerie,
        commandePasserPar: this.updateForm.value.commandePasserPar,
        dureeDeLicence: this.updateForm.value.dureeDeLicence,
        nomDuContact: this.updateForm.value.nomDuContact,
        adresseEmailContact: this.updateForm.value.adresseEmailContact,
        mailAdmin: this.updateForm.value.mailAdmin || '',
        ccMail: this.ccMail.value.filter((email: string) => email !== ''), // Filtrer les emails vides
        sousContrat: this.updateForm.value.sousContrat,
        numero: this.updateForm.value.numero,
        approuve: this.fortinet?.approuve || false,
        remarque: this.updateForm.value.remarque || '',
        licences: this.licences.value,
        // Inclure les champs fichier pour ne pas les écraser
        fichier: this.currentFileName || undefined,
        fichierOriginalName: this.currentFileOriginalName || undefined
      };

      console.log('Données à mettre à jour:', updatedFortinet);

      this.fortinetService.updateFortinet(updatedFortinet).subscribe(
        response => {
          console.log('Réponse mise à jour:', response);
          window.alert('Fortinet mis à jour avec succès');
          // Mode modal: émettre l'événement updated
          if (this.fortinetToEdit) {
            this.updated.emit(updatedFortinet);
          } else {
            // Mode route: naviguer
            this.router.navigate(['/Afficherfortinet']);
          }
        },
        error => {
          console.error('Erreur lors de la mise à jour:', error);
          if (error.error) {
            console.error('Détails de l\'erreur:', error.error);
          }
          window.alert('Échec de la mise à jour: ' + (error.error?.message || error.message));
        }
      );
  }

  // Méthode pour marquer tous les champs comme touchés
  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.controls[key];
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }

  onSubmit(): void {
    this.updateFortinet();
  }

  onCancel(): void {
    // Mode modal: émettre l'événement cancelled
    if (this.fortinetToEdit) {
      this.cancelled.emit();
    } else {
      // Mode route: naviguer
      this.router.navigate(['/Afficherfortinet']);
    }
  }

  // ==================== GESTION DES FICHIERS ====================
  
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadMessage = null;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Veuillez sélectionner un fichier';
      this.uploadSuccess = false;
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = null;

    console.log('Début upload fichier:', this.selectedFile.name);

    this.fortinetService.uploadFile(this.fortinetId, this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploading = false;
          console.log('Réponse upload:', event.body);
          if (event.body.success) {
            this.uploadSuccess = true;
            this.uploadMessage = 'Fichier uploadé avec succès!';
            this.currentFileName = event.body.fichier;
            this.currentFileOriginalName = event.body.originalName || this.selectedFile?.name;
            console.log('Nouveau fichier:', this.currentFileName, this.currentFileOriginalName);
            this.selectedFile = null;
            // Réinitialiser l'input file
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
            // Forcer la détection de changement
            this.cdr.detectChanges();
          } else {
            this.uploadSuccess = false;
            this.uploadMessage = event.body.message || 'Erreur lors de l\'upload';
          }
        }
      },
      error: (error) => {
        this.uploading = false;
        this.uploadSuccess = false;
        this.uploadMessage = 'Erreur lors de l\'upload: ' + (error.error?.message || error.message);
        console.error('Erreur upload:', error);
      }
    });
  }

  downloadFile(): void {
    if (this.currentFileName && this.fortinetId) {
      const url = this.fortinetService.getFileDownloadUrlById(this.fortinetId);
      window.open(url, '_blank');
    }
  }

  deleteFile(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier?')) {
      this.fortinetService.deleteFile(this.fortinetId).subscribe({
        next: (response: any) => {
          console.log('Réponse suppression:', response);
          if (response.success) {
            this.currentFileName = null;
            this.currentFileOriginalName = null;
            this.uploadMessage = 'Fichier supprimé avec succès';
            this.uploadSuccess = true;
            // Forcer la détection de changement
            this.cdr.detectChanges();
          } else {
            this.uploadMessage = response.message || 'Erreur lors de la suppression';
            this.uploadSuccess = false;
          }
        },
        error: (error) => {
          this.uploadMessage = 'Erreur lors de la suppression';
          this.uploadSuccess = false;
          console.error('Erreur suppression:', error);
        }
      });
    }
  }
}
