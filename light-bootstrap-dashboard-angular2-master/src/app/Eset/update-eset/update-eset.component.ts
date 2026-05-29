import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EsetService } from 'app/Services/eset.service';
import { Eset } from 'app/Model/Eset';
import { TypeAchat } from 'app/Model/TypeAchat';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { HttpEventType } from '@angular/common/http';
import { ClientService, Client } from '../../Services/client.service';
import { AppValidators } from '../../shared/validators/app-validators';

@Component({
  selector: 'app-update-eset',
  templateUrl: './update-eset.component.html',
  styleUrls: ['./update-eset.component.scss']
})
export class UpdateEsetComponent implements OnInit {
  @Output() updated = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() esetToEdit?: Eset;
  
  clients: Client[] = [];
  Validators = Validators;
  updateForm!: FormGroup;
  esetid!: number;
  eset!: Eset;
  
  // Variables pour l'upload de fichier
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = 0;
  uploadMessage: string | null = null;
  uploadSuccess = false;
  currentFileName: string | null = null;
  currentFileOriginalName: string | null = null;

  // Variables pour le modal de succ�s
  showSuccessModal: boolean = false;
  successMessage: string = '';
  successTitle: string = '';
  
  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    public fb: FormBuilder,
    private esetService: EsetService,
    private route: ActivatedRoute,
    public router: Router,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initializeForm();
    
