import { environment } from 'environments/environment';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { InterventionPreventiveService } from '../../Services/intervention-preventive.service';
import { NotificationAppService } from '../../Services/notification.service';
import { InterventionPreventive, IntervenantPreventif, StatutInterventionPreventive } from '../../Model/InterventionPreventive';
import { ClientService, Client } from '../../Services/client.service';
import { PRODUIT_LIST } from '../../Model/NomProduit';
import { PermissionService } from '../../Services/permission.service';

@Component({
  selector: 'app-afficher-intervention-preventive',
  templateUrl: './afficher-intervention-preventive.component.html',
  styleUrls: ['./afficher-intervention-preventive.component.scss']
})
export class AfficherInterventionPreventiveComponent implements OnInit {
  clients: Client[] = [];

  interventions: InterventionPreventive[] = [];
  interventionForm: FormGroup;
  showModal = false;
  showDeleteModal = false;
  isEditMode = false;
  currentInterventionId: number | null = null;
  searchTerm: string = '';
  interventionToDelete: InterventionPreventive | null = null;

  nomProduitOptions = PRODUIT_LIST;

  // Variables pour gestion des fichiers
  selectedFile: File | null = null;
  existingFile: string | null = null;
  existingFileName: string | null = null;
  uploading: boolean = false;

  // Variables pour gestion des rôles
  currentUserRole: string = '';
  currentEditingStatut: StatutInterventionPreventive | null = null;
  StatutInterventionPreventive = StatutInterventionPreventive;

  // Variables pour utilisateurs assignés
  userSearchQuery: string = '';
  allUsers: any[] = [];
  filteredAssignableUsers: any[] = [];
  assignedUsers: any[] = [];

  // Contrats charges pour auto-remplissage
  allContrats: any[] = [];
  nbInterventionsAutoFilled = false;

  // Variables pour sous-popup technique
  showTechSubPopup = false;
  techSubPopupLineIndex: number | null = null;
  techSubForm: FormGroup;
  techSelectedFile: File | null = null;

