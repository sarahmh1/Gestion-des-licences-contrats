import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaloService } from 'app/Services/palo.service';
import { Palo } from 'app/Model/Palo';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { HttpEventType } from '@angular/common/http';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-palo',
  templateUrl: './update-palo.component.html',
  styleUrls: ['./update-palo.component.scss']
})
export class UpdatePaloComponent implements OnInit {
  clients: Client[] = [];
   updateForm!: FormGroup;
    paloId!: number;
    palo!: Palo;
    public Validators = Validators;
    
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
      public fb: FormBuilder,
      private paloService: PaloService,
      private route: ActivatedRoute,
      private router: Router,
      private cdr: ChangeDetectorRef,
    private clientService: ClientService) {}
  
    ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
      this.updateForm = this.fb.group({
        client: ['', Validators.required],
        nomDuBoitier: ['', Validators.required],
        numeroSerieBoitier: ['', Validators.required],
        dureeDeLicence: [''],
        nomDuContact: [''],
        commandePasserPar: ['', Validators.required],
        adresseEmailContact: ['', [Validators.required, Validators.email]],
        mailAdmin: ['', Validators.email],
        ccMail: this.fb.array([]),
        numero: [''],
        remarque: [''],
        sousContrat: [false],
        licences: this.fb.array([])  // ?? Ajout des licences dynamiques ici
      });
  
      this.paloId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadPalo(this.paloId);
    }
  
    get ccMail(): FormArray {
      return this.updateForm.get('ccMail') as FormArray;
    }
  
    get licences(): FormArray {
      return this.updateForm.get('licences') as FormArray;
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
    createLicenceGroup(): FormGroup {
      return this.fb.group({
        nomDesLicences: ['', Validators.required],
        quantite: ['', Validators.required],
        dateEx: ['', Validators.required]
      });
    }
  
    addLicence(): void {
      this.licences.push(this.createLicenceGroup());
    }
  
    removeLicence(index: number): void {
      this.licences.removeAt(index);
    }
  
    loadPalo(id: number): void {
      this.paloService.getPaloById(id).subscribe(
        (data: Palo) => {
          this.palo = data;
  
          this.updateForm.patchValue({
            client: data.client ?? '',
            nomDuBoitier: data.nomDuBoitier ?? '',
            numeroSerieBoitier: data. numeroSerieBoitier ?? '',
            dureeDeLicence: data.dureeDeLicence ?? '',
            nomDuContact: data.nomDuContact ?? '',
            commandePasserPar: this.getCommandePasserParValue(data.commandePasserPar),
            adresseEmailContact: data.adresseEmailContact ?? '',
            mailAdmin: data.mailAdmin ?? '',
            numero: data.numero ?? '',
            remarque: data.remarque ?? '',
            sousContrat: data.sousContrat ?? false
          });
  
          // Remplir les licences
          this.licences.clear();
          if (data.licences && data.licences.length > 0) {
            data.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          } else {
            this.addLicence();
          }
  
          // CC mails
          this.ccMail.clear();
          if (data.ccMail && data.ccMail.length > 0) {
            data.ccMail.forEach(email => {
              this.ccMail.push(this.fb.control(email, Validators.email));
            });
          } else {
            this.ccMail.push(this.fb.control('', Validators.email));
          }
          
          // Charger le nom du fichier existant
          if (data.fichier) {
            this.currentFileName = data.fichier;
            this.currentFileOriginalName = data.fichierOriginalName || data.fichier;
          }
        },
        error => {
          console.error('Erreur récupération Palo:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updatePalo(): void {
      if (this.updateForm.valid) {
        const updatedPalo: Palo = {
          paloId: this.paloId,
          ...this.updateForm.value,
          // Inclure les champs fichier pour ne pas les écraser
          fichier: this.currentFileName || undefined,
          fichierOriginalName: this.currentFileOriginalName || undefined
        };
  
        this.paloService.updatePalo(updatedPalo).subscribe(
          () => {
            console.log('Palo mis à jour avec succès');
            this.router.navigate(['/Afficherpalo']);
          },
          error => {
            console.error('Erreur mise à jour Palo:', error);
          }
        );
      } else {
        console.error('Formulaire invalide', this.updateForm);
      }
    }
  
    onSubmit(): void {
      this.updatePalo();
    }
  
    onCancel(): void {
      this.router.navigate(['/Afficherpalo']);
    }

    resetForm(): void {
      this.updateForm.reset();
      this.selectedFile = null;
      this.uploadMessage = null;
      this.uploadSuccess = false;
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

      this.paloService.uploadFile(this.paloId, this.selectedFile).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
          } else if (event.type === HttpEventType.Response) {
            this.uploading = false;
            if (event.body.success) {
              this.uploadSuccess = true;
              this.uploadMessage = 'Fichier uploadé avec succès!';
              this.currentFileName = event.body.fichier;
              this.currentFileOriginalName = event.body.originalName || this.selectedFile?.name;
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
      if (this.currentFileName && this.paloId) {
        const url = this.paloService.getFileDownloadUrlById(this.paloId);
        window.open(url, '_blank');
      }
    }

    deleteFile(): void {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier?')) {
        this.paloService.deleteFile(this.paloId).subscribe({
          next: (response: any) => {
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
  
