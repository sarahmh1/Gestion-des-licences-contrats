import { Component, OnInit, ViewChild } from '@angular/core';
import { AlwarebytesService } from 'app/Services/alwarebytes.service';
import { Alwarebytes } from 'app/Model/Alwarebytes';
import { PermissionService } from 'app/Services/permission.service';
import { AjouteraComponent } from '../ajoutera/ajoutera.component';

@Component({
  selector: 'app-affichera',
  templateUrl: './affichera.component.html',
  styleUrls: ['./affichera.component.scss']
})
export class AfficheraComponent implements OnInit {

  searchTerm = '';
  selectedAlwarebytes: Alwarebytes | null = null;
  alwarebytess: Alwarebytes[] = [];
  filteredAlwarebytess: Alwarebytes[] = [];
  unapprovedAlwarebytes: Alwarebytes[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedAlwarebytess: Alwarebytes[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedAlwarebytesToUpdate: Alwarebytes | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouteraComponent) ajouterComponent?: AjouteraComponent;

  constructor(
    private alwarebytesService: AlwarebytesService,
    public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.alwarebytesService.getFileDownloadUrl(id);
  }

  ngOnInit(): void {
    this.getAllAlwarebytess();
  }

  onSearch(): void {
    this.filteredAlwarebytess = this.filterAlwarebytess();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllAlwarebytess(): void {
    this.alwarebytesService.getAllAlwarebytess().subscribe({
      next: (data: Alwarebytes[]) => {
        this.alwarebytess = data;
        this.filteredAlwarebytess = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération Malwarebytes', error)
    });
  }

  filterAlwarebytess(): Alwarebytes[] {
    const term = this.searchTerm.toLowerCase();
    return this.alwarebytess.filter((alwarebytes) => {
      const inLicences = alwarebytes.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        alwarebytes.client?.toLowerCase().includes(term) ||
        alwarebytes.nomDuContact?.toLowerCase().includes(term) ||
        alwarebytes.adresseEmailContact?.toLowerCase().includes(term) ||
        alwarebytes.mailAdmin?.toLowerCase().includes(term) ||
        alwarebytes.numero?.toLowerCase().includes(term) ||
        alwarebytes.remarque?.toLowerCase().includes(term) ||
        alwarebytes.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAlwarebytess.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedAlwarebytess = this.filteredAlwarebytess.slice(start, start + this.pageSize);
  }

  approveAlwarebytes(id: number): void {
    this.alwarebytesService.activate(id).subscribe({
      next: () => {
        this.unapprovedAlwarebytes = this.unapprovedAlwarebytes.filter(a => a.alwarebytesId !== id);
        this.filteredAlwarebytess = this.filteredAlwarebytess.filter(a => a.alwarebytesId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteAlwarebytes(item: { alwarebytesId?: number; client?: string }): void {
    const id = item?.alwarebytesId;
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

  confirmDeleteAlwarebytes(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.alwarebytesService.deleteAlwarebytes(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedAlwarebytes?.alwarebytesId === id) {
          this.selectedAlwarebytes = null;
        }
        this.getAllAlwarebytess();
        alert('Licence supprimée avec succès');
      },
      error: error => {
        console.error('Erreur suppression Malwarebytes', error);
        alert('Échec suppression');
      }
    });
  }

  updateAlwarebytes(alwarebytes: Alwarebytes): void {
    this.selectedAlwarebytesToUpdate = alwarebytes;
    this.showUpdateModal = true;
  }

  selectAlwarebytes(x: Alwarebytes): void {
    this.selectedAlwarebytes = this.selectedAlwarebytes?.alwarebytesId === x.alwarebytesId ? null : x;
  }

  closeDetail(): void {
    this.selectedAlwarebytes = null;
  }

  goToAddAlwarebytes(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onAlwarebytesAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedAlwarebytesToUpdate = null;
    this.getAllAlwarebytess();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedAlwarebytesToUpdate = null;
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
}
