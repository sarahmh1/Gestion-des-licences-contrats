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
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/AuthService';

@Component({
  selector: 'app-afficher-intervention-curative',
  templateUrl: './afficher-intervention-curative.component.html',
  styleUrls: ['./afficher-intervention-curative.component.scss']
})
export class AfficherInterventionCurativeComponent implements OnInit {
  clients: Client[] = [];
  allUsers: any[] = [];
  filteredAssignableUsers: any[] = [];
  assignedUsers: any[] = [];
  contrats: Contrat[] = [];
  searchTerm: string = '';
  interventions: InterventionCurative[] = [];
  filteredInterventions: InterventionCurative[] = [];

  // ── Filtres ──
  showFiltersPanel: boolean = false;
  filterStatut: string = '';     // '' | 'resolu' | 'enCours' | 'enAttente'
  filterClient: string = '';     // nom du client
  filterUser: string = '';       // id (string) de l'user assigné
  filterDateFrom: string = '';   // yyyy-mm-dd
  filterDateTo: string = '';     // yyyy-mm-dd

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedInterventions: InterventionCurative[] = [];

  // Master-detail
  selectedIntervention: InterventionCurative | null = null;

  // Modal
  showModal: boolean = false;
  isEditMode: boolean = false;
  interventionForm!: FormGroup;
  editingInterventionId: number | null = null;
  private editingSnapshot: InterventionCurative | null = null;
  isAssignedView: boolean = false;

  // Sous-popup (tech) pour utilisateur assigné
  showTechPopup: boolean = false;
  techForm!: FormGroup;
  techButtonLabel: string = 'Compléter l\'intervention';

  // Options
  criticiteOptions = ['C1', 'C2', 'C3', 'C4'];
  nomProduitOptions = PRODUIT_LIST;

  // Variables pour gestion des fichiers (popup principal)
  selectedFile: File | null = null;
  existingFile: string | null = null;
  existingFileName: string | null = null;
  uploading: boolean = false;

  // Variables pour gestion des fichiers (tech popup)
  techInterventionFiles: (File | null)[] = [null];
  techResolutionFile: File | null = null;

  constructor(
    private interventionCurativeService: InterventionCurativeService,
    private fb: FormBuilder,
    private clientService: ClientService,
    private contratService: ContratService,
    private userService: UserService,
    public permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService) { }

  /**
   * Récupère l'utilisateur courant sous forme { id } pour l'envoyer au backend.
   */
  private getCurrentUserRef(): { id: number } | null {
    const u = this.authService.getUser();
    if (!u) return null;
    const id = u.id ?? u.userId;
    return id ? { id } : null;
  }

  /**
   * Formate un objet User en "Prénom Nom" pour l'affichage.
   */
  formatUserName(user: any): string {
    if (!user) return '';
    const fn = (user.firstname || user.firstName || '').trim();
    const ln = (user.lastname || user.lastName || '').trim();
    const full = `${fn} ${ln}`.trim();
    return full || user.email || `User #${user.id}`;
  }

  /**
   * Chaîne vide / blanc invalide pour LocalDateTime côté Java → erreur Jackson 400.
   * - Tableaux Jackson [y,m,d,h,mi,?s]
   * - datetime-local sans secondes → HH:mm:ss
   * - ISO avec Z / offset évité pour LocalDateTime côté serveur (pas de champ zone).
   */
  private toBackendNullableDate(val: any): string | null {
    if (val === undefined || val === null) return null;

    if (Array.isArray(val)) {
      const nums = val.map(Number);
      const [y = NaN, mo = 1, d = 1, h = 0, mi = 0, s = 0] = nums;
      if (!Number.isFinite(y)) return null;
      const pad = (n: number) => String(Math.trunc(n)).padStart(2, '0');
      const moClamped = Math.min(12, Math.max(1, mo));
      const dClamped = Math.min(31, Math.max(1, d));
      return `${y}-${pad(moClamped)}-${pad(dClamped)}T${pad(h)}:${pad(mi)}:${pad(s)}`;
    }

    if (typeof val === 'string') {
      let t = val.trim();
      if (t === '') return null;
      t = t.replace(/\.\d{3,}(?=Z|[+-])/i, '');
      if (/Z$/i.test(t)) t = t.replace(/Z$/i, '');
      else t = t.replace(/[+-]\d{2}:\d{2}$/, '').replace(/[+-]\d{2}$/, '');
      t = t.trim();
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) return `${t}:00`;
      return t;
    }

