import { Component, OnInit, ViewChild } from '@angular/core';
import { VaronisService } from 'app/Services/varonis.service';
import { Varonis } from 'app/Model/Varonis';
import { PermissionService } from 'app/Services/permission.service';
import { AjoutervrComponent } from '../ajoutervr/ajoutervr.component';

@Component({
  selector: 'app-affichervr',
  templateUrl: './affichervr.component.html',
  styleUrls: ['./affichervr.component.scss']
})
export class AffichervrComponent implements OnInit {

  searchTerm = '';
  selectedVaronis: Varonis | null = null;
  varoniss: Varonis[] = [];
  filteredVaroniss: Varonis[] = [];
  unapprovedVaronis: Varonis[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedVaroniss: Varonis[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedVaronisToUpdate: Varonis | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjoutervrComponent) ajouterComponent?: AjoutervrComponent;

  constructor(
    private varonisService: VaronisService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.getAllVaronis();
  }

  onSearch(): void {
    this.filteredVaroniss = this.filterVaroniss();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllVaronis(): void {
    this.varonisService.getAllVaronis().subscribe({
      next: (data: Varonis[]) => {
        this.varoniss = data;
        this.filteredVaroniss = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération Varonis', error)
    });
  }

  filterVaroniss(): Varonis[] {
    const term = this.searchTerm.toLowerCase();
    return this.varoniss.filter((varonis) => {
      const inLicences = varonis.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const ccJoined = (varonis.ccMail || []).join(' ').toLowerCase();

      const inMainFields =
        varonis.client?.toLowerCase().includes(term) ||
        varonis.nomDuContact?.toLowerCase().includes(term) ||
        varonis.adresseEmailContact?.toLowerCase().includes(term) ||
        varonis.mailAdmin?.toLowerCase().includes(term) ||
        varonis.numero?.toLowerCase().includes(term) ||
        varonis.remarque?.toLowerCase().includes(term) ||
        ccJoined.includes(term) ||
        varonis.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVaroniss.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedVaroniss = this.filteredVaroniss.slice(start, start + this.pageSize);
  }

  approveVaronis(id: number): void {
    this.varonisService.activate(id).subscribe({
      next: () => {
        this.unapprovedVaronis = this.unapprovedVaronis.filter(v => v.varonisId !== id);
        this.filteredVaroniss = this.filteredVaroniss.filter(v => v.varonisId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteVaronis(item: { varonisId?: number; client?: string }): void {
    const id = item?.varonisId;
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

  confirmDeleteVaronis(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.varonisService.deleteVaronis(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedVaronis?.varonisId === id) {
          this.selectedVaronis = null;
        }
        this.getAllVaronis();
        alert('Varonis supprimé avec succès');
      },
      error: error => {
        console.error('Erreur suppression Varonis', error);
        alert('Échec suppression');
      }
    });
  }

  updateVaronis(varonis: Varonis): void {
    this.selectedVaronisToUpdate = varonis;
    this.showUpdateModal = true;
  }

  selectVaronis(x: Varonis): void {
    this.selectedVaronis = this.selectedVaronis?.varonisId === x.varonisId ? null : x;
  }

  closeDetail(): void {
    this.selectedVaronis = null;
  }

  goToAddVaronis(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onVaronisAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedVaronisToUpdate = null;
    this.getAllVaronis();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedVaronisToUpdate = null;
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

  formatCcMail(cc: string[] | undefined): string {
    if (!cc?.length) return '-';
    return cc.filter(e => e?.trim()).join(', ') || '-';
  }

  getFileDownloadUrl(id: number): string {
    return this.varonisService.getFileDownloadUrl(id);
  }
}
