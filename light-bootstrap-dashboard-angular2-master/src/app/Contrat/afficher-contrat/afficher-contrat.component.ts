import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ContratService } from 'app/Services/contrat.service';
import { Contrat } from 'app/Model/Contrat';
import { ClientService, Client } from '../../Services/client.service';
import { PRODUIT_LIST } from '../../Model/NomProduit';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficher-contrat',
  templateUrl: './afficher-contrat.component.html',
  styleUrls: ['./afficher-contrat.component.scss']
})
export class AfficherContratComponent implements OnInit {
  clients: Client[] = [];
  searchTerm: string = '';
  contrats: Contrat[] = [];
  filteredContrats: Contrat[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedContrats: Contrat[] = [];

  // Modal
  showModal: boolean = false;
  isEditMode: boolean = false;
  contratForm!: FormGroup;
  editingContratId: number | null = null;

  // Detail panel
  selectedContrat: Contrat | null = null;

  nomProduitOptions = PRODUIT_LIST;

  // Variables pour la gestion des fichiers
  selectedFile: File | null = null;
  existingFile: string | null = null;
  existingFileName: string | null = null;
  uploading: boolean = false;

  constructor(
    private contratService: ContratService,
    private fb: FormBuilder,
    private clientService: ClientService,
    public permissionService: PermissionService) { }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initForm();
    this.watchDateFin();
    this.getAllContrats();
  }

