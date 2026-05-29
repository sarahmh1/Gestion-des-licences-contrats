import { Component, OnInit, ViewChild } from '@angular/core';
import { WallixService } from 'app/Services/wallix.service';
import { Wallix } from 'app/Model/Wallix';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterwComponent } from '../ajouterw/ajouterw.component';

@Component({
  selector: 'app-afficherw',
  templateUrl: './afficherw.component.html',
  styleUrls: ['./afficherw.component.scss']
})
export class AfficherwComponent implements OnInit {
  searchTerm = '';
  wallixs: Wallix[] = [];
  filteredWallixs: Wallix[] = [];
  selectedWallix: Wallix | null = null;
  unapprovedWallixs: Wallix[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedWallix: Wallix[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedWallixToUpdate: Wallix | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterwComponent) ajouterComponent?: AjouterwComponent;

  constructor(
    private wallixService: WallixService,
    private router: Router,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllWallixs();
  }

  onSearch(): void {
    this.filteredWallixs = this.filterWallixs();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllWallixs(): void {
    this.wallixService.getAllWallixs().subscribe({
      next: (data: Wallix[]) => {
        this.wallixs = data;
        this.filteredWallixs = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur recuperation Wallixs', error)
    });
  }

  filterWallixs(): Wallix[] {
    const term = this.searchTerm.toLowerCase();
    return this.wallixs.filter((wallix) => {
      const inLicences = wallix.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        wallix.client?.toLowerCase().includes(term) ||
        wallix.nomDuContact?.toLowerCase().includes(term) ||
        wallix.adresseEmailContact?.toLowerCase().includes(term) ||
        wallix.numero?.toLowerCase().includes(term) ||
        wallix.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredWallixs.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedWallix = this.filteredWallixs.slice(start, start + this.pageSize);
  }

  approveWallix(id: number): void {
    this.wallixService.activate(id).subscribe(() => {
      this.unapprovedWallixs = this.unapprovedWallixs.filter(w => w.wallixId !== id);
      this.filteredWallixs = this.filteredWallixs.filter(w => w.wallixId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
    });
  }

  requestDeleteWallix(item: { wallixId?: number; client?: string }): void {
    if (item?.wallixId == null) return;
    this.pendingDeleteId = item.wallixId;
    this.deleteModalDetail = item.client ? `Client : ${item.client}` : '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
    this.deleteModalDetail = '';
  }

  confirmDeleteWallix(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.wallixService.deleteWallix(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedWallix?.wallixId === id) {
          this.selectedWallix = null;
        }
        this.getAllWallixs();
        alert('Wallix supprime avec succes');
      },
      error: (error) => {
        console.error('Erreur suppression wallix', error);
        alert('Echec suppression');
      }
    });
  }

  selectWallix(w: Wallix): void {
    this.selectedWallix = this.selectedWallix?.wallixId === w.wallixId ? null : w;
  }

  closeDetail(): void {
    this.selectedWallix = null;
  }

  goToAddWallix(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onWallixAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedWallixToUpdate = null;
    this.getAllWallixs();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  updateWallix(wallix: Wallix): void {
    this.selectedWallixToUpdate = wallix;
    this.showUpdateModal = true;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedWallixToUpdate = null;
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

  getFileDownloadUrl(wallixId: number): string {
    return this.wallixService.getFileDownloadUrlById(wallixId);
  }
}
