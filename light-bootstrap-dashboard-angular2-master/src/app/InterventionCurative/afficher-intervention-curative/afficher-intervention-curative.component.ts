import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { InterventionCurativeService } from 'app/Services/intervention-curative.service';
import { InterventionCurative } from 'app/Model/InterventionCurative';
import { ClientService, Client } from '../../Services/client.service';
import { ContratService } from '../../Services/contrat.service';
import { Contrat } from '../../Model/Contrat';
import { UserService } from '../../Services/user.service';
import { PRODUIT_LIST } from '../../Model/NomProduit';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficher-intervention-curative',
  templateUrl: './afficher-intervention-curative.component.html',
  styleUrls: ['./afficher-intervention-curative.component.scss']
})
export class AfficherInterventionCurativeComponent implements OnInit {
  clients: Client[] = [];
  users: any[] = [];
  contrats: Contrat[] = [];
  searchTerm: string = '';
  interventions: InterventionCurative[] = [];
  filteredInterventions: InterventionCurative[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedInterventions: InterventionCurative[] = [];

  // Modal
  showModal: boolean = false;
  isEditMode: boolean = false;
  interventionForm!: FormGroup;
  editingInterventionId: number | null = null;

  // Options
  criticiteOptions = ['C1', 'C2', 'C3'];
  modeInterventionOptions = ['Sur site', 'A distance'];
  nomProduitOptions = PRODUIT_LIST;

  // Variables pour gestion des fichiers
  selectedFile: File | null = null;
  existingFile: string | null = null;
  existingFileName: string | null = null;
  uploading: boolean = false;

  constructor(
    private interventionCurativeService: InterventionCurativeService,
    private fb: FormBuilder,
    private clientService: ClientService,
    private contratService: ContratService,
    private userService: UserService,
    public permissionService: PermissionService) { }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.userService.getAllUsers().subscribe(data => this.users = data);
    this.contratService.getAllContrats().subscribe(data => this.contrats = data);
    this.initForm();
    this.watchNomClientAndProduit();
    this.getAllInterventions();
  }

  initForm(): void {
    this.interventionForm = this.fb.group({
      ficheIntervention: [''],
      nomClient: [''],
      criticite: [''],
      probleme: [''],
      delaiResolution: [''],
      resume: [''],
      assignedUsers: [[]],
      intervenants: this.fb.array([this.createIntervenantControl()]),
      dateHeureDemande: [''],
      dateHeureIntervention: [''],
      dateHeureResolution: [''],
      dureeIntervention: [''],
      modeIntervention: [''],
      visAVisClient: [''],
      enCoursDeResolution: [false],
      resolu: [false],
      tachesEffectuees: [''],
      nomProduit: [''],
      contratId: [null]
    });
  }

  // Getter pour le FormArray des intervenants
  get intervenants(): FormArray {
    return this.interventionForm.get('intervenants') as FormArray;
  }

  // Auto-remplissage de visAVisClient + delaiResolution quand client/produit sélectionnés
  watchNomClientAndProduit(): void {
    this.interventionForm.get('nomClient')!.valueChanges.subscribe((nomClient: string) => {
      if (!nomClient) return;
      const found = this.clients.find(c => c.nomClient === nomClient);
      if (found) {
        const visAVis = found.nosVisAVis && found.nosVisAVis.length > 0
          ? found.nosVisAVis[0] : '';
        this.interventionForm.patchValue(
          { visAVisClient: visAVis },
          { emitEvent: false }
        );
      }
      this.updateDelaiFromContrat();
    });

    this.interventionForm.get('nomProduit')!.valueChanges.subscribe(() => {
      this.updateDelaiFromContrat();
    });
  }

  updateDelaiFromContrat(): void {
    const nomClient = this.interventionForm.get('nomClient')?.value;
    const nomProduit = this.interventionForm.get('nomProduit')?.value;

    if (!nomClient || !nomProduit) {
      this.interventionForm.patchValue({ delaiResolution: '' }, { emitEvent: false });
      return;
    }

    // Chercher le contrat correspondant
    const contrat = this.contrats.find(c =>
      c.client === nomClient && c.nomProduit === nomProduit
    );

    if (contrat && contrat.delaiMaxResolution) {
      this.interventionForm.patchValue(
        { delaiResolution: contrat.delaiMaxResolution },
        { emitEvent: false }
      );
    }
  }