    return null;
  }

  /** User peut être sérialisé comme nombre (Jackson @JsonIdentityInfo) ou { "@id": ... }. */
  private normalizeUserRef(ref: any): { id: number } | null {
    if (ref === undefined || ref === null) return null;
    if (typeof ref === 'number' && Number.isFinite(ref)) return { id: ref };
    const idRaw = typeof ref === 'object'
      ? (ref.id ?? ref.userId ?? ref.ID ?? ref['@id'])
      : undefined;
    if (idRaw == null || idRaw === '') return null;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return null;
    return { id };
  }

  /** Liste des utilisateurs assignés envoyable au PUT (Jackson peut renvoyer id seul ou { @id }). */
  private buildAssignedUsersPayload(): { id: number }[] {
    return (this.assignedUsers || [])
      .map(u => this.normalizeUserRef(u))
      .filter((x): x is { id: number } => !!x);
  }

  /**
   * Backend : délai = Integer nullable. Une chaîne vide "" provoque erreur Jackson 400 sur PUT.
   * Le snapshot du GET peut contenir contrat imbriqué — on l'ôte pour éviter des cycles / JSON invalides.
   * Les dates envoyées comme "" cassent aussi la désérialisation LocalDateTime.
   */
  private sanitizeUpdatePayload(payload: InterventionCurative): InterventionCurative {
    const p: any = { ...payload };
    delete p.contrat;

    const d = p.delaiResolution;
    if (d === '' || d === undefined || d === null) {
      delete p.delaiResolution;
    } else {
      const n = typeof d === 'number' ? d : parseInt(String(d), 10);
      if (Number.isFinite(n)) {
        p.delaiResolution = n;
      } else {
        delete p.delaiResolution;
      }
    }

    p.dateHeureDemande = this.toBackendNullableDate(p.dateHeureDemande) as any;
    p.dateHeureIntervention = this.toBackendNullableDate(p.dateHeureIntervention) as any;
    p.dateHeureResolution = this.toBackendNullableDate(p.dateHeureResolution) as any;

    const nu = this.normalizeUserRef(p.resoluByUser);
    if (nu) {
      p.resoluByUser = nu as any;
    } else if (p.resoluByUser !== undefined && p.resoluByUser !== null) {
      delete p.resoluByUser;
    }

    // assignedUsers en { id } seulement ; dédoublonnage (évite conflits @JsonIdentityInfo côté serveur)
    if (Array.isArray(p.assignedUsers)) {
      const seen = new Set<number>();
      p.assignedUsers = p.assignedUsers
        .map((u: any) => this.normalizeUserRef(u))
        .filter(Boolean)
        .filter((u: { id: number }) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        });
    }

    if (Array.isArray(p.sessions)) {
      p.sessions = p.sessions.map((s: any) => {
        const row: any = {
          sessionId: s.sessionId ?? null,
          resume: s.resume ?? null,
          dateHeureIntervention: this.toBackendNullableDate(s.dateHeureIntervention),
          dureeIntervention: (s.dureeIntervention == null || String(s.dureeIntervention).trim() === '')
            ? null
            : String(s.dureeIntervention).trim(),
          fichier: (s.fichier == null || s.fichier === '') ? null : s.fichier,
          fichierOriginalName:
            (s.fichierOriginalName == null || s.fichierOriginalName === '') ? null : s.fichierOriginalName,
        };
        const uref = this.normalizeUserRef(s.userAssigne);
        if (uref) row.userAssigne = uref;
        return row;
      });
    }

    if (Array.isArray(p.intervenants)) {
      p.intervenants = p.intervenants.map((inv: any) => ({
        intervenantId: inv?.intervenantId,
        nom: inv?.nom ?? '',
      }));
    }

    const allowedKeys = [
      'interventionCurativeId', 'ficheIntervention', 'nomClient', 'criticite', 'intervenant',
      'intervenants',
      // assignedUsers + resoluByUser avant sessions pour coller à l’ordre naturel Jackson (réduit les erreurs avec graphes répétés)
      'assignedUsers', 'resoluByUser',
      'sessions',
      'dateHeureDemande', 'dateHeureIntervention', 'dateHeureResolution',
      'dureeIntervention', 'modeIntervention', 'visAVisClient', 'enCoursDeResolution', 'resolu',
      'tachesEffectuees', 'probleme', 'delaiResolution', 'resume',
      'fichier', 'fichierOriginalName', 'nomProduit',
    ];
    const whitelisted: any = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(p, key)) {
        whitelisted[key] = p[key];
      }
    }
    return whitelisted as InterventionCurative;
  }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.loadAllUsers();
    this.contratService.getAllContrats().subscribe(data => this.contrats = data);
    this.initForm();
    this.initTechForm();
    this.watchNomClientAndProduit();
    this.getAllInterventions();

    // Si on arrive depuis une notification: ouvrir l'intervention en mode assigné
    this.route.queryParams.subscribe(params => {
      const id = params['openCurativeId'] != null ? Number(params['openCurativeId']) : null;
      if (!id) return;

      const tryOpen = () => {
        const found = this.interventions.find(x => Number(x.interventionCurativeId) === id);
        if (found) {
          this.openAssignedModal(found);
        }
      };

      // si déjà chargé
      if (this.interventions.length > 0) {
        tryOpen();
      } else {
        // fallback: charger puis ouvrir
        this.interventionCurativeService.getAllInterventionsCuratives().subscribe((data: InterventionCurative[]) => {
          this.interventions = data;
          this.filteredInterventions = data;
          this.calculatePagination();
          this.changePage(0);
          tryOpen();
        });
      }

      // nettoyer l'URL
      this.router.navigate([], { queryParams: { openCurativeId: null }, queryParamsHandling: 'merge' });
    });
  }

  // ── Utilisateurs assignés (même logique que l'intervention préventive) ──
  /**
   * `/Users/available-for-messaging` exclut toujours l'utilisateur connecté (inutile pour s'envoyer un message à soi-même).
   * Pour une affectation curative, l'auteur doit pouvoir se choisir — on réinjecte le user courant s'il est absent.
   */
  private mergeCurrentUserForAssignment(users: any[]): any[] {
    const list = Array.isArray(users) ? [...users] : [];
    const me = this.authService.getUser();
    if (!me) return list;
    const myId = me.id ?? me.userId;
    if (myId == null || myId === '') return list;
    const idNum = Number(myId);
    if (!Number.isFinite(idNum)) return list;
    if (list.some(u => Number(u?.id ?? u?.userId) === idNum)) {
      return list;
    }
    list.unshift({
      id: idNum,
      firstname: me.firstname || me.firstName || '',
      lastname: me.lastname || me.lastName || '',
      email: me.email || '',
      profilePicture: me.profilePicture
    });
    return list;
  }

  loadAllUsers(): void {
    // ⚠️ /Users est souvent réservé aux ADMIN → utiliser l'endpoint public "available-for-messaging"
    // (déjà utilisé dans la navbar) pour éviter le 403.
    this.userService.getAvailableUsersForMessaging().subscribe({
      next: (data) => {
        const arr = Array.isArray(data) ? data : [];
        this.allUsers = this.mergeCurrentUserForAssignment(arr);
        this.updateFilteredAssignableUsers();
      },
      error: () => {
        // fallback: essayer l'ancien endpoint si jamais disponible
        this.userService.getAllUsers().subscribe({
          next: (fallback) => {
            const arr = Array.isArray(fallback) ? fallback : [];
            this.allUsers = this.mergeCurrentUserForAssignment(arr);
            this.updateFilteredAssignableUsers();
          },
          error: () => {
            this.allUsers = [];
            this.updateFilteredAssignableUsers();
          }
        });
      }
    });
  }

  updateFilteredAssignableUsers(): void {
    this.filteredAssignableUsers = this.allUsers.filter(
      u => !this.assignedUsers.some(a => Number(a?.id) === Number(u?.id))
    );
  }

  getUnassignedUsers(): any[] {
    return this.filteredAssignableUsers;
  }

  // Appelé par app-searchable-user-select via (userSelected)
  assignUserById(userId: string | number): void {
    const id = Number(userId);
    const user = this.allUsers.find(u => Number(u?.id) === id);
    if (!user) return;
    if (!this.assignedUsers.some(u => Number(u?.id) === id)) {
      this.assignedUsers.push(user);
      this.updateFilteredAssignableUsers();
    }
  }

  removeAssignedUser(index: number): void {
    this.assignedUsers.splice(index, 1);
    this.updateFilteredAssignableUsers();
  }

  /**
   * Convertit une date (ISO string, tableau Jackson ou null) en format "YYYY-MM-DDTHH:mm"
   * attendu par <input type="datetime-local">
   */
  toDatetimeLocal(value: any): string {
    if (!value) return '';
    // Si Jackson renvoie un tableau [year, month, day, hour, min]
    if (Array.isArray(value)) {
      const [y, mo, d, h = 0, mi = 0] = value;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`;
    }
    // Si c'est déjà une string ISO
    if (typeof value === 'string') {
      return value.substring(0, 16); // "YYYY-MM-DDTHH:mm"
    }
    return '';
  }

  initForm(): void {
    this.interventionForm = this.fb.group({
      nomClient: [''],
      nomProduit: [''],
      visAVisClient: [''],
      dateHeureDemande: [''],
      probleme: [''],
      criticite: [''],
      delaiResolution: [''],
      contratId: [null],
    });
  }

  initTechForm(): void {
    this.techForm = this.fb.group({
      resume: [''],
      dateHeureIntervention: [''],
      dureeIntervention: [''],
      enCoursDeResolution: [false],
      resolu: [false],
      dateHeureResolution: [''],
      interventionLines: this.fb.array([]),
    });
    this.techInterventionFiles = [];
    this.techResolutionFile = null;
    this.watchTechStatutCheckboxes();
  }

  /**
   * Les deux cases "Résolu" et "En cours" sont mutuellement exclusives.
   * Quand l'une est cochée, l'autre se décoche automatiquement.
   * Les données saisies dans chaque section sont CONSERVÉES (le FormArray
   * et dateHeureResolution ne sont pas vidés).
   */
  private watchTechStatutCheckboxes(): void {
    this.techForm.get('resolu')!.valueChanges.subscribe((checked: boolean) => {
      if (checked) {
        this.techForm.get('enCoursDeResolution')!.setValue(false, { emitEvent: false });
      }
    });

    this.techForm.get('enCoursDeResolution')!.valueChanges.subscribe((checked: boolean) => {
      if (checked) {
        this.techForm.get('resolu')!.setValue(false, { emitEvent: false });
      }
    });
  }

  createInterventionLine(): FormGroup {
    return this.fb.group({
      sessionId: [null as number | null],
      resume: [''],
      dateHeureIntervention: [''],
      dureeIntervention: [''],
      fichier: [''],
      fichierOriginalName: [''],
      userAssigne: [null as any],
    });
  }

  get interventionLinesArray(): FormArray {
    return this.techForm.get('interventionLines') as FormArray;
  }

  addInterventionLine(): void {
    this.interventionLinesArray.push(this.createInterventionLine());
    this.techInterventionFiles = [...this.techInterventionFiles, null];
  }

  removeInterventionLine(index: number): void {
    if (this.interventionLinesArray.length > 1) {
      this.interventionLinesArray.removeAt(index);
      this.techInterventionFiles.splice(index, 1);
    }
  }

  onTechLineFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.techInterventionFiles[index] = input.files[0];
    }
  }

  onTechResolutionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.techResolutionFile = input.files[0];
    }
  }

  // En mode "notification", on grise uniquement les champs déjà renseignés
  isLockedIfFilled(controlName: string): boolean {
    if (!this.isAssignedView) return false;
    const v = this.interventionForm.get(controlName)?.value;
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    return Boolean(v);
  }

  private setControlDisabledIfFilled(controlName: string): void {
    const ctrl = this.interventionForm.get(controlName);
    if (!ctrl) return;
    if (this.isLockedIfFilled(controlName)) {
      ctrl.disable({ emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
    }
  }

  private enableAllMainControls(): void {
    Object.keys(this.interventionForm.controls).forEach(k => {
      this.interventionForm.get(k)?.enable({ emitEvent: false });
    });
  }

  private applyAssignedLocks(): void {
    // verrouiller uniquement ceux qui sont déjà renseignés
    ['nomClient', 'nomProduit', 'dateHeureDemande', 'probleme', 'criticite'].forEach(k =>
      this.setControlDisabledIfFilled(k)
    );
    // toujours readonly/auto
    this.interventionForm.get('visAVisClient')?.disable({ emitEvent: false });
    this.interventionForm.get('delaiResolution')?.disable({ emitEvent: false });
    this.interventionForm.get('contratId')?.disable({ emitEvent: false });
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
      this.autoSelectCriticite();
      this.updateDelaiFromContrat();
    });

    this.interventionForm.get('nomProduit')!.valueChanges.subscribe(() => {
      this.autoSelectCriticite();
      this.updateDelaiFromContrat();
    });

    // Le délai dépend aussi de la criticité (SLA par criticité dans le contrat)
    this.interventionForm.get('criticite')!.valueChanges.subscribe(() => {
      this.updateDelaiFromContrat();
    });
  }

  /**
   * Auto-sélectionne la 1ère criticité disponible dans le contrat (C1 → C4).
   * Si la criticité actuelle n'est plus disponible dans le nouveau contrat,
   * on la remplace. Si elle est encore valide, on la garde.
   */
  autoSelectCriticite(): void {
    if (this.isLockedIfFilled('criticite')) return;
    const available = this.availableCriticites();
    if (available.length === 0) {
      // Pas de criticité dans le contrat → vider
      this.interventionForm.patchValue({ criticite: '' }, { emitEvent: false });
      return;
    }
    const current = this.interventionForm.get('criticite')?.value;
    if (current && available.includes(current)) {
      // La criticité actuelle est valide → on la garde
      return;
    }
    // Sinon, on prend la première disponible
    this.interventionForm.patchValue({ criticite: available[0] }, { emitEvent: false });
  }

  /**
   * Renvoie le contrat correspondant au client + produit sélectionnés (ou null).
   */
  getMatchingContrat(): any | null {
    const nomClient = this.interventionForm.get('nomClient')?.value;
    const nomProduit = this.interventionForm.get('nomProduit')?.value;
    if (!nomClient || !nomProduit) return null;
    return this.contrats.find(c => c.client === nomClient && c.nomProduit === nomProduit) || null;
  }

  /**
   * Renvoie la liste des criticités disponibles pour le contrat sélectionné,
   * triées dans l'ordre C1 → C4.
   */
  availableCriticites(): string[] {
    const contrat = this.getMatchingContrat();
    if (!contrat) return [];

    const order = ['C1', 'C2', 'C3', 'C4'];

    if (contrat.slaList && contrat.slaList.length > 0) {
      const criticites = contrat.slaList
        .map((s: any) => s.criticite)
        .filter((c: string) => !!c);
      return order.filter(c => criticites.includes(c));
    }

    // Legacy : ancien champ unique criticite
    if (contrat.criticite) return [contrat.criticite];

    return [];
  }

  /**
   * Sélectionne une criticité (depuis les chips) ET remplit le délai correspondant
   * directement, sans dépendre du watcher (plus fiable).
   */
  selectCriticite(criticite: string): void {
    if (this.isLockedIfFilled('criticite')) return;
    this.interventionForm.patchValue({ criticite });
    this.updateDelaiFromContrat();
  }

  updateDelaiFromContrat(): void {
    const nomClient = this.interventionForm.get('nomClient')?.value;
    const nomProduit = this.interventionForm.get('nomProduit')?.value;
    const criticite = this.interventionForm.get('criticite')?.value;

    const setDelai = (val: any) => {
      const ctrl = this.interventionForm.get('delaiResolution');
      if (!ctrl) return;
      // setValue marche aussi pour les FormControl disabled
      ctrl.setValue(val ?? '', { emitEvent: false });
    };

    if (!nomClient || !nomProduit) {
      setDelai('');
      return;
    }

    // Chercher le contrat correspondant
    const contrat = this.contrats.find(c =>
      c.client === nomClient && c.nomProduit === nomProduit
    );

    if (!contrat) {
      setDelai('');
      return;
    }

    // 1) Nouveau format : chercher dans slaList selon la criticité
    if (contrat.slaList && contrat.slaList.length > 0 && criticite) {
      const matched = contrat.slaList.find(s => s.criticite === criticite);
      if (matched && matched.delaiMaxResolution != null) {
        setDelai(matched.delaiMaxResolution);
        return;
      }
      // Pas de délai défini pour cette criticité
      setDelai('');
      return;
    }

    // 2) Legacy : ancien champ délaiMaxResolution (en jours) → convertir en heures
    if (contrat.delaiMaxResolution) {
      setDelai(contrat.delaiMaxResolution * 24);
      return;
    }

    setDelai('');
  }

  onSearch() {
    this.applyFilters();
  }

  getAllInterventions(): void {
    this.interventionCurativeService.getAllInterventionsCuratives().subscribe(
      (data: InterventionCurative[]) => {
        const sorted = data.slice().reverse();
        this.interventions = sorted;
        this.filteredInterventions = sorted;
        this.calculatePagination();
        this.changePage(0);
      },
      (error) => {
        console.error('Erreur récupération Interventions Curatives', error);
      }
    );
  }

  filterInterventions(): InterventionCurative[] {
    const term = (this.searchTerm || '').toLowerCase();
    const fStatut = this.filterStatut;
    const fClient = (this.filterClient || '').toLowerCase();
    const fUser = (this.filterUser || '').toString();
    const fFrom = this.filterDateFrom ? new Date(this.filterDateFrom) : null;
    const fTo = this.filterDateTo ? new Date(this.filterDateTo) : null;
    if (fTo) fTo.setHours(23, 59, 59, 999);

    return this.interventions.filter((intervention) => {
      // Recherche libre (texte)
      const matchSearch = !term ||
        intervention.ficheIntervention?.toLowerCase().includes(term) ||
        intervention.nomClient?.toLowerCase().includes(term) ||
        intervention.intervenant?.toLowerCase().includes(term) ||
        intervention.criticite?.toLowerCase().includes(term) ||
        intervention.probleme?.toLowerCase().includes(term);

      // Statut
      let matchStatut = true;
      if (fStatut === 'resolu') {
        matchStatut = !!intervention.resolu;
      } else if (fStatut === 'enCours') {
        matchStatut = !!intervention.enCoursDeResolution && !intervention.resolu;
      } else if (fStatut === 'enAttente') {
        matchStatut = !intervention.resolu && !intervention.enCoursDeResolution;
      }

      // Client
      const matchClient = !fClient || (intervention.nomClient || '').toLowerCase() === fClient;

      // Utilisateur assigné
      const matchUser = !fUser || (intervention.assignedUsers || []).some((u: any) => String(u?.id) === fUser);

      // Date demande dans la plage
      let matchDate = true;
      if (fFrom || fTo) {
        const d = intervention.dateHeureDemande ? new Date(intervention.dateHeureDemande as any) : null;
        if (!d || isNaN(d.getTime())) {
          matchDate = false;
        } else {
          if (fFrom && d < fFrom) matchDate = false;
          if (fTo && d > fTo) matchDate = false;
        }
      }

      return matchSearch && matchStatut && matchClient && matchUser && matchDate;
    });
  }

  // Liste unique de clients et users présents dans les interventions (pour les dropdowns)
  get uniqueClients(): string[] {
    const set = new Set<string>();
    this.interventions.forEach(i => { if (i.nomClient) set.add(i.nomClient); });
    return Array.from(set).sort();
  }

  get uniqueAssignedUsers(): { id: number; label: string }[] {
    const map = new Map<number, string>();
    this.interventions.forEach(i => {
      (i.assignedUsers || []).forEach((u: any) => {
        if (u?.id != null && !map.has(u.id)) {
          map.set(u.id, `${u.firstname || ''} ${u.lastname || ''}`.trim() || ('User #' + u.id));
        }
      });
    });
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  toggleFiltersPanel(): void {
    this.showFiltersPanel = !this.showFiltersPanel;
  }

  applyFilters(): void {
    this.filteredInterventions = this.filterInterventions();
    this.calculatePagination();
    this.changePage(0);
  }

  resetFilters(): void {
    this.filterStatut = '';
    this.filterClient = '';
    this.filterUser = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFilters();
  }

  get activeFiltersCount(): number {
    let n = 0;
    if (this.filterStatut) n++;
    if (this.filterClient) n++;
    if (this.filterUser) n++;
    if (this.filterDateFrom || this.filterDateTo) n++;
    return n;
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
  selectIntervention(intervention: InterventionCurative): void {
    this.selectedIntervention =
      this.selectedIntervention?.interventionCurativeId === intervention.interventionCurativeId
        ? null
        : intervention;
  }

  closeDetail(): void {
    this.selectedIntervention = null;
  }

  /**
   * En création (1ʳᵉ popup) : afficher l'utilisateur connecté tout de suite parmi les assignés (chip),
   * retirable au besoin avant enregistrement.
   */
  private prefillCurrentUserAsAssigneeOnCreate(): void {
    const me = this.authService.getUser();
    if (!me) return;
    const id = Number(me.id ?? me.userId);
    if (!Number.isFinite(id)) return;
    if (this.assignedUsers.some(a => Number(a?.id) === id)) return;

    const fromList = this.allUsers.find(u => Number(u?.id ?? u?.userId) === id);
    this.assignedUsers.push(
      fromList ?? {
        id,
        firstname: me.firstname || me.firstName || '',
        lastname: me.lastname || me.lastName || '',
        email: me.email || ''
      }
    );
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingInterventionId = null;
    this.editingSnapshot = null;
    this.isAssignedView = false;
    this.enableAllMainControls();
    this.assignedUsers = [];
    this.prefillCurrentUserAsAssigneeOnCreate();
    this.updateFilteredAssignableUsers();
    this.interventionForm.patchValue({
      nomClient: '',
      nomProduit: '',
      visAVisClient: '',
      dateHeureDemande: '',
      probleme: '',
      criticite: '',
      delaiResolution: '',
      contratId: null
    });
    // Réinitialiser les variables de fichier
    this.selectedFile = null;
    this.existingFile = null;
    this.existingFileName = null;
    this.showModal = true;
  }

  /** Visible si connecté parmi assignedUsers → accès flux terrain (popup n°2). */
  isCurrentUserAssignedToIntervention(intervention: InterventionCurative | null | undefined): boolean {
    if (!intervention) return false;
    const me = this.authService.getUser();
    if (!me) return false;
    const myId = Number(me.id ?? me.userId);
    if (!Number.isFinite(myId)) return false;
    return (intervention.assignedUsers || []).some((u: any) => Number(u?.id ?? u?.userId) === myId);
  }

  /**
   * Remplit le modal (formulaire principal + état tech FormArray) depuis une intervention chargée.
   */
  private hydrateCurativeModal(intervention: InterventionCurative): void {
    this.editingInterventionId = intervention.interventionCurativeId || null;
    this.editingSnapshot = { ...intervention };
    this.assignedUsers = intervention.assignedUsers || [];
    this.updateFilteredAssignableUsers();

    this.interventionForm.patchValue({
      nomClient: intervention.nomClient,
      nomProduit: intervention.nomProduit || '',
      visAVisClient: intervention.visAVisClient,
      dateHeureDemande: this.toDatetimeLocal(intervention.dateHeureDemande),
      probleme: intervention.probleme || '',
      criticite: intervention.criticite,
      delaiResolution: intervention.delaiResolution || '',
      contratId: intervention.contratId || null
    }, { emitEvent: false });

    while (this.interventionLinesArray.length > 0) {
      this.interventionLinesArray.removeAt(0);
    }
    this.techInterventionFiles = [];
    this.techResolutionFile = null;

    if (intervention.sessions && intervention.sessions.length > 0) {
      intervention.sessions.forEach((s) => {
        const line = this.createInterventionLine();
        line.patchValue({
          sessionId: s.sessionId ?? null,
          resume: s.resume || '',
          dateHeureIntervention: this.toDatetimeLocal(s.dateHeureIntervention),
          dureeIntervention: s.dureeIntervention || '',
          fichier: s.fichier || '',
          fichierOriginalName: s.fichierOriginalName || '',
          userAssigne: s.userAssigne || null,
        });
        this.interventionLinesArray.push(line);
        this.techInterventionFiles.push(null);
      });
    }

    this.techForm.patchValue({
      resume: intervention.resume || '',
      dateHeureIntervention: this.toDatetimeLocal(intervention.dateHeureIntervention),
      dureeIntervention: intervention.dureeIntervention || '',
      enCoursDeResolution: intervention.enCoursDeResolution || false,
      resolu: intervention.resolu || false,
      dateHeureResolution: this.toDatetimeLocal(intervention.dateHeureResolution),
    });
  }

  /** Dans popup n°1 (mode admin / fiche complète), afficher Compléter si le connecté est dans les assignés (ex. affecté à lui‑même). */
  showCompleterButtonInAdminModal(): boolean {
    if (!this.isEditMode || this.isAssignedView) return false;
    const merged: InterventionCurative = {
      ...(this.editingSnapshot || {}),
      ...(this.interventionForm.getRawValue() as InterventionCurative),
      assignedUsers: [...this.assignedUsers],
    };
    return this.isCurrentUserAssignedToIntervention(merged);
  }

  /**
   * Bouton dans le pied de popup n°1 : ouvre popup n°2. Les données saisies dans popup n°1 non encore POSTées sont
   * fusionnées dans editingSnapshot pour le PUT combiné depuis saveTechPopup.
   */
  openTechFromAdministrativeModal(): void {
    this.mergeMainFormIntoEditingSnapshot();
    this.techButtonLabel = 'Compléter l\'intervention';
    this.openTechPopup();
  }

  private mergeMainFormIntoEditingSnapshot(): void {
    const snap = this.editingSnapshot || {};
    const raw = this.interventionForm.getRawValue() as InterventionCurative;
    this.editingSnapshot = {
      ...(snap as InterventionCurative),
      ...raw,
      assignedUsers: [...this.assignedUsers],
      interventionCurativeId:
        this.editingInterventionId ??
        (snap as InterventionCurative).interventionCurativeId,
    };
  }

  /** Flux assigné (notification, etc.) : popup n°1 partiellement verrouillée + bouton Compléter. */
  openCompleterFlow(intervention: InterventionCurative): void {
    this.techButtonLabel = 'Compléter l\'intervention';
    this.openAssignedModal(intervention);
  }

  openEditModal(intervention: InterventionCurative): void {
    this.openAdministrativeEditModal(intervention);
  }

  /**
   * Popup n°1 en édition fiche : tous les champs éditables.
   * Si vous êtes assigné, un bouton « Compléter l'intervention » apparaît à côté de « Mettre à jour » (popup n°2).
   */
  openAdministrativeEditModal(intervention: InterventionCurative): void {
    this.techButtonLabel = 'Compléter l\'intervention';
    this.isEditMode = true;
    this.isAssignedView = false;
    this.hydrateCurativeModal(intervention);
    this.enableAllMainControls();
    this.showModal = true;
  }

  // Mode assigné : champs préremplis avec verrous + bouton vers popup n°2
  openAssignedModal(intervention: InterventionCurative): void {
    if (this.techButtonLabel !== 'Modifier') {
      this.techButtonLabel = 'Compléter l\'intervention';
    }
    this.isEditMode = true;
    this.isAssignedView = true;
    this.hydrateCurativeModal(intervention);
    this.applyAssignedLocks();

    this.showModal = true;
  }

  openTechPopup(): void {
    this.showTechPopup = true;
  }

  closeTechPopup(): void {
    this.showTechPopup = false;
  }

  saveTechPopup(): void {
    if (!this.editingInterventionId) return;
    const assignedUsers = this.buildAssignedUsersPayload();

    // Date/durée principale (toujours-visibles)
    const mainDate = this.techForm.get('dateHeureIntervention')?.value || null;
    const mainDuree = this.techForm.get('dureeIntervention')?.value || '';

    const enCours = this.techForm.get('enCoursDeResolution')?.value || false;

    // ── Construction du tableau des sessions (multi-blocs "En cours") ──
    const linesValues = this.interventionLinesArray.value as Array<{
      sessionId: number | null;
      resume?: string;
      dateHeureIntervention: string;
      dureeIntervention: string;
      fichier?: string;
      fichierOriginalName?: string;
      userAssigne?: any;
    }>;

    const currentUserRef = this.getCurrentUserRef();

    const sessions = linesValues
      .map((l, idx) => ({
        sessionId: l.sessionId ?? null,
        resume: l.resume || '',
        dateHeureIntervention: l.dateHeureIntervention || null,
        dureeIntervention: l.dureeIntervention || '',
        fichier: l.fichier || null,
        fichierOriginalName: l.fichierOriginalName || null,
        userAssigne: this.normalizeUserRef(l.userAssigne) ?? currentUserRef,
        _localFile: this.techInterventionFiles[idx] || null,
      }))
      .filter(s => s.resume || s.dateHeureIntervention || s.dureeIntervention || s._localFile);

    const isResolu = this.techForm.get('resolu')?.value || false;

    const techValues: any = {
      resume: this.techForm.get('resume')?.value || '',
      dateHeureIntervention: mainDate,
      dureeIntervention: mainDuree,
      enCoursDeResolution: enCours,
      resolu: isResolu,
      dateHeureResolution: this.techForm.get('dateHeureResolution')?.value || null,
      sessions: sessions.map(({ _localFile, ...s }) => s),
    };

    // Si résolu : conserver celui qui a déjà fermé OU le currentUser
    const previousResoluByUser = (this.editingSnapshot as any)?.resoluByUser || null;
    if (isResolu) {
      techValues.resoluByUser =
        this.normalizeUserRef(previousResoluByUser) ?? currentUserRef ?? null;
    }

    const payload: InterventionCurative = {
      ...(this.editingSnapshot || {}),
      ...this.interventionForm.getRawValue(),
      ...techValues,
      assignedUsers,
    };

    const body = this.sanitizeUpdatePayload(payload);

    this.interventionCurativeService.updateInterventionCurative(this.editingInterventionId, body).subscribe(
      (saved) => {
        const savedId = saved?.interventionCurativeId || this.editingInterventionId!;

        // Préparer toutes les promesses d'upload
        const uploadTasks: Promise<any>[] = [];

        // 1) Fichier de résolution (sur l'intervention principale)
        if (this.techResolutionFile) {
          uploadTasks.push(
            this.interventionCurativeService.uploadFile(savedId, this.techResolutionFile).toPromise()
          );
        }

        // 2) Fichiers de session (sur chaque session sauvegardée)
        const savedSessions = saved?.sessions || [];
        sessions.forEach((s, idx) => {
          const localFile = s._localFile;
          if (!localFile) return;
          // Mappage par ordre : la session i du payload correspond à la session i renvoyée
          const target = savedSessions[idx];
          if (target?.sessionId) {
            uploadTasks.push(
              this.interventionCurativeService.uploadSessionFile(target.sessionId, localFile).toPromise()
            );
          }
        });

        if (uploadTasks.length === 0) {
          alert('Intervention complétée avec succès');
          this.closeTechPopup();
          this.closeModal();
          this.getAllInterventions();
          return;
        }

        Promise.all(uploadTasks)
          .then(() => {
            alert('Intervention complétée avec succès');
            this.closeTechPopup();
            this.closeModal();
            this.getAllInterventions();
          })
          .catch((err) => {
            console.error('Erreur upload fichier(s)', err);
            alert('Intervention enregistrée mais erreur lors de l\'upload d\'un ou plusieurs fichiers.');
            this.closeTechPopup();
            this.closeModal();
            this.getAllInterventions();
          });
      },
      (error) => {
        const msg = error?.error?.message || error?.error?.rawMessage;
        console.error('Erreur lors de la mise à jour (tech)', error?.error ?? error);
        alert(msg ? `Erreur mise à jour (serveur) : ${msg}` : 'Erreur lors de la mise à jour');
      }
    );
  }

  closeModal(): void {
    this.showModal = false;
    this.interventionForm.reset();
    this.isAssignedView = false;
    this.techButtonLabel = 'Compléter l\'intervention';
    this.enableAllMainControls();
    this.selectedIntervention = null;
  }

  saveIntervention(): void {
    const formData: InterventionCurative = this.interventionForm.value;
    const assignedUsers = this.buildAssignedUsersPayload();

    if (this.isEditMode && this.editingInterventionId) {
      // Update
      const interventionData: InterventionCurative = {
        ...(this.editingSnapshot || {}),
        ...formData,
        assignedUsers,
      };
      const body = this.sanitizeUpdatePayload(interventionData);
      this.interventionCurativeService.updateInterventionCurative(this.editingInterventionId, body).subscribe(
        () => {
          alert('Intervention mise à jour avec succès');
          this.closeModal();
          this.getAllInterventions();
        },
        (error) => {
          console.error('Erreur lors de la mise à jour', error);
          alert('Erreur lors de la mise à jour');
        }
      );
    } else {
      // Add
      const payload: InterventionCurative = {
        ...formData,
        assignedUsers,
      };
      this.interventionCurativeService.addInterventionCurative(payload).subscribe(
        () => {
          alert('Intervention ajoutée avec succès');
          this.closeModal();
          this.getAllInterventions();
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
      case 'C4': return 'badge-success';
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
  getFileDownloadUrl(id: number | null | undefined): string {
    if (!id) return '';
    return this.interventionCurativeService.getFileDownloadUrl(id);
  }

  getSessionFileDownloadUrl(sessionId: number | null | undefined): string {
    if (!sessionId) return '';
    return this.interventionCurativeService.getSessionFileDownloadUrl(sessionId);
  }

  // ==================== CONFORMITÉ SLA ====================
  /**
   * Calcule la conformité SLA d'une intervention :
   * - Échéance = dateHeureDemande + delaiResolution (en heures)
   * - Si résolu : compare dateHeureResolution vs échéance
   * - Si non résolu : compare maintenant vs échéance
   * Retourne un objet { status, label, deadlineStr, diffStr }
   */
  getConformite(intervention: InterventionCurative): {
    status: 'conforme' | 'depasse' | 'en_cours_ok' | 'en_cours_depasse' | 'unknown';
    label: string;
    deadlineStr: string;
    diffStr: string;
  } {
    const unknown = { status: 'unknown' as const, label: '—', deadlineStr: '—', diffStr: '' };

    if (!intervention.dateHeureDemande || !intervention.delaiResolution) return unknown;

    const demande = new Date(intervention.dateHeureDemande as string);
    if (isNaN(demande.getTime())) return unknown;

    const delaiHeures = Number(intervention.delaiResolution);
    if (isNaN(delaiHeures) || delaiHeures <= 0) return unknown;

    // Le délai est désormais stocké en heures (ex: 24h = 1 jour, 48h = 2 jours)
    const deadline = new Date(demande.getTime() + delaiHeures * 3600 * 1000);
    const deadlineStr = deadline.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const compareDate = intervention.resolu && intervention.dateHeureResolution
      ? new Date(intervention.dateHeureResolution as string)
      : new Date();

    if (isNaN(compareDate.getTime())) return unknown;

    const diffMs = compareDate.getTime() - deadline.getTime();
    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / (24 * 3600 * 1000));
    const hours = Math.floor((absDiffMs % (24 * 3600 * 1000)) / 3600000);
    const diffStr = days > 0 ? `${days}j ${hours}h` : `${hours}h`;

    if (intervention.resolu) {
      if (diffMs <= 0) {
        return { status: 'conforme', label: 'Conforme', deadlineStr, diffStr: `-${diffStr}` };
      } else {
        return { status: 'depasse', label: 'Dépassé', deadlineStr, diffStr: `+${diffStr}` };
      }
    } else {
      if (diffMs <= 0) {
        return { status: 'en_cours_ok', label: 'En cours – dans les délais', deadlineStr, diffStr: `-${diffStr}` };
      } else {
        return { status: 'en_cours_depasse', label: 'En cours – délai dépassé', deadlineStr, diffStr: `+${diffStr}` };
      }
    }
  }
}