  constructor(
    private interventionPreventiveService: InterventionPreventiveService,
    private fb: FormBuilder,
    private http: HttpClient,
    private notificationService: NotificationAppService,
    private clientService: ClientService,
    public permissionService: PermissionService) {
    this.initForm();
    this.techSubForm = this.fb.group({
      dateIntervention: [''],
      dateRapportPreventive: [''],
      techIntervenants: this.fb.array([this.fb.control('')]),
      remarque: ['']
    });
  }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.loadCurrentUserRole();
    this.loadInterventions();
    this.loadAllUsers();
    this.loadAllContrats();
  }

  loadCurrentUserRole(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.currentUserRole = user.role || '';
      console.log('Current user role:', this.currentUserRole);
    }
  }

  // Charge tous les contrats pour le match client+produit
  loadAllContrats(): void {
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.get<any[]>(`${environment.apiUrl}/Contrat/all`, { headers }).subscribe({
      next: (data) => {
        this.allContrats = data;
        // Abonner les watchers une fois les contrats charges
        this.watchClientAndProduit();
      },
      error: () => { this.allContrats = []; this.watchClientAndProduit(); }
    });
  }

  // Quand nomClient ET nomProduit sont definis, cherche le contrat et pre-remplit nbInterventionsParAn
  watchClientAndProduit(): void {
    const recheck = () => {
      const client  = this.interventionForm.get('nomClient')?.value;
      const produit = this.interventionForm.get('nomProduit')?.value;
      if (!client || !produit) { this.nbInterventionsAutoFilled = false; return; }

      const contrat = this.allContrats.find(c =>
        c.client === client && c.nomProduit === produit
      );
      if (contrat && contrat.nbInterventionsPreventives) {
        this.interventionForm.patchValue(
          { nbInterventionsParAn: String(contrat.nbInterventionsPreventives) },
          { emitEvent: false }
        );
        this.nbInterventionsAutoFilled = true;
      } else {
        this.nbInterventionsAutoFilled = false;
      }
    };

    this.interventionForm.get('nomClient')!.valueChanges.subscribe(() => recheck());
    this.interventionForm.get('nomProduit')!.valueChanges.subscribe(() => recheck());
  }

  // ==================== GESTION DES RÔLES ====================

  isAdmin(): boolean {
    return this.currentUserRole === 'ROLE_ADMINISTRATEUR';
  }

  isTechnique(): boolean {
    return this.currentUserRole === 'ROLE_TECHNIQUE';
  }

  isSuperAdmin(): boolean {
    return this.currentUserRole === 'ROLE_SUPER_ADMIN';
  }

  canEditAdminFields(): boolean {
    // Le technique ne peut JAMAIS modifier les champs admin
    if (this.isTechnique()) return false;
    // Si statut TERMINE, personne ne peut modifier
    if (this.currentEditingStatut === StatutInterventionPreventive.TERMINE) return false;
    // Sinon, l'admin (ou tout autre rôle non-technique) peut modifier
    return true;
  }

  /** Statuts où la saisie technique (sous-popup) est autorisée */
  private isStatutAllowingTechSaisie(): boolean {
    return this.currentEditingStatut === StatutInterventionPreventive.EN_ATTENTE_INTERVENTION
      || this.currentEditingStatut === StatutInterventionPreventive.EN_COURS;
  }

  /** Bouton 🔧 à côté de chaque période → ouvre la 2e popup (technique) */
  canShowTechSubPopupButton(): boolean {
    if (!this.isStatutAllowingTechSaisie()) return false;
    return this.isTechnique() || this.isSuperAdmin();
  }

  canEditTechFields(): boolean {
    // L'admin classique ne modifie pas les champs techniques
    if (this.isAdmin()) return false;
    if (this.currentEditingStatut === StatutInterventionPreventive.TERMINE) return false;
    if (this.isTechnique() || this.isSuperAdmin()) {
      return this.isStatutAllowingTechSaisie();
    }
    return false;
  }

  // Variables pour popup de détail
  selectedIntervention: InterventionPreventive | null = null;
  showDetailPopup = false;

  // États des accordéons
  isOpenPlanifier = true;
  isOpenTerminees = false;
  isOpenRetard = true;

  // Variables pour la pagination (10 par page pour le tableau compact)
  pageSize = 10;
  pageAPlanifier = 1;
  pageTerminees = 1;
  pageEnRetard = 1;

  // ── Helper : vérifie si une ligne de période est "en retard" ────────────────
  // Une ligne est en retard si : periodeA < aujourd'hui ET dateIntervention OU dateRapportPreventive est vide
  private isPeriodeLigneEnRetard(ligne: any): boolean {
    if (!ligne) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodeA = ligne.periodeA ? new Date(ligne.periodeA) : null;
    if (!periodeA || periodeA >= today) return false;
    // La date de fin est dépassée : vérifier si les champs tech sont vides
    const dateIntervention = ligne.dateIntervention;
    const dateRapport = ligne.dateRapportPreventive;
    return !dateIntervention || !dateRapport;
  }

  // Vérifie si UNE INTERVENTION a au moins une ligne de période en retard
  isInterventionEnRetard(intervention: InterventionPreventive): boolean {
    if (intervention.statut === StatutInterventionPreventive.TERMINE) return false;
    const lignes = this.buildAllPeriodeLines(intervention);
    return lignes.some(l => this.isPeriodeLigneEnRetard(l));
  }

  // ── Méthodes de groupement par bloc ──────────────────────────────────────
  private getFilteredInterventions(): InterventionPreventive[] {
    if (!this.searchTerm) return this.interventions;
    const term = this.searchTerm.toLowerCase();
    return this.interventions.filter(i =>
      i.nomClient?.toLowerCase().includes(term) ||
      i.emailCommercial?.toLowerCase().includes(term)
    );
  }

  // Bloc 1 : À Planifier (EN_ATTENTE + EN_COURS + CREE, EXCLUANT ceux en retard)
  // Triés par date de début de période (periodeDe) la plus proche en premier
  getAPlanifierInterventions(): InterventionPreventive[] {
    const filtered = this.getFilteredInterventions().filter(i =>
      (i.statut === StatutInterventionPreventive.EN_ATTENTE_INTERVENTION ||
        i.statut === StatutInterventionPreventive.EN_COURS ||
        i.statut === StatutInterventionPreventive.CREE ||
        !i.statut) &&
      !this.isInterventionEnRetard(i)
    );

    // Trier par la date periodeDe de la première ligne de période (la plus proche en haut)
    return filtered.sort((a, b) => {
      const getEarliestDe = (intervention: InterventionPreventive): number => {
        const lignes = this.buildAllPeriodeLines(intervention);
        if (lignes.length === 0) return Number.MAX_SAFE_INTEGER;
        const firstDe = lignes[0].periodeDe;
        if (!firstDe) return Number.MAX_SAFE_INTEGER;
        return new Date(firstDe).getTime();
      };
      return getEarliestDe(a) - getEarliestDe(b);
    });
  }

  // Bloc 2 : Terminées (statut TERMINE)
  getTermineesInterventions(): InterventionPreventive[] {
    return this.getFilteredInterventions().filter(i =>
      i.statut === StatutInterventionPreventive.TERMINE
    );
  }

  // Bloc 3 (conditionnel) : En Retard (periodeA dépassée ET champs tech non remplis)
  getEnRetardInterventions(): InterventionPreventive[] {
    return this.getFilteredInterventions().filter(i =>
      i.statut !== StatutInterventionPreventive.TERMINE &&
      this.isInterventionEnRetard(i)
    );
  }

  getAPlanifierCount(): number { return this.getAPlanifierInterventions().length; }
  getTermineesCount(): number { return this.getTermineesInterventions().length; }
  getEnRetardCount(): number { return this.getEnRetardInterventions().length; }
  hasEnRetard(): boolean { return this.getEnRetardCount() > 0; }

  // ── Pagination ────────────────────────────────────────────────────────────
  getPagedAPlanifier(): InterventionPreventive[] {
    const all = this.getAPlanifierInterventions();
    const start = (this.pageAPlanifier - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  getPagedTerminees(): InterventionPreventive[] {
    const all = this.getTermineesInterventions();
    const start = (this.pageTerminees - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  getPagedEnRetard(): InterventionPreventive[] {
    const all = this.getEnRetardInterventions();
    const start = (this.pageEnRetard - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  getTotalPagesAPlanifier(): number { return Math.ceil(this.getAPlanifierCount() / this.pageSize) || 1; }
  getTotalPagesTerminees(): number { return Math.ceil(this.getTermineesCount() / this.pageSize) || 1; }
  getTotalPagesEnRetard(): number { return Math.ceil(this.getEnRetardCount() / this.pageSize) || 1; }

  getPagesArray(total: number): number[] { return Array.from({ length: total }, (_, i) => i + 1); }

  // ── Popup de détail ────────────────────────────────────────────────────────
  openDetailPopup(intervention: InterventionPreventive): void {
    this.selectedIntervention = intervention;
    this.showDetailPopup = true;
  }

  closeDetailPopup(): void {
    this.showDetailPopup = false;
    this.selectedIntervention = null;
  }

  // Construit un tableau unifié de lignes de période depuis :
  //  - backend periodeLignes (nouveau format)
  //  - ou champs plats (ancien format)
  buildAllPeriodeLines(intervention: InterventionPreventive | null): any[] {
    if (!intervention) return [];

    // Priorité 1 : tableau periodeLignes du backend
    const backend = (intervention as any).periodeLignes;
    if (Array.isArray(backend) && backend.length > 0) {
      return backend;
    }

    // Priorité 2 : champs plats (ancien format) → construire une ligne
    const hasFlat = intervention.periodeDe || intervention.periodeA ||
      intervention.periodeRecommandeDe || intervention.periodeRecommandeA ||
      intervention.dateInterventionExigee;

    if (hasFlat) {
      return [{
        periodeDe: intervention.periodeDe,
        periodeA: intervention.periodeA,
        periodeRecommandeDe: intervention.periodeRecommandeDe,
        periodeRecommandeA: intervention.periodeRecommandeA,
        dateInterventionExigee: intervention.dateInterventionExigee,
        dateIntervention: intervention.dateIntervention || null,
        dateRapportPreventive: intervention.dateRapportPreventive || null,
      }];
    }

    return [];
  }

  // Ancien alias (gardé pour compatibilité si utilisé ailleurs)
  getPeriodeLignes(intervention: InterventionPreventive | null): any[] {
    return this.buildAllPeriodeLines(intervention);
  }


  getStatutLabel(statut: StatutInterventionPreventive | undefined): string {
    switch (statut) {
      case StatutInterventionPreventive.CREE:
        return 'Créé';
      case StatutInterventionPreventive.EN_ATTENTE_INTERVENTION:
        return 'En attente d\'intervention';
      case StatutInterventionPreventive.EN_COURS:
        return 'En cours';
      case StatutInterventionPreventive.TERMINE:
        return 'Terminé';
      default:
        return '-';
    }
  }

  getStatutBadgeClass(statut: StatutInterventionPreventive | undefined): string {
    switch (statut) {
      case StatutInterventionPreventive.CREE:
        return 'badge-warning';
      case StatutInterventionPreventive.EN_ATTENTE_INTERVENTION:
        return 'badge-info';
      case StatutInterventionPreventive.EN_COURS:
        return 'badge-primary';
      case StatutInterventionPreventive.TERMINE:
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }

  initForm(): void {
    this.interventionForm = this.fb.group({
      nomClient: [''],
      nbInterventionsParAn: [''],
      periodeLines: this.fb.array([this.createPeriodeLine()]),
      dateIntervention: [''],
      dateRapportPreventive: [''],
      intervenants: this.fb.array([]),
      statut: [StatutInterventionPreventive.CREE],
      emailCommercial: [''],
      ccMail: this.fb.array([]),
      nomProduit: ['']
    });
  }

  createPeriodeLine(): FormGroup {
    return this.fb.group({
      periodeDe: [''],
      periodeA: [''],
      periodeRecommandeDe: [''],
      periodeRecommandeA: [''],
      dateInterventionExigee: ['']
    });
  }

  get periodeLinesArray(): FormArray {
    return this.interventionForm.get('periodeLines') as FormArray;
  }

  addPeriodeLine(): void {
    this.periodeLinesArray.push(this.createPeriodeLine());
  }

  removePeriodeLine(index: number): void {
    if (this.periodeLinesArray.length > 1) {
      this.periodeLinesArray.removeAt(index);
    }
  }

  get intervenants(): FormArray {
    return this.interventionForm.get('intervenants') as FormArray;
  }

  get ccMailArray(): FormArray {
    return this.interventionForm.get('ccMail') as FormArray;
  }

  addCcMail(): void {
    this.ccMailArray.push(this.fb.control(''));
  }

  removeCcMail(index: number): void {
    this.ccMailArray.removeAt(index);
  }

  createIntervenantControl(): FormGroup {
    return this.fb.group({
      nom: ['']
    });
  }

  addIntervenant(): void {
    this.intervenants.push(this.createIntervenantControl());
  }

  removeIntervenant(index: number): void {
    if (this.intervenants.length > 1) {
      this.intervenants.removeAt(index);
    }
  }

  // ── Utilisateurs assignés ───────────────────────────────────────────────────
  loadAllUsers(): void {
    // Ne charger les utilisateurs que si l'utilisateur peut modifier les champs admin
    if (!this.canEditAdminFields()) {
      console.log('ℹ️ Skipping user load - user cannot edit admin fields');
      this.allUsers = [];
      this.updateFilteredAssignableUsers();
      return;
    }

    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.get<any>(`${environment.apiUrl}/Users`, { headers }).subscribe({
      next: (response) => { 
        console.log('✅ Users loaded from API:', response);
        // Handle both array and object responses
        if (Array.isArray(response)) {
          this.allUsers = response;
        } else if (response && typeof response === 'object') {
          // Si c'est un objet, chercher un tableau à l'intérieur
          this.allUsers = response.users || response.data || Object.values(response).flat();
        } else {
          this.allUsers = [];
        }
        console.log('📊 Processed users:', this.allUsers);
        // ✅ UPDATE filteredAssignableUsers immediately after loading
        this.updateFilteredAssignableUsers();
      },
      error: (err) => { 
        console.error('❌ Error loading users:', err);
        this.allUsers = [];
        this.updateFilteredAssignableUsers();
      }
    });
  }

  // ✅ NEW: Method to update filtered users
  updateFilteredAssignableUsers(): void {
    this.filteredAssignableUsers = this.allUsers.filter(u => !this.assignedUsers.find(a => a.id === u.id));
    console.log('🔄 Filtered assignable users updated:', this.filteredAssignableUsers);
  }

  getUnassignedUsers(): any[] {
    return this.filteredAssignableUsers;
  }

  assignUserFromDropdown(event: any): void {
    const userId = Number(event.target.value);
    const user = this.allUsers.find(u => u.id === userId);
    if (user) {
      this.assignUser(user);
    }
    event.target.value = '';
  }

  assignUser(user: any): void {
    if (!this.assignedUsers.find(u => u.id === user.id)) {
      this.assignedUsers.push(user);
    }
    this.userSearchQuery = '';
    this.updateFilteredAssignableUsers(); // ✅ Update instead of clearing
  }

  removeAssignedUser(index: number): void {
    this.assignedUsers.splice(index, 1);
    this.updateFilteredAssignableUsers(); // ✅ Update after removing
  }

  // Appele par app-searchable-user-select via (userSelected)
  assignUserById(userId: string | number): void {
    const id = Number(userId);
    const user = this.allUsers.find(u => u.id === id);
    if (user) {
      this.assignUser(user);
    }
  }

  // ── Sous-popup Technique ─────────────────────────────────────────────
  get techIntervenantsArray(): FormArray {
    return this.techSubForm.get('techIntervenants') as FormArray;
  }

  addTechIntervenant(): void {
    this.techIntervenantsArray.push(this.fb.control(''));
  }

  removeTechIntervenant(index: number): void {
    if (this.techIntervenantsArray.length > 1) {
      this.techIntervenantsArray.removeAt(index);
    }
  }

  onTechFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.techSelectedFile = input.files[0];
    }
  }

  clearTechFile(): void {
    this.techSelectedFile = null;
  }

  openTechSubPopup(lineIndex: number): void {
    this.techSubPopupLineIndex = lineIndex;
    // Pré-remplir depuis la ligne si elle a déjà des infos
    const line = this.periodeLinesArray.at(lineIndex);
    // Reset form
    this.techSubForm.patchValue({
      dateIntervention: line?.get('dateIntervention')?.value || '',
      dateRapportPreventive: line?.get('dateRapportPreventive')?.value || '',
      remarque: line?.get('remarque')?.value || ''
    });
    // Reset intervenants et pré-remplir depuis la ligne
    while (this.techIntervenantsArray.length) { this.techIntervenantsArray.removeAt(0); }
    const savedIntervenants = line?.get('techIntervenants')?.value;
    if (savedIntervenants && savedIntervenants.length > 0) {
      savedIntervenants.forEach((interv: any) => {
        this.techIntervenantsArray.push(this.fb.control(interv.nom || interv));
      });
    } else {
      this.techIntervenantsArray.push(this.fb.control(''));
    }
    this.techSelectedFile = null;
    this.showTechSubPopup = true;
  }

  closeTechSubPopup(): void {
    this.showTechSubPopup = false;
    this.techSubPopupLineIndex = null;
  }

  saveTechSubLine(): void {
    if (this.techSubPopupLineIndex === null) return;
    const line = this.periodeLinesArray.at(this.techSubPopupLineIndex) as FormGroup;
    const techValues = this.techSubForm.value;
    // Stocker les valeurs techniques dans la ligne de période
    if (!line.get('dateIntervention')) {
      line.addControl('dateIntervention', this.fb.control(techValues.dateIntervention || ''));
    } else {
      line.get('dateIntervention')!.setValue(techValues.dateIntervention || '');
    }
    if (!line.get('dateRapportPreventive')) {
      line.addControl('dateRapportPreventive', this.fb.control(techValues.dateRapportPreventive || ''));
    } else {
      line.get('dateRapportPreventive')!.setValue(techValues.dateRapportPreventive || '');
    }
    // Stocker les intervenants techniques dans la ligne de période
    const techIntervenants = techValues.techIntervenants
      ? techValues.techIntervenants.filter((nom: string) => nom && nom.trim() !== '').map((nom: string) => ({ nom }))
      : [];
    if (!line.get('techIntervenants')) {
      line.addControl('techIntervenants', this.fb.control(techIntervenants));
    } else {
      line.get('techIntervenants')!.setValue(techIntervenants);
    }
    // Stocker la remarque dans la ligne de période
    if (!line.get('remarque')) {
      line.addControl('remarque', this.fb.control(techValues.remarque || ''));
    } else {
      line.get('remarque')!.setValue(techValues.remarque || '');
    }
    // Stocker le fichier technique sélectionné pour cette ligne
    const techFile = this.techSelectedFile;
    const lineIndex = this.techSubPopupLineIndex;
    this.closeTechSubPopup();
    // Sauvegarder automatiquement, puis uploader le fichier si nécessaire
    this.saveInterventionThenUploadTechFile(techFile, lineIndex);
  }

  /**
   * Calcule automatiquement le statut technique en fonction du nombre
   * de lignes de période ayant une dateIntervention renseignée.
   *   0 remplies → EN_ATTENTE_INTERVENTION
   *   partiellement remplies → EN_COURS
   *   toutes remplies → TERMINE
   */
  computeTechStatut(): StatutInterventionPreventive {
    const lines = this.periodeLinesArray.controls;
    if (!lines || lines.length === 0) return StatutInterventionPreventive.EN_ATTENTE_INTERVENTION;
    const total = lines.length;
    const filled = lines.filter((c: any) => {
      const v = c.value;
      return v.dateIntervention && v.dateIntervention.toString().trim() !== '';
    }).length;
    if (filled === 0) return StatutInterventionPreventive.EN_ATTENTE_INTERVENTION;
    if (filled < total) return StatutInterventionPreventive.EN_COURS;
    return StatutInterventionPreventive.TERMINE;
  }

  // Sauvegarde l'intervention puis upload le fichier technique sur la bonne ligne de période
  saveInterventionThenUploadTechFile(techFile: File | null, lineIndex: number): void {
    const formValue = this.interventionForm.value;
    const firstLine = this.periodeLinesArray.length > 0 ? this.periodeLinesArray.at(0).value : {};
    let newStatut = formValue.statut || StatutInterventionPreventive.CREE;

    if ((this.isAdmin() || this.isSuperAdmin()) && !this.isEditMode) {
      newStatut = StatutInterventionPreventive.EN_ATTENTE_INTERVENTION;
    } else if ((this.isTechnique() || this.isSuperAdmin()) && this.isStatutAllowingTechSaisie()) {
      newStatut = this.computeTechStatut();
    }

    const periodeLignes = this.periodeLinesArray.controls.map((ctrl: any) => {
      const v = ctrl.value;
      return {
        periodeDe: v.periodeDe || null,
        periodeA: v.periodeA || null,
        periodeRecommandeDe: v.periodeRecommandeDe || null,
        periodeRecommandeA: v.periodeRecommandeA || null,
        dateInterventionExigee: v.dateInterventionExigee || null,
        dateIntervention: v.dateIntervention || null,
        dateRapportPreventive: v.dateRapportPreventive || null,
        intervenants: v.techIntervenants || [],
        remarque: v.remarque || null,
      };
    });

    const intervention: InterventionPreventive = {
      nomClient: formValue.nomClient,
      nbInterventionsParAn: formValue.nbInterventionsParAn,
      periodeDe: firstLine.periodeDe || null,
      periodeA: firstLine.periodeA || null,
      periodeRecommandeDe: firstLine.periodeRecommandeDe || null,
      periodeRecommandeA: firstLine.periodeRecommandeA || null,
      dateInterventionExigee: firstLine.dateInterventionExigee || null,
      dateIntervention: firstLine.dateIntervention || formValue.dateIntervention || null,
      dateRapportPreventive: firstLine.dateRapportPreventive || formValue.dateRapportPreventive || null,
      intervenants: formValue.intervenants ? formValue.intervenants.filter((i: IntervenantPreventif) => i.nom && i.nom.trim() !== '') : [],
      periodeLignes: periodeLignes,
      statut: newStatut,
      emailCommercial: formValue.emailCommercial,
      ccMail: formValue.ccMail ? formValue.ccMail.filter((email: string) => email && email.trim() !== '') : [],
      assignedUsers: this.assignedUsers.filter(u => u && u.id != null).map(u => ({ id: u.id }))
    };

    if (this.isEditMode && this.currentInterventionId) {
      this.interventionPreventiveService.updateInterventionPreventive(this.currentInterventionId, intervention).subscribe({
        next: (saved: InterventionPreventive) => {
          if (techFile && saved.periodeLignes && saved.periodeLignes[lineIndex]) {
            const periodeLigneId = saved.periodeLignes[lineIndex].periodeLigneId;
            if (periodeLigneId) {
              this.interventionPreventiveService.uploadPeriodeLigneFile(periodeLigneId, techFile).subscribe({
                next: () => { this.loadInterventions(); this.closeModal(); },
                error: (err) => { console.error('Erreur upload fichier technique', err); this.loadInterventions(); this.closeModal(); }
              });
            } else {
              this.loadInterventions(); this.closeModal();
            }
          } else {
            this.loadInterventions(); this.closeModal();
          }
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour', err);
          console.error('Payload envoyé:', JSON.stringify(intervention, null, 2));
          if (err.error) console.error('Réponse serveur:', JSON.stringify(err.error, null, 2));
          alert('Erreur mise à jour: ' + (err.error?.error || err.error?.message || err.message || JSON.stringify(err.error)));
        }
      });
    } else {
      this.interventionPreventiveService.addInterventionPreventive(intervention).subscribe({
        next: (saved: InterventionPreventive) => {
          if (techFile && saved.periodeLignes && saved.periodeLignes[lineIndex]) {
            const periodeLigneId = saved.periodeLignes[lineIndex].periodeLigneId;
            if (periodeLigneId) {
              this.interventionPreventiveService.uploadPeriodeLigneFile(periodeLigneId, techFile).subscribe({
                next: () => { this.loadInterventions(); this.closeModal(); },
                error: (err) => { console.error('Erreur upload fichier technique', err); this.loadInterventions(); this.closeModal(); }
              });
            } else {
              this.loadInterventions(); this.closeModal();
            }
          } else {
            this.loadInterventions(); this.closeModal();
          }
        },
        error: (err) => { console.error('Erreur lors de l\'ajout', err); }
      });
    }
  }

  loadInterventions(): void {
    this.interventionPreventiveService.getAllInterventionsPreventives().subscribe({
      next: (data) => {
        this.interventions = data.reverse();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des interventions préventives', err);
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentInterventionId = null;
    this.currentEditingStatut = StatutInterventionPreventive.CREE;
    this.interventionForm.reset();
    this.interventionForm.patchValue({ statut: StatutInterventionPreventive.CREE });
    // Réinitialiser periodeLines
    while (this.periodeLinesArray.length) { this.periodeLinesArray.removeAt(0); }
    this.periodeLinesArray.push(this.createPeriodeLine());
    this.intervenants.clear();
    this.addIntervenant();
    // Vider et initialiser ccMail
    while (this.ccMailArray.length) { this.ccMailArray.removeAt(0); }
    this.addCcMail();
    // Réinitialiser utilisateurs assignés
    this.assignedUsers = [];
    this.userSearchQuery = '';
    this.filteredAssignableUsers = [];
    // ✅ CHARGER LES UTILISATEURS POUR LE DROPDOWN
    this.loadAllUsers();
    // Réinitialiser les variables de fichier
    this.selectedFile = null;
    this.existingFile = null;
    this.existingFileName = null;
    this.showModal = true;
  }

  openEditModal(intervention: InterventionPreventive): void {
    // Recharger le rôle à chaque ouverture pour s'assurer qu'il est à jour
    this.loadCurrentUserRole();

    this.isEditMode = true;
    this.currentInterventionId = intervention.interventionPreventiveId;
    this.currentEditingStatut = intervention.statut || StatutInterventionPreventive.CREE;

    console.log('Opening edit modal:');
    console.log('- Current user role:', this.currentUserRole);
    console.log('- Intervention statut:', intervention.statut);
    console.log('- currentEditingStatut:', this.currentEditingStatut);
    console.log('- canEditAdminFields:', this.canEditAdminFields());
    console.log('- canEditTechFields:', this.canEditTechFields());

    this.interventionForm.patchValue({
      nomClient: intervention.nomClient,
      nbInterventionsParAn: intervention.nbInterventionsParAn,
      dateIntervention: intervention.dateIntervention,
      dateRapportPreventive: intervention.dateRapportPreventive,
      statut: intervention.statut || StatutInterventionPreventive.CREE,
      emailCommercial: intervention.emailCommercial || '',
      nomProduit: intervention.nomProduit || ''
    });
    // Charger periodeLines depuis periodeLignes du backend (ou créer 1 ligne par défaut)
    while (this.periodeLinesArray.length) { this.periodeLinesArray.removeAt(0); }
    const lignes = (intervention as any).periodeLignes;
    if (lignes && lignes.length > 0) {
      lignes.forEach((l: any) => {
        this.periodeLinesArray.push(this.fb.group({
          periodeDe: [l.periodeDe || ''],
          periodeA: [l.periodeA || ''],
          periodeRecommandeDe: [l.periodeRecommandeDe || ''],
          periodeRecommandeA: [l.periodeRecommandeA || ''],
          dateInterventionExigee: [l.dateInterventionExigee || ''],
          dateIntervention: [l.dateIntervention || ''],
          dateRapportPreventive: [l.dateRapportPreventive || ''],
          techIntervenants: [l.intervenants || []],
          remarque: [l.remarque || '']
        }));
      });
    } else {
      // Rétro-compat : lire les champs plats s'ils existent
      this.periodeLinesArray.push(this.fb.group({
        periodeDe: [intervention.periodeDe || ''],
        periodeA: [intervention.periodeA || ''],
        periodeRecommandeDe: [intervention.periodeRecommandeDe || ''],
        periodeRecommandeA: [intervention.periodeRecommandeA || ''],
        dateInterventionExigee: [intervention.dateInterventionExigee || '']
      }));
    }
    // Charger utilisateurs assignés
    this.assignedUsers = intervention.assignedUsers || [];

    // Charger ccMail
    while (this.ccMailArray.length) {
      this.ccMailArray.removeAt(0);
    }
    if (intervention.ccMail && intervention.ccMail.length > 0) {
      intervention.ccMail.forEach(email => {
        this.ccMailArray.push(this.fb.control(email));
      });
    } else {
      this.addCcMail();
    }

    this.intervenants.clear();
    if (intervention.intervenants && intervention.intervenants.length > 0) {
      intervention.intervenants.forEach(intervenant => {
        this.intervenants.push(this.fb.group({
          nom: [intervenant.nom]
        }));
      });
    } else {
      this.addIntervenant();
    }

    // Charger info fichier existant
    this.selectedFile = null;
    this.existingFile = intervention.fichier || null;
    this.existingFileName = intervention.fichierOriginalName || null;
    // ✅ CHARGER LES UTILISATEURS POUR LE DROPDOWN
    this.loadAllUsers();
    this.showModal = true;
  }

  saveIntervention(): void {
    const formValue = this.interventionForm.value;

    // Lire les dates depuis la 1ère ligne du FormArray periodeLines
    const firstLine = this.periodeLinesArray.length > 0 ? this.periodeLinesArray.at(0).value : {};

    // Déterminer le nouveau statut basé sur le rôle et l'action
    let newStatut = formValue.statut || StatutInterventionPreventive.CREE;

    if ((this.isAdmin() || this.isSuperAdmin()) && !this.isEditMode) {
      // Admin ou Super Admin crée une nouvelle intervention -> statut EN_ATTENTE_INTERVENTION
      newStatut = StatutInterventionPreventive.EN_ATTENTE_INTERVENTION;
    } else if ((this.isTechnique() || this.isSuperAdmin()) && this.isStatutAllowingTechSaisie()) {
      newStatut = this.computeTechStatut();
    }

    // Construire le tableau periodeLignes à partir du FormArray
    const periodeLignes = this.periodeLinesArray.controls.map((ctrl: any) => {
      const v = ctrl.value;
      return {
        periodeDe: v.periodeDe || null,
        periodeA: v.periodeA || null,
        periodeRecommandeDe: v.periodeRecommandeDe || null,
        periodeRecommandeA: v.periodeRecommandeA || null,
        dateInterventionExigee: v.dateInterventionExigee || null,
        dateIntervention: v.dateIntervention || null,
        dateRapportPreventive: v.dateRapportPreventive || null,
        intervenants: v.techIntervenants || [],
        remarque: v.remarque || null,
      };
    });

    const intervention: InterventionPreventive = {
      nomClient: formValue.nomClient,
      nbInterventionsParAn: formValue.nbInterventionsParAn,
      // Dates de période lues depuis la 1ère ligne du FormArray (compatibilité ancien format)
      periodeDe: firstLine.periodeDe || null,
      periodeA: firstLine.periodeA || null,
      periodeRecommandeDe: firstLine.periodeRecommandeDe || null,
      periodeRecommandeA: firstLine.periodeRecommandeA || null,
      dateInterventionExigee: firstLine.dateInterventionExigee || null,
      // Dates techniques depuis le 1ère ligne si remplies, sinon depuis formValue
      dateIntervention: firstLine.dateIntervention || formValue.dateIntervention || null,
      dateRapportPreventive: firstLine.dateRapportPreventive || formValue.dateRapportPreventive || null,
      intervenants: formValue.intervenants ? formValue.intervenants.filter((i: IntervenantPreventif) => i.nom && i.nom.trim() !== '') : [],
      periodeLignes: periodeLignes,
      statut: newStatut,
      emailCommercial: formValue.emailCommercial,
      ccMail: formValue.ccMail ? formValue.ccMail.filter((email: string) => email && email.trim() !== '') : [],
      assignedUsers: this.assignedUsers.filter(u => u && u.id != null).map(u => ({ id: u.id })),
      nomProduit: formValue.nomProduit || null
    };

    if (this.isEditMode && this.currentInterventionId) {
      this.interventionPreventiveService.updateInterventionPreventive(this.currentInterventionId, intervention).subscribe({
        next: () => {
          // Upload le fichier si sélectionné
          if (this.selectedFile) {
            this.uploadFileAfterSave(this.currentInterventionId!);
          } else {
            this.loadInterventions();
            this.closeModal();
          }
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour', err);
          console.error('Payload envoyé:', JSON.stringify(intervention, null, 2));
          if (err.error) console.error('Réponse serveur:', JSON.stringify(err.error, null, 2));
          alert('Erreur mise à jour: ' + (err.error?.error || err.error?.message || err.message || JSON.stringify(err.error)));
        }
      });
    } else {
      this.interventionPreventiveService.addInterventionPreventive(intervention).subscribe({
        next: (newIntervention: InterventionPreventive) => {
          // Upload le fichier si sélectionné
          if (this.selectedFile && newIntervention.interventionPreventiveId) {
            this.uploadFileAfterSave(newIntervention.interventionPreventiveId);
          } else {
            this.loadInterventions();
            this.closeModal();
          }
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout', err);
        }
      });
    }
  }


  confirmDelete(intervention: InterventionPreventive): void {
    this.interventionToDelete = intervention;
    this.showDeleteModal = true;
  }

  deleteIntervention(): void {
    if (this.interventionToDelete && this.interventionToDelete.interventionPreventiveId) {
      this.interventionPreventiveService.deleteInterventionPreventive(this.interventionToDelete.interventionPreventiveId).subscribe({
        next: () => {
          this.loadInterventions();
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
        }
      });
    }
  }

  search(): void {
    // Réinitialiser les pages lors de la recherche
    this.pageAPlanifier = 1;
    this.pageTerminees = 1;
    this.pageEnRetard = 1;
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      this.interventionPreventiveService.searchInterventionsPreventives(this.searchTerm).subscribe({
        next: (data) => {
          this.interventions = data.reverse();
        },
        error: (err) => {
          console.error('Erreur lors de la recherche', err);
        }
      });
    } else {
      this.loadInterventions();
    }
  }

  formatDate(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  closeModal(): void {
    this.showModal = false;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.interventionToDelete = null;
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
    return this.interventionPreventiveService.getFileDownloadUrl(id);
  }

  getPeriodeLigneFileDownloadUrl(periodeLigneId: number | null | undefined): string {
    if (!periodeLigneId) return '';
    return this.interventionPreventiveService.getPeriodeLigneFileDownloadUrl(periodeLigneId);
  }

  uploadFileAfterSave(interventionId: number): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.interventionPreventiveService.uploadFile(interventionId, this.selectedFile).subscribe({
      next: () => {
        this.uploading = false;
        this.loadInterventions();
        this.closeModal();
      },
      error: (error) => {
        this.uploading = false;
        console.error('Erreur upload fichier', error);
        alert('Intervention sauvegardée mais erreur lors de l\'upload du fichier');
        this.loadInterventions();
        this.closeModal();
      }
    });
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fichierInterventionPreventive') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  deleteExistingFile(): void {
    if (!this.currentInterventionId) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      this.interventionPreventiveService.deleteFile(this.currentInterventionId).subscribe({
        next: () => {
          this.existingFile = null;
          this.existingFileName = null;
          alert('Fichier supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur suppression fichier', error);
          alert('Erreur lors de la suppression du fichier');
        }
      });
    }
  }
}