  // Créer un control pour un intervenant
  createIntervenantControl(): FormGroup {
    return this.fb.group({
      nom: ['']
    });
  }

  // Ajouter un intervenant
  addIntervenant(): void {
    this.intervenants.push(this.createIntervenantControl());
  }

  // Supprimer un intervenant
  removeIntervenant(index: number): void {
    if (this.intervenants.length > 1) {
      this.intervenants.removeAt(index);
    }
  }

  onSearch() {
    this.filteredInterventions = this.filterInterventions();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllInterventions(): void {
    this.interventionCurativeService.getAllInterventionsCuratives().subscribe(
      (data: InterventionCurative[]) => {
        this.interventions = data;
        this.filteredInterventions = data;
        this.calculatePagination();
        this.changePage(0);
      },
      (error) => {
        console.error('Erreur récupération Interventions Curatives', error);
      }
    );
  }

  filterInterventions(): InterventionCurative[] {
    const term = this.searchTerm.toLowerCase();
    return this.interventions.filter((intervention) => {
      return (
        intervention.ficheIntervention?.toLowerCase().includes(term) ||
        intervention.nomClient?.toLowerCase().includes(term) ||
        intervention.intervenant?.toLowerCase().includes(term) ||
        intervention.criticite?.toLowerCase().includes(term)
      );
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredInterventions.length / this.pageSize);
  }

  changePage(pageIndex: number) {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedInterventions = this.filteredInterventions.slice(start, end);
  }

  // Modal functions
  openAddModal(): void {
    this.isEditMode = false;
    this.editingInterventionId = null;
    // Vider et réinitialiser le FormArray des intervenants
    while (this.intervenants.length) {
      this.intervenants.removeAt(0);
    }
    this.intervenants.push(this.createIntervenantControl());

    this.interventionForm.patchValue({
      ficheIntervention: '',
      nomClient: '',
      criticite: '',
      probleme: '',
      delaiResolution: '',
      resume: '',
      assignedUsers: [],
      dateHeureDemande: '',
      dateHeureIntervention: '',
      dateHeureResolution: '',
      dureeIntervention: '',
      modeIntervention: '',
      visAVisClient: '',
      enCoursDeResolution: false,
      resolu: false,
      tachesEffectuees: '',
      nomProduit: '',
      contratId: null
    });
    // Réinitialiser les variables de fichier
    this.selectedFile = null;
    this.existingFile = null;
    this.existingFileName = null;
    this.showModal = true;
  }

  openEditModal(intervention: InterventionCurative): void {
    this.isEditMode = true;
    this.editingInterventionId = intervention.interventionCurativeId || null;

    // Vider et remplir le FormArray des intervenants
    while (this.intervenants.length) {
      this.intervenants.removeAt(0);
    }

    if (intervention.intervenants && intervention.intervenants.length > 0) {
      intervention.intervenants.forEach((int: any) => {
        this.intervenants.push(this.fb.group({ nom: [int.nom || int] }));
      });
    } else if (intervention.intervenant) {
      // Compatibilité avec ancien format
      this.intervenants.push(this.fb.group({ nom: [intervention.intervenant] }));
    } else {
      this.intervenants.push(this.createIntervenantControl());
    }

    this.interventionForm.patchValue({
      ficheIntervention: intervention.ficheIntervention,
      nomClient: intervention.nomClient,
      criticite: intervention.criticite,
      probleme: intervention.probleme || '',
      delaiResolution: intervention.delaiResolution || '',
      resume: intervention.resume || '',
      assignedUsers: intervention.assignedUsers || [],
      dateHeureDemande: intervention.dateHeureDemande,
      dateHeureIntervention: intervention.dateHeureIntervention,
      dateHeureResolution: intervention.dateHeureResolution,
      dureeIntervention: intervention.dureeIntervention,
      modeIntervention: intervention.modeIntervention,
      visAVisClient: intervention.visAVisClient,
      enCoursDeResolution: intervention.enCoursDeResolution,
      resolu: intervention.resolu,
      tachesEffectuees: intervention.tachesEffectuees,
      nomProduit: intervention.nomProduit || '',
      contratId: intervention.contratId || null
    });
    // Charger info fichier existant
    this.selectedFile = null;
    this.existingFile = intervention.fichier || null;
    this.existingFileName = intervention.fichierOriginalName || null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.interventionForm.reset();
  }

  saveIntervention(): void {
    const interventionData: InterventionCurative = this.interventionForm.value;

    if (this.isEditMode && this.editingInterventionId) {
      // Update
      this.interventionCurativeService.updateInterventionCurative(this.editingInterventionId, interventionData).subscribe(
        () => {
          // Upload le fichier si sélectionné
          if (this.selectedFile) {
            this.uploadFileAfterSave(this.editingInterventionId!);
          } else {
            alert('Intervention mise à jour avec succès');
            this.closeModal();
            this.getAllInterventions();
          }
        },
        (error) => {
          console.error('Erreur lors de la mise à jour', error);
          alert('Erreur lors de la mise à jour');
        }
      );
    } else {
      // Add
      this.interventionCurativeService.addInterventionCurative(interventionData).subscribe(
        (newIntervention: InterventionCurative) => {
          // Upload le fichier si sélectionné
          if (this.selectedFile && newIntervention.interventionCurativeId) {
            this.uploadFileAfterSave(newIntervention.interventionCurativeId);
          } else {
            alert('Intervention ajoutée avec succès');
            this.closeModal();
            this.getAllInterventions();
          }
        },
        (error) => {
          console.error('Erreur lors de l\'ajout', error);
          alert('Erreur lors de l\'ajout');
        }
      );
    }
  }

  deleteIntervention(id: number | undefined): void {
    if (id != null && confirm('Confirmer la suppression ?')) {
      this.interventionCurativeService.deleteInterventionCurative(id).subscribe(
        () => {
          this.getAllInterventions();
          alert('Intervention supprimée avec succès');
        },
        error => {
          console.error('Erreur suppression', error);
          alert('Échec suppression');
        }
      );
    }
  }

  getCriticiteClass(criticite: string): string {
    switch (criticite?.toUpperCase()) {
      case 'C1': return 'badge-danger';
      case 'C2': return 'badge-warning';
      case 'C3': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  // Formater les intervenants pour l'affichage
  formatIntervenants(intervention: InterventionCurative): string {
    if (intervention.intervenants && intervention.intervenants.length > 0) {
      return intervention.intervenants.map((i: any) => i.nom || i).join(', ');
    }
    return intervention.intervenant || '';
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ==================== GESTION DES FICHIERS ====================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  getFileDownloadUrl(id: number | null | undefined): string {
    if (!id) return '';
    return this.interventionCurativeService.getFileDownloadUrl(id);
  }

  uploadFileAfterSave(interventionId: number): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.interventionCurativeService.uploadFile(interventionId, this.selectedFile).subscribe(
      () => {
        this.uploading = false;
        alert('Intervention et fichier sauvegardés avec succès');
        this.closeModal();
        this.getAllInterventions();
      },
      (error) => {
        this.uploading = false;
        console.error('Erreur upload fichier', error);
        alert('Intervention sauvegardée mais erreur lors de l\'upload du fichier');
        this.closeModal();
        this.getAllInterventions();
      }
    );
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichierIntervention') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  deleteExistingFile(): void {
    if (!this.editingInterventionId) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      this.interventionCurativeService.deleteFile(this.editingInterventionId).subscribe(
        () => {
          this.existingFile = null;
          this.existingFileName = null;
          alert('Fichier supprimé avec succès');
        },
        (error) => {
          console.error('Erreur suppression fichier', error);
          alert('Erreur lors de la suppression du fichier');
        }
      );
    }
  }
}
