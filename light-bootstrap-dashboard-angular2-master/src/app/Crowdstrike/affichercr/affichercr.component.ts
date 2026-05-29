import { Component, OnInit, ViewChild } from '@angular/core';
import { CrowdstrikeService } from 'app/Services/crowdstrike.service';
import { Crowdstrike } from 'app/Model/Crowdstrike';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterCrowdstrikeComponent } from '../ajoutercr/ajoutercr.component';

@Component({
  selector: 'app-afficher-crowdstrike',
  templateUrl: './affichercr.component.html',
  styleUrls: ['./affichercr.component.scss']
})
export class AfficherCrowdstrikeComponent implements OnInit {
  searchTerm = '';
  selectedCrowdstrike: Crowdstrike | null = null;
  crowdstrikes: Crowdstrike[] = [];
  filteredCrowdstrikes: Crowdstrike[] = [];
  unapprovedCrowdstrikes: Crowdstrike[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedCrowdstrikes: Crowdstrike[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedCrowdstrikeToUpdate: Crowdstrike | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterCrowdstrikeComponent) ajouterComponent?: AjouterCrowdstrikeComponent;

  constructor(
    private crowdstrikeService: CrowdstrikeService,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllCrowdstrikes();
  }

  onSearch(): void {
    this.filteredCrowdstrikes = this.filterCrowdstrikes();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllCrowdstrikes(): void {
    this.crowdstrikeService.getAllCrowdstrikes().subscribe({
      next: (data: Crowdstrike[]) => {
        this.crowdstrikes = data;
        this.filteredCrowdstrikes = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => {
        console.error('Erreur recuperation Crowdstrikes', error);
        alert('Erreur lors de la recuperation des donnees');
      }
    });
  }

  filterCrowdstrikes(): Crowdstrike[] {
    const term = this.searchTerm.toLowerCase();
    return this.crowdstrikes.filter((crowdstrike) => {
      const inLicences = crowdstrike.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        crowdstrike.client?.toLowerCase().includes(term) ||
        crowdstrike.nomDuContact?.toLowerCase().includes(term) ||
        crowdstrike.adresseEmailContact?.toLowerCase().includes(term) ||
        crowdstrike.numero?.toLowerCase().includes(term) ||
        crowdstrike.remarques?.toLowerCase().includes(term) ||
        crowdstrike.dureeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCrowdstrikes.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedCrowdstrikes = this.filteredCrowdstrikes.slice(start, start + this.pageSize);
  }

  approveCrowdstrike(id: number | undefined | null): void {
    if (id == null) {
      alert('Erreur: ID non valide pour l\'approbation');
      return;
    }
    this.crowdstrikeService.activate(id).subscribe({
      next: () => {
        this.unapprovedCrowdstrikes = this.unapprovedCrowdstrikes.filter(c => c.crowdstrikeid !== id);
        this.filteredCrowdstrikes = this.filteredCrowdstrikes.filter(c => c.crowdstrikeid !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
        alert('CrowdStrike approuve avec succes');
      },
      error: err => {
        console.error('Erreur lors de l\'approbation', err);
        alert('Erreur lors de l\'approbation');
      }
    });
  }

  requestDeleteCrowdstrike(item: { crowdstrikeid?: number; client?: string }): void {
    const id = item?.crowdstrikeid;
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

  confirmDeleteCrowdstrike(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.crowdstrikeService.deleteCrowdstrike(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedCrowdstrike?.crowdstrikeid === id) {
          this.selectedCrowdstrike = null;
        }
        this.getAllCrowdstrikes();
        alert('CrowdStrike supprime avec succes');
      },
      error: (error) => {
        console.error('Erreur suppression CrowdStrike', error);
        alert('Erreur lors de la suppression');
      }
    });
  }

  updateCrowdstrike(crowdstrike: Crowdstrike): void {
    if (!crowdstrike.crowdstrikeid) {
      alert('Erreur: ID non valide pour la mise a jour');
      return;
    }
    this.selectedCrowdstrikeToUpdate = crowdstrike;
    this.showUpdateModal = true;
  }

  goToAddCrowdstrike(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onCrowdstrikeAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedCrowdstrikeToUpdate = null;
    this.getAllCrowdstrikes();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedCrowdstrikeToUpdate = null;
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

  getFileDownloadUrl(crowdstrikeid: number): string {
    return this.crowdstrikeService.getFileDownloadUrlById(crowdstrikeid);
  }

  selectCrowdstrike(x: Crowdstrike): void {
    this.selectedCrowdstrike = this.selectedCrowdstrike?.crowdstrikeid === x.crowdstrikeid ? null : x;
  }

  closeDetail(): void {
    this.selectedCrowdstrike = null;
  }
}