    // Si l'ESET est pass� en Input (mode modal), l'utiliser
    if (this.esetToEdit) {
      this.eset = this.esetToEdit;
      this.esetid = this.esetToEdit.esetid!;
      this.populateForm(this.eset);
      // Charger le fichier existant
      if (this.eset.fichier) {
        this.currentFileName = this.eset.fichier;
        this.currentFileOriginalName = this.eset.fichierOriginalName || this.eset.fichier;
      }
    } else {
      // Sinon, charger depuis la route (mode standalone)
      this.loadEsetData();
    }
  }

  initializeForm(): void {
    this.updateForm = this.fb.group({
      client: ['', Validators.required],
      identifiant: ['', Validators.required],
      cle_de_Licence: ['', Validators.required],
      nom_produit: ['', Validators.required],
      nombre: ['', AppValidators.requiredQuantity],
      nmb_tlf: ['', [ Validators.pattern(/^\d+$/)]],
      nom_contact: [''],
      dureeDeLicence: [''],
      commandePasserPar: ['', Validators.required],
      mail: [''],
      mailAdmin: ['', Validators.email],
      dateEx: ['', Validators.required],
      typeAchat: ['', Validators.required],
      ccMail: this.fb.array([]),
      sousContrat: [false],
      remarque: ['']
    });
  }

  loadEsetData(): void {
    this.esetid = Number(this.route.snapshot.params['id']);
    this.esetService.getEsetById(this.esetid).subscribe(
      (data: Eset) => {
        this.eset = data;
        console.log('Eset re�u:', this.eset);
        this.populateForm(data);
        // Charger le nom du fichier existant
        if (data.fichier) {
          this.currentFileName = data.fichier;
          this.currentFileOriginalName = data.fichierOriginalName || data.fichier;
        }
      },
      (error) => {
        console.error('Erreur lors de la r�cup�ration d\'ESET:', error);
      }
    );
  }

  populateForm(data: Eset): void {
    // Pr�parer la date au format yyyy-MM-dd pour input date
    let dateExStr = '';
    if (data.dateEx) {
      const date = new Date(data.dateEx);
      dateExStr = date.toISOString().substring(0, 10);
    }

    // Remplir les champs principaux
    this.updateForm.patchValue({
      client: data.client ?? '',
      identifiant: data.identifiant ?? '',
      cle_de_Licence: data.cle_de_Licence ?? '',
      nom_produit: data.nom_produit ?? '',
      nombre: data.nombre != null ? String(data.nombre) : '',
      nmb_tlf: data.nmb_tlf ? data.nmb_tlf.toString() : '',
      nom_contact: data.nom_contact ?? '',
      dureeDeLicence: data.dureeDeLicence ?? '',
      commandePasserPar: this.getCommandePasserParValue(data.commandePasserPar),
      mail: data.mail ?? '',
      mailAdmin: data.mailAdmin ?? '',
      dateEx: dateExStr,
      typeAchat: data.typeAchat ?? 'RENOUVELLEMENT',
      sousContrat: data.sousContrat ?? false,
      remarque: data.remarque ?? ''
    });

    // Remplir les emails CC
    this.populateCcMail(data.ccMail);
  }

  populateCcMail(ccMail: string[] | undefined): void {
    this.ccMail.clear();
    if (ccMail && ccMail.length > 0) {
      ccMail.forEach(email => {
        this.ccMail.push(this.fb.control(email, Validators.email));
      });
    } else {
      this.ccMail.push(this.fb.control('', Validators.email));
    }
  }

  private getCommandePasserParValue(value: any): CommandePasserPar {
    if (!value) return CommandePasserPar.GI_TN;
    
    const stringValue = String(value).toUpperCase().trim();
    
    switch (stringValue) {
      case 'GI_TN': return CommandePasserPar.GI_TN;
      case 'GI_FR': return CommandePasserPar.GI_FR;
      case 'GI_CI': return CommandePasserPar.GI_CI;
      default: return CommandePasserPar.GI_TN;
    }
  }

  updateEset(): void {
    if (!this.updateForm.valid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const formValue = this.updateForm.value;
      
      const updatedEset: Eset = {
        esetid: this.esetid,
        client: formValue.client,
        identifiant: formValue.identifiant,
        cle_de_Licence: formValue.cle_de_Licence,
        nom_produit: formValue.nom_produit,
        dureeDeLicence: formValue.dureeDeLicence,
        sousContrat: formValue.sousContrat,
        remarque: formValue.remarque,
        commandePasserPar: formValue.commandePasserPar,
        nombre: Number(formValue.nombre),
        nmb_tlf: Number(formValue.nmb_tlf),
        nom_contact: formValue.nom_contact,
        mailAdmin: formValue.mailAdmin,
        mail: formValue.mail,
        dateEx: formValue.dateEx,
        typeAchat: formValue.typeAchat,
        ccMail: formValue.ccMail.filter((email: string) => email.trim() !== ''),
        approuve: this.eset.approuve // Conserver le statut d'approbation
      };

      console.log('Donn�es envoy�es au serveur:', updatedEset);

      this.esetService.updateEset(updatedEset).subscribe(
        () => {
          console.log('Eset mis � jour avec succ�s');
          this.successTitle = 'Succ�s';
          this.successMessage = 'ESET mise � jour avec succ�s!';
          this.showSuccessModal = true;
          
          // �mettre l'�v�nement au lieu de naviguer
          setTimeout(() => {
            this.updated.emit();
          }, 1500);
        },
        (error) => {
          console.error('Erreur mise � jour ESET:', error);
          alert('Erreur lors de la mise � jour: ' + (error.error?.message || error.message));
        }
      );
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  get ccMail() {
    return this.updateForm.get('ccMail') as FormArray;
  }

  addCcMail(): void {
    this.ccMail.push(this.fb.control('', Validators.email));
  }

  removeCcMail(index: number): void {
    if (this.ccMail.length > 1) {
      this.ccMail.removeAt(index);
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
      this.uploadMessage = 'Veuillez s�lectionner un fichier';
      this.uploadSuccess = false;
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = null;

    this.esetService.uploadFile(this.esetid, this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploading = false;
          if (event.body.success) {
            this.uploadSuccess = true;
            this.uploadMessage = 'Fichier upload� avec succ�s!';
            this.currentFileName = event.body.fichier;
            this.currentFileOriginalName = event.body.originalName || this.selectedFile?.name;
            this.selectedFile = null;
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
    if (this.currentFileName && this.esetid) {
      const url = this.esetService.getFileDownloadUrlById(this.esetid);
      window.open(url, '_blank');
    }
  }

  deleteFile(): void {
    if (confirm('�tes-vous s�r de vouloir supprimer ce fichier?')) {
      this.esetService.deleteFile(this.esetid).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.currentFileName = null;
            this.uploadMessage = 'Fichier supprim� avec succ�s';
            this.uploadSuccess = true;
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

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    // Naviguer seulement si pas d'observateur (mode standalone)
    if (!this.updated.observers.length) {
      this.router.navigate(['/affichage']);
    }
  }

  onCancel(): void {
    // �mettre l'�v�nement d'annulation si des observateurs �coutent (mode modal)
    if (this.cancelled.observers.length) {
      this.cancelled.emit();
    } else {
      // Sinon naviguer (mode standalone)
      this.router.navigate(['/affichage']);
    }
  }
}
