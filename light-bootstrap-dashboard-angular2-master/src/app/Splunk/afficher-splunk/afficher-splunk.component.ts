import { Component, OnInit, ViewChild } from '@angular/core';
import { SplunkService } from 'app/Services/splunk.service';
import { Splunk } from 'app/Model/Splunk';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterSplunkComponent } from '../ajouter-splunk/ajouter-splunk.component';

@Component({
  selector: 'app-afficher-splunk',
  templateUrl: './afficher-splunk.component.html',
  styleUrls: ['./afficher-splunk.component.scss']
})
export class AfficherSplunkComponent implements OnInit {

  searchTerm = '';
  selectedSplunk: Splunk | null = null;
  splunks: Splunk[] = [];
  filteredSplunks: Splunk[] = [];
  unapprovedSplunks: Splunk[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedSplunks: Splunk[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedSplunkToUpdate: Splunk | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterSplunkComponent) ajouterComponent?: AjouterSplunkComponent;

  constructor(
    private splunkService: SplunkService,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllSplunks();
  }

  onSearch(): void {
    this.filteredSplunks = this.filterSplunks();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllSplunks(): void {
    this.splunkService.getAllSplunks().subscribe({
      next: (data: Splunk[]) => {
        this.splunks = data;
        this.filteredSplunks = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération Splunks', error)
    });
  }

  filterSplunks(): Splunk[] {
    const term = this.searchTerm.toLowerCase();
    return this.splunks.filter((splunk) => {
      const inLicences = splunk.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        splunk.client?.toLowerCase().includes(term) ||
        splunk.nomDuContact?.toLowerCase().includes(term) ||
        splunk.adresseEmailContact?.toLowerCase().includes(term) ||
        splunk.numero?.toLowerCase().includes(term) ||
        splunk.remarques?.toLowerCase().includes(term) ||
        splunk.dureeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSplunks.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedSplunks = this.filteredSplunks.slice(start, start + this.pageSize);
  }

  approveSplunk(id: number): void {
    this.splunkService.activate(id).subscribe({
      next: () => {
        this.unapprovedSplunks = this.unapprovedSplunks.filter(s => s.splunkid !== id);
        this.filteredSplunks = this.filteredSplunks.filter(s => s.splunkid !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteSplunk(item: { splunkid?: number; client?: string }): void {
    const id = item?.splunkid;
    if (id == null) return;
    this.pendingDeleteId = id;
    this.deleteModalDetail = item.client ? `Client : ${item.client}` : '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
    this.deleteModalDetail = '';
  }

  confirmDeleteSplunk(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.splunkService.deleteSplunk(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedSplunk?.splunkid === id) {
          this.selectedSplunk = null;
        }
        this.getAllSplunks();
        alert('Splunk supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression Splunk', error);
        alert('Échec suppression');
      }
    });
  }

  updateSplunk(splunk: Splunk): void {
    this.selectedSplunkToUpdate = splunk;
    this.showUpdateModal = true;
  }

  selectSplunk(s: Splunk): void {
    this.selectedSplunk = this.selectedSplunk?.splunkid === s.splunkid ? null : s;
  }

  closeDetail(): void {
    this.selectedSplunk = null;
  }

  goToAddSplunk(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onSplunkAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedSplunkToUpdate = null;
    this.getAllSplunks();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedSplunkToUpdate = null;
  }

  onModalBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickedOnInteractive = target?.closest('input, button, select, textarea, .scs-dropdown');
    if (!isClickedOnInteractive) {
      this.ajouterComponent?.closeClientDropdown();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  getCommandePasserParLabel(value: unknown): string {
    switch (value) {
      case 'GI_TN': return 'GI_TN';
      case 'GI_FR': return 'GI_FR';
      case 'GI_CI': return 'GI_CI';
      default: return String(value ?? '');
    }
  }

  getFileDownloadUrl(id: number): string {
    return this.splunkService.getFileDownloadUrl(id);
  }

  formatCcMail(cc: string[] | undefined): string {
    if (!cc?.length) return '-';
    return cc.filter(e => e?.trim()).join(', ') || '-';
  }
}
