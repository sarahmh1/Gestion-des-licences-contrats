import { Component, OnInit } from '@angular/core';
import { ClientStatsService } from '../../Services/client-stats.service';
import { ClientService, Client } from '../../Services/client.service';
import { ClientStats } from '../../Model/ClientStats';
import { PermissionService } from '../../Services/permission.service';
import { isValidPhone } from 'app/shared/validators/app-validators';

@Component({
  selector: 'app-client-stats',
  templateUrl: './client-stats.component.html',
  styleUrls: ['./client-stats.component.scss']
})
export class ClientStatsComponent implements OnInit {

  // ── Données ──────────────────────────────────────────────────────────────
  clients: Client[] = [];
  clientStats: ClientStats[] = [];
  filteredStats: ClientStats[] = [];
  pagedStats: ClientStats[] = [];

  // ── Client sélectionné ───────────────────────────────────────────────────
  selectedClient: Client | null = null;

  // ── Recherche ────────────────────────────────────────────────────────────
  searchClientTerm: string = '';

  // ── Pagination ───────────────────────────────────────────────────────────
  currentPage = 0;
  pageSize = 5;
  totalPages = 0;

  // ── Modal Ajouter ────────────────────────────────────────────────────────
  showAddModal = false;
  newClient = {
    nomClient: '',
    nosVisAVis: [''],
    adressesMail: [''],
    numTel: [''],
    adresses: ['']
  };

  // ── Modal Modifier ───────────────────────────────────────────────────────
  showEditModal = false;
  editClient: Client = { nomClient: '' };
  editVisAVis: string[] = [''];
  editMails: string[] = [''];
  editTels: string[] = [''];
  editAdresses: string[] = [''];
  telValidationError = '';

  constructor(
    private clientStatsService: ClientStatsService,
    private clientService: ClientService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadStats();
  }

  // ── Chargement ───────────────────────────────────────────────────────────
  loadClients(): void {
    this.clientService.getAllClients().subscribe(
      (data) => {
        this.clients = data;
      },
      (err) => console.error('Erreur chargement clients', err)
    );
  }

  loadStats(): void {
    this.clientStatsService.getClientStats().subscribe(
      (data: ClientStats[]) => {
        this.clientStats = data.reverse();
        this.applyFilters();
      },
      (err) => console.error('Erreur chargement stats', err)
    );
  }

  // ── Sélection d'un client ─────────────────────────────────────────────────
  selectClient(client: Client): void {
    if (this.selectedClient?.id === client.id) {
      this.selectedClient = null; // désélectionner si re-clic
    } else {
      this.selectedClient = client;
    }
    this.currentPage = 0;
    this.applyFilters();
  }

  // ── Filtres ───────────────────────────────────────────────────────────────
  applyFilters(): void {
    let stats = [...this.clientStats];

    // Filtrer par client sélectionné
    if (this.selectedClient) {
      stats = stats.filter(s =>
        s.client?.toLowerCase() === this.selectedClient!.nomClient?.toLowerCase()
      );
    }

    this.filteredStats = stats;
    this.totalPages = Math.ceil(this.filteredStats.length / this.pageSize);
    this.changePage(0);
  }

  get filteredClients(): Client[] {
    if (!this.searchClientTerm.trim()) return this.clients;
    const t = this.searchClientTerm.toLowerCase();
    return this.clients.filter(c => c.nomClient.toLowerCase().includes(t));
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedStats = this.filteredStats.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ── Modal Ajouter ─────────────────────────────────────────────────────────
  openAddModal(): void {
    this.newClient = { nomClient: '', nosVisAVis: [''], adressesMail: [''], numTel: [''], adresses: [''] };
    this.telValidationError = '';
    this.showAddModal = true;
  }
  closeAddModal(): void { this.showAddModal = false; }

  // ── Modal Modifier ────────────────────────────────────────────────────────
  openEditModal(client: Client, event: Event): void {
    event.stopPropagation();
    this.editClient = { ...client };
    this.editVisAVis  = client.nosVisAVis?.length  ? [...client.nosVisAVis]  : [''];
    this.editMails    = client.adressesMail?.length ? [...client.adressesMail] : [''];
    this.editTels     = client.numTel?.length       ? [...client.numTel]       : [''];
    this.editAdresses = client.adresses?.length     ? [...client.adresses]     : [''];
    this.telValidationError = '';
    this.showEditModal = true;
  }
  closeEditModal(): void { this.showEditModal = false; }

  saveEdit(): void {
    if (!this.editClient.id || !this.editClient.nomClient?.trim()) return;
    if (!this.validatePhoneList(this.editTels)) return;
    const updated: Client = {
      ...this.editClient,
      nomClient: this.editClient.nomClient!.trim(),
      nosVisAVis:   this.filterArr(this.editVisAVis),
      adressesMail: this.filterArr(this.editMails),
      numTel:       this.filterArr(this.editTels),
      adresses:     this.filterArr(this.editAdresses)
    };
    this.clientService.updateClient(this.editClient.id, updated).subscribe(() => {
      this.closeEditModal();
      this.loadClients();
      this.loadStats();
    });
  }

  // ── Supprimer client ──────────────────────────────────────────────────────
  deleteClient(client: Client, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Supprimer le client "${client.nomClient}" ?\nCela supprimera aussi tous ses suivis d'interventions.`)) return;
    this.clientService.deleteClient(client.id!).subscribe(() => {
      if (this.selectedClient?.id === client.id) this.selectedClient = null;
      this.loadClients();
      this.loadStats();
    });
  }

  // ── Supprimer suivi ────────────────────────────────────────────────────────
  deleteEntry(stat: ClientStats): void {
    const produitLabel = stat.nomProduit ? ` / ${stat.nomProduit}` : '';
    if (!confirm(`Supprimer le suivi "${stat.client}${produitLabel}" ?`)) return;
    this.clientStatsService.deleteClientStatEntry(stat.client, stat.nomProduit || '').subscribe({
      next: () => this.loadStats(),
      error: (err) => { console.error(err); alert('Erreur lors de la suppression.'); }
    });
  }

  // ── Helpers champs multiples ──────────────────────────────────────────────
  addItem(arr: string[]): void { arr.push(''); }
  removeItem(arr: string[], i: number): void { if (arr.length > 1) arr.splice(i, 1); }
  trackByIndex(index: number): number { return index; }
  filterArr(arr: string[]): string[] {
    return arr.map(v => v.trim()).filter(v => v !== '');
  }

  // ── Sauvegarder nouveau client ─────────────────────────────────────────────
  private validatePhoneList(phones: string[]): boolean {
    const invalid = phones
      .map(v => (v ?? '').trim())
      .filter(v => v !== '')
      .find(v => !isValidPhone(v));
    if (invalid !== undefined) {
      this.telValidationError = `Numéro invalide : « ${invalid} » — utilisez 8 chiffres uniquement.`;
      return false;
    }
    this.telValidationError = '';
    return true;
  }

  saveClient(): void {
    const name = this.newClient.nomClient.trim();
    if (!name) return;
    if (!this.validatePhoneList(this.newClient.numTel)) return;
    this.clientService.addClient({
      nomClient: name,
      nosVisAVis:   this.filterArr(this.newClient.nosVisAVis),
      adressesMail: this.filterArr(this.newClient.adressesMail),
      numTel:       this.filterArr(this.newClient.numTel),
      adresses:     this.filterArr(this.newClient.adresses)
    }).subscribe(() => {
      this.closeAddModal();
      this.loadClients();
      this.loadStats();
    });
  }
}
