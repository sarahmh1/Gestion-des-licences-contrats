import { Component, OnInit, ViewChild } from '@angular/core';
import { Rapid7Service } from 'app/Services/rapid7.service';
import { Rapid7 } from 'app/Model/Rapid7';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterRapid7Component } from '../ajouter-rapid7/ajouter-rapid7.component';

@Component({
  selector: 'app-afficher-rapid7',
  templateUrl: './afficher-rapid7.component.html',
  styleUrls: ['./afficher-rapid7.component.scss']
})
export class AfficherRapid7Component implements OnInit {
  searchTerm = '';
  selectedRapid7: Rapid7 | null = null;
  rapid7s: Rapid7[] = [];
  filteredRapid7s: Rapid7[] = [];
  unapprovedRapid7s: Rapid7[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedRapid7s: Rapid7[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedRapid7ToUpdate: Rapid7 | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterRapid7Component) ajouterComponent?: AjouterRapid7Component;

  constructor(
    private rapid7Service: Rapid7Service,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllRapid7s();
  }

  onSearch(): void {
    this.filteredRapid7s = this.filterRapid7s();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllRapid7s(): void {
    this.rapid7Service.getAllRapid7s().subscribe({
      next: (data: Rapid7[]) => {
        this.rapid7s = data;
        this.filteredRapid7s = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur recuperation Rapid7s', error)
    });
  }

  filterRapid7s(): Rapid7[] {
    const term = this.searchTerm.toLowerCase();
    return this.rapid7s.filter((rapid7) => {
      const inLicences = rapid7.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        rapid7.client?.toLowerCase().includes(term) ||
        rapid7.nomDuContact?.toLowerCase().includes(term) ||
        rapid7.adresseEmailContact?.toLowerCase().includes(term) ||
        rapid7.numero?.toLowerCase().includes(term) ||
        rapid7.cleLicences?.toLowerCase().includes(term) ||
        rapid7.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRapid7s.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedRapid7s = this.filteredRapid7s.slice(start, start + this.pageSize);
  }

  approveRapid7(id: number): void {
    this.rapid7Service.activate(id).subscribe(() => {
      this.unapprovedRapid7s = this.unapprovedRapid7s.filter(r => r.rapid7Id !== id);
      this.filteredRapid7s = this.filteredRapid7s.filter(r => r.rapid7Id !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
    });
  }

  requestDeleteRapid7(item: { rapid7Id?: number; client?: string }): void {
    if (item?.rapid7Id == null) return;
    this.pendingDeleteId = item.rapid7Id;
    this.deleteModalDetail = item.client ? `Client : ${item.client}` : '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
    this.deleteModalDetail = '';
  }

  confirmDeleteRapid7(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.rapid7Service.deleteRapid7(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedRapid7?.rapid7Id === id) {
          this.selectedRapid7 = null;
        }
        this.getAllRapid7s();
        alert('Rapid7 supprime avec succes');
      },
      error: (error) => {
        console.error('Erreur suppression rapid7', error);
        alert('Echec suppression');
      }
    });
  }

  selectRapid7(x: Rapid7): void {
    this.selectedRapid7 = this.selectedRapid7?.rapid7Id === x.rapid7Id ? null : x;
  }

  closeDetail(): void {
    this.selectedRapid7 = null;
  }

  goToAddRapid7(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onRapid7Added(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedRapid7ToUpdate = null;
    this.getAllRapid7s();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  updateRapid7(rapid7: Rapid7): void {
    this.selectedRapid7ToUpdate = rapid7;
    this.showUpdateModal = true;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedRapid7ToUpdate = null;
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

  getFileDownloadUrl(rapid7Id: number): string {
    return this.rapid7Service.getFileDownloadUrlById(rapid7Id);
  }
}
