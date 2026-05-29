import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router, ActivatedRoute } from '@angular/router';
import { ContratService } from 'app/Services/contrat.service';
import { Contrat } from 'app/Model/Contrat';
import { ClientService, Client } from '../../Services/client.service';
import { PRODUIT_LIST } from '../../Model/NomProduit';

@Component({
  selector: 'app-update-contrat',
  templateUrl: './update-contrat.component.html',
  styleUrls: ['./update-contrat.component.scss']
})
export class UpdateContratComponent implements OnInit {
  clients: Client[] = [];
  contratForm!: FormGroup;
  contratId!: number;
  nomProduitOptions = PRODUIT_LIST;

  // Variables pour la gestion des fichiers
  selectedFile: File | null = null;
  existingFile: string | null = null;
  existingFileName: string | null = null;
  uploading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private contratService: ContratService,
    private router: Router,
    private route: ActivatedRoute,
    private clientService: ClientService) { }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initForm();
    this.watchDateFin();
    this.contratId = +this.route.snapshot.params['id'];
    this.loadContrat();
  }

  initForm(): void {
    this.contratForm = this.fb.group({
      client: ['', Validators.required],
      objetContrat: ['', Validators.required],
      nbInterventionsPreventives: ['', AppValidators.requiredDigits],
      nbInterventionsCuratives: ['', AppValidators.requiredDigits],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      renouvelable: [false],
      remarque: [''],
      emailCommercial: ['', Validators.email],
      ccMail: this.fb.array([]),
      nomProduit: ['']
    });
  }

  watchDateFin(): void {
    this.contratForm.get('dateFin')?.valueChanges.subscribe((val: string) => {
      const renouvelable = this.contratForm.get('renouvelable');
      if (val) {
        renouvelable?.setValue(false, { emitEvent: false });
        renouvelable?.disable({ emitEvent: false });
      } else {
        renouvelable?.enable({ emitEvent: false });
      }
    });
  }

  // Getter pour le FormArray des emails CC
  get ccMailArray(): FormArray {
    return this.contratForm.get('ccMail') as FormArray;
  }

  // Ajouter un email CC
  addCcMail(): void {
    this.ccMailArray.push(this.fb.control('', Validators.email));
  }

  // Supprimer un email CC
  removeCcMail(index: number): void {
    this.ccMailArray.removeAt(index);
  }

  loadContrat(): void {
    this.contratService.getContratById(this.contratId).subscribe(
      (contrat: Contrat) => {
        this.contratForm.patchValue({
          client: contrat.client,
          objetContrat: contrat.objetContrat,
          nbInterventionsPreventives: contrat.nbInterventionsPreventives,
          nbInterventionsCuratives: contrat.nbInterventionsCuratives,
          dateDebut: contrat.dateDebut,
          dateFin: contrat.dateFin,
          renouvelable: contrat.renouvelable,
          remarque: contrat.remarque,
          emailCommercial: contrat.emailCommercial || '',
          nomProduit: contrat.nomProduit || ''
        });

        // Charger les emails CC
        if (contrat.ccMail && contrat.ccMail.length > 0) {
          contrat.ccMail.forEach(email => {
            this.ccMailArray.push(this.fb.control(email, Validators.email));
          });
        }

        // Charger les informations du fichier
        if (contrat.fichier) {
          this.existingFile = contrat.fichier;
          this.existingFileName = contrat.fichierOriginalName || contrat.fichier;
        }
      },
      (error) => {
        console.error('Erreur lors du chargement du contrat', error);
        alert('Contrat non trouvé');
        this.router.navigate(['/contrats']);
      }
    );
  }

  updateContrat(): void {
    if (this.contratForm.valid) {
      const formValue = this.contratForm.value;
      const contrat: Contrat = {
        ...formValue,
        contratId: this.contratId,
        ccMail: formValue.ccMail.filter((email: string) => email && email.trim() !== '')
      };
      this.contratService.updateContrat(this.contratId, contrat).subscribe(
        () => {
          alert('Contrat mis à jour avec succès');
          this.router.navigate(['/contrats']);
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du contrat', error);
          alert('Erreur lors de la mise à jour du contrat');
        }
      );
    }
  }

  cancel(): void {
    this.router.navigate(['/contrats']);
  }

  // Méthodes pour la gestion des fichiers
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.contratService.uploadFile(this.contratId, this.selectedFile).subscribe(
      (response) => {
        this.uploading = false;
        if (response.success) {
          alert('Fichier uploadé avec succès');
          this.existingFile = response.fichier;
          this.existingFileName = response.originalName;
          this.selectedFile = null;
        } else {
          alert('Erreur: ' + response.message);
        }
      },
      (error) => {
        this.uploading = false;
        console.error('Erreur lors de l\'upload', error);
        alert('Erreur lors de l\'upload du fichier');
      }
    );
  }

  getFileDownloadUrl(): string {
    return this.contratService.getFileDownloadUrl(this.contratId);
  }

  deleteFile(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      this.contratService.deleteFile(this.contratId).subscribe(
        (response) => {
          if (response.success) {
            alert('Fichier supprimé avec succès');
            this.existingFile = null;
            this.existingFileName = null;
          } else {
            alert('Erreur: ' + response.message);
          }
        },
        (error) => {
          console.error('Erreur lors de la suppression', error);
          alert('Erreur lors de la suppression du fichier');
        }
      );
    }
  }
}
