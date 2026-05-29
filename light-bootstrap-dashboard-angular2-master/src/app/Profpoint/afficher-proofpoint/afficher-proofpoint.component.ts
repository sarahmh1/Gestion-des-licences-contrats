import { Component, OnInit, ViewChild } from '@angular/core';
import { ProofpointService } from 'app/Services/proofpoint.service';
import { Proofpoint } from 'app/Model/Proofpoint';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterProofpointComponent } from '../ajouter-proofpoint/ajouter-proofpoint.component';

@Component({
  selector: 'app-afficher-proofpoint',
  templateUrl: './afficher-proofpoint.component.html',
  styleUrls: ['./afficher-proofpoint.component.scss']
})
export class AfficherProofpointComponent implements OnInit {
  searchTerm = '';
  selectedProofpoint: Proofpoint | null = null;
  proofpoints: Proofpoint[] = [];
  filteredProofpoints: Proofpoint[] = [];
  unapprovedProofpoints: Proofpoint[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedProofpoints: Proofpoint[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedProofpointToUpdate: Proofpoint | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterProofpointComponent) ajouterComponent?: AjouterProofpointComponent;

  constructor(
    private proofpointService: ProofpointService,
    private router: Router,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllProofpoints();
  }

  onSearch(): void {
    this.filteredProofpoints = this.filterProofpoints();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllProofpoints(): void {
    this.proofpointService.getAllProofpoints().subscribe({
      next: (data: Proofpoint[]) => {
        this.proofpoints = data;
        this.filteredProofpoints = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur recuperation Proofpoints', error)
    });
  }

  filterProofpoints(): Proofpoint[] {
    const term = this.searchTerm.toLowerCase();
    return this.proofpoints.filter((proofpoint) => {
      const inLicences = proofpoint.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        proofpoint.client?.toLowerCase().includes(term) ||
        proofpoint.nomDuContact?.toLowerCase().includes(term) ||
        proofpoint.adresseEmailContact?.toLowerCase().includes(term) ||
        proofpoint.numero?.toLowerCase().includes(term) ||
        proofpoint.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProofpoints.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedProofpoints = this.filteredProofpoints.slice(start, start + this.pageSize);
  }

  approveProofpoint(id: number): void {
    this.proofpointService.activate(id).subscribe(() => {
      this.unapprovedProofpoints = this.unapprovedProofpoints.filter(p => p.proofpointId !== id);
      this.filteredProofpoints = this.filteredProofpoints.filter(p => p.proofpointId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
    });
  }

  requestDeleteProofpoint(item: { proofpointId?: number; client?: string }): void {
    if (item?.proofpointId == null) return;
    this.pendingDeleteId = item.proofpointId;
    this.deleteModalDetail = item.client ? `Client : ${item.client}` : '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
    this.deleteModalDetail = '';
  }

  confirmDeleteProofpoint(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.proofpointService.deleteProofpoint(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedProofpoint?.proofpointId === id) {
          this.selectedProofpoint = null;
        }
        this.getAllProofpoints();
        alert('Proofpoint supprime avec succes');
      },
      error: (error) => {
        console.error('Erreur suppression proofpoint', error);
        alert('Echec suppression');
      }
    });
  }

  selectProofpoint(p: Proofpoint): void {
    this.selectedProofpoint = this.selectedProofpoint?.proofpointId === p.proofpointId ? null : p;
  }

  closeDetail(): void {
    this.selectedProofpoint = null;
  }

  goToAddProofpoint(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onProofpointAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedProofpointToUpdate = null;
    this.getAllProofpoints();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  updateProofpoint(proofpoint: Proofpoint): void {
    this.selectedProofpointToUpdate = proofpoint;
    this.showUpdateModal = true;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedProofpointToUpdate = null;
  }

  onModalBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickedOnInteractive = target?.closest('input, button, select, .scs-dropdown');
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

  getFileDownloadUrl(proofpointId: number): string {
    return this.proofpointService.getFileDownloadUrlById(proofpointId);
  }
}