  initForm(): void {
    this.contratForm = this.fb.group({
      client: [''],
      objetContrat: [''],
      nbInterventionsPreventives: [''],
      nbInterventionsCuratives: [''],
      dateDebut: [''],
      dateFin: [''],
      renouvelable: [false],
      remarque: [''],
      emailCommercial: [''],
      ccMail: this.fb.array([]),
      datesAvenants: this.fb.array([]),
      nomProduit: [''],
      criticite: [''],
      delaiMaxIntervention: [''],
      delaiMaxResolution: ['']
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

  // Getter pour le FormArray des dates avenants
  get datesAvenants(): FormArray {
    return this.contratForm.get('datesAvenants') as FormArray;
  }

  // Getter pour le FormArray des emails CC
  get ccMailArray(): FormArray {
    return this.contratForm.get('ccMail') as FormArray;
  }

  // Créer un groupe pour une date avenant
  createDateAvenantGroup(): FormGroup {
    return this.fb.group({
      dateAvenant: [''],
      numeroAvenant: [this.datesAvenants.length + 1],
      details: ['']
    });
  }

  // Ajouter une date avenant
  addDateAvenant(): void {
    this.datesAvenants.push(this.createDateAvenantGroup());
  }

  // Supprimer une date avenant
  removeDateAvenant(index: number): void {
    this.datesAvenants.removeAt(index);
    // Renuméroter les avenants
    this.datesAvenants.controls.forEach((control, i) => {
      control.get('numeroAvenant')?.setValue(i + 1);
    });
  }

  // Ajouter un email CC
  addCcMail(): void {
    this.ccMailArray.push(this.fb.control('', Validators.email));
  }

  // Supprimer un email CC
  removeCcMail(index: number): void {
    this.ccMailArray.removeAt(index);
  }

  onSearch() {
    this.filteredContrats = this.filterContrats();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllContrats(): void {
    this.contratService.getAllContrats().subscribe(
      (data: Contrat[]) => {
        this.contrats = data.reverse();
        this.filteredContrats = [...this.contrats];
        this.calculatePagination();
        this.changePage(0);
      },
      (error) => {
        console.error('Erreur récupération Contrats', error);
      }
    );
  }

  filterContrats(): Contrat[] {
    const term = this.searchTerm.toLowerCase();
    return this.contrats.filter((contrat) => {
      return (
        contrat.client?.toLowerCase().includes(term) ||
        contrat.objetContrat?.toLowerCase().includes(term) ||
        contrat.remarque?.toLowerCase().includes(term) ||
        (contrat.dateDebut && new Date(contrat.dateDebut).toLocaleDateString('fr-FR').includes(term)) ||
        (contrat.dateFin && new Date(contrat.dateFin).toLocaleDateString('fr-FR').includes(term))
      );
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredContrats.length / this.pageSize);
  }

  changePage(pageIndex: number) {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedContrats = this.filteredContrats.slice(start, end);
  }

  // Detail panel
  selectContrat(contrat: Contrat): void {
    this.selectedContrat = this.selectedContrat?.contratId === contrat.contratId ? null : contrat;
  }

  closeDetail(): void {
    this.selectedContrat = null;
  }

  // Modal functions
  openAddModal(): void {
    this.isEditMode = false;
    this.editingContratId = null;

    // Réinitialiser les variables de fichier
    this.selectedFile = null;
    this.existingFile = null;
    this.existingFileName = null;

    // Vider le FormArray des dates avenants
    while (this.datesAvenants.length) {
      this.datesAvenants.removeAt(0);
    }
    // Vider le FormArray des emails CC
    while (this.ccMailArray.length) {
      this.ccMailArray.removeAt(0);
    }
    this.contratForm.reset({
      client: '',
      objetContrat: '',
      nbInterventionsPreventives: '',
      nbInterventionsCuratives: '',
      dateDebut: '',
      dateFin: '',
      renouvelable: false,
      remarque: '',
      emailCommercial: '',
      nomProduit: '',
      criticite: '',
      delaiMaxIntervention: '',
      delaiMaxResolution: ''
    });
    this.showModal = true;
  }

  openEditModal(contrat: Contrat): void {
    this.isEditMode = true;
    this.editingContratId = contrat.contratId || null;

    // Réinitialiser les variables de fichier
    this.selectedFile = null;
    this.existingFile = contrat.fichier || null;
    this.existingFileName = contrat.fichierOriginalName || contrat.fichier || null;

    // Vider le FormArray des dates avenants
    while (this.datesAvenants.length) {
      this.datesAvenants.removeAt(0);
    }
    // Vider le FormArray des emails CC
    while (this.ccMailArray.length) {
      this.ccMailArray.removeAt(0);
    }

    // Remplir avec les dates avenants existantes
    if (contrat.datesAvenants && contrat.datesAvenants.length > 0) {
      contrat.datesAvenants.forEach((da) => {
        const group = this.fb.group({
          dateAvenant: [da.dateAvenant, Validators.required],
          numeroAvenant: [da.numeroAvenant],
          details: [da.details || '']
        });
        this.datesAvenants.push(group);
      });
    }

    // Remplir avec les emails CC existants
    if (contrat.ccMail && contrat.ccMail.length > 0) {
      contrat.ccMail.forEach((email) => {
        this.ccMailArray.push(this.fb.control(email, Validators.email));
      });
    }

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
      nomProduit: contrat.nomProduit || '',
      criticite: contrat.criticite || '',
      delaiMaxIntervention: contrat.delaiMaxIntervention || '',
      delaiMaxResolution: contrat.delaiMaxResolution || ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    // Vider le FormArray des dates avenants
    while (this.datesAvenants.length) {
      this.datesAvenants.removeAt(0);
    }
    // Vider le FormArray des emails CC
    while (this.ccMailArray.length) {
      this.ccMailArray.removeAt(0);
    }
    this.contratForm.reset();
  }

  saveContrat(): void {
    if (this.contratForm.valid) {
      const formValue = this.contratForm.value;
      const contratData: Contrat = {
        ...formValue,
        ccMail: formValue.ccMail.filter((email: string) => email && email.trim() !== '')
      };

      if (this.isEditMode && this.editingContratId) {
        // Update
        this.contratService.updateContrat(this.editingContratId, contratData).subscribe(
          () => {
            // Upload le fichier si sélectionné
            if (this.selectedFile) {
              this.uploadFileAfterSave(this.editingContratId!, 'Contrat mis à jour avec succès');
            } else {
              alert('Contrat mis à jour avec succès');
              this.closeModal();
              this.getAllContrats();
            }
          },
          (error) => {
            console.error('Erreur lors de la mise à jour', error);
            alert('Erreur lors de la mise à jour du contrat');
          }
        );
      } else {
        // Add
        this.contratService.addContrat(contratData).subscribe(
          (newContrat: Contrat) => {
            // Upload le fichier si sélectionné
            if (this.selectedFile && newContrat.contratId) {
              this.uploadFileAfterSave(newContrat.contratId, 'Contrat ajouté avec succès');
            } else {
              alert('Contrat ajouté avec succès');
              this.closeModal();
              this.getAllContrats();
            }
          },
          (error) => {
            console.error('Erreur lors de l\'ajout', error);
            alert('Erreur lors de l\'ajout du contrat');
          }
        );
      }
    }
  }

  deleteContrat(id: number | undefined): void {
    if (id != null && confirm('Confirmer la suppression ?')) {
      this.contratService.deleteContrat(id).subscribe(
        () => {
          this.getAllContrats();
          alert('Contrat supprimé avec succès');
        },
        error => {
          console.error('Erreur suppression Contrat', error);
          alert('Échec suppression');
        }
      );
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // Méthodes pour la gestion des fichiers
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  getFileDownloadUrl(contratId: number | null | undefined): string {
    if (!contratId) return '';
    return this.contratService.getFileDownloadUrl(contratId);
  }

  uploadFileAfterSave(contratId: number, successMessage: string): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.contratService.uploadFile(contratId, this.selectedFile).subscribe(
      (response) => {
        this.uploading = false;
        if (response.success) {
          console.log('Fichier uploadé avec succès');
          alert(successMessage);
          this.closeModal();
          this.getAllContrats();
        } else {
          console.error('Erreur upload:', response.message);
          alert('Contrat sauvegardé mais erreur lors de l\'upload du fichier: ' + response.message);
          this.closeModal();
          this.getAllContrats();
        }
      },
      (error) => {
        this.uploading = false;
        console.error('Erreur lors de l\'upload', error);
        alert('Contrat sauvegardé mais erreur lors de l\'upload du fichier');
        this.closeModal();
        this.getAllContrats();
      }
    );
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    // Reset the file input
    const fileInput = document.getElementById('fichier') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  deleteExistingFile(): void {
    if (!this.editingContratId) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      this.contratService.deleteFile(this.editingContratId).subscribe(
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
