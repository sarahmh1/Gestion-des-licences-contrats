import { Component, OnInit, ViewChild } from '@angular/core';
import { SecPointService } from 'app/Services/sec-point.service';
import { SecPoint } from 'app/Model/SecPoint';
import { PermissionService } from 'app/Services/permission.service';
import { AjoutersComponent } from '../ajouters/ajouters.component';

@Component({
  selector: 'app-affichers-secpoint',
  templateUrl: './affichers.component.html',
  styleUrls: ['./affichers.component.scss']
})
export class AffichersComponent implements OnInit {

  searchTerm = '';
  selectedSecPoint: SecPoint | null = null;
  secPoints: SecPoint[] = [];
  filteredSecPoints: SecPoint[] = [];
  unapprovedSecPoints: SecPoint[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedSecPoints: SecPoint[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedSecPointToUpdate: SecPoint | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjoutersComponent) ajouterComponent?: AjoutersComponent;

  constructor(
    private secPointService: SecPointService,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllSecPoints();
  }

  onSearch(): void {
    this.filteredSecPoints = this.filterSecPoints();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllSecPoints(): void {
    this.secPointService.getAllSecPoints().subscribe({
      next: (data: SecPoint[]) => {
        this.secPoints = data;
        this.filteredSecPoints = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération SecPoints', error)
    });
  }

  filterSecPoints(): SecPoint[] {
    const term = this.searchTerm.toLowerCase();
    return this.secPoints.filter((secPoint) => {
      const inLicences = secPoint.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        secPoint.client?.toLowerCase().includes(term) ||
        secPoint.nomDuContact?.toLowerCase().includes(term) ||
        secPoint.adresseEmailContact?.toLowerCase().includes(term) ||
        secPoint.numero?.toLowerCase().includes(term) ||
        secPoint.remarque?.toLowerCase().includes(term) ||
        secPoint.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSecPoints.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedSecPoints = this.filteredSecPoints.slice(start, start + this.pageSize);
  }

  approveSecPoint(id: number): void {
    this.secPointService.activate(id).subscribe({
      next: () => {
        this.unapprovedSecPoints = this.unapprovedSecPoints.filter(s => s.secPointId !== id);
        this.filteredSecPoints = this.filteredSecPoints.filter(s => s.secPointId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteSecPoint(item: { secPointId?: number; client?: string }): void {
    const id = item?.secPointId;
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

  confirmDeleteSecPoint(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.secPointService.deleteSecPoint(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedSecPoint?.secPointId === id) {
          this.selectedSecPoint = null;
        }
        this.getAllSecPoints();
        alert('SecPoint supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression SecPoint', error);
        alert('Échec suppression');
      }
    });
  }

  updateSecPoint(secPoint: SecPoint): void {
    this.selectedSecPointToUpdate = secPoint;
    this.showUpdateModal = true;
  }

  selectSecPoint(sp: SecPoint): void {
    this.selectedSecPoint = this.selectedSecPoint?.secPointId === sp.secPointId ? null : sp;
  }

  closeDetail(): void {
    this.selectedSecPoint = null;
  }

  goToAddSecPoint(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onSecPointAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedSecPointToUpdate = null;
    this.getAllSecPoints();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedSecPointToUpdate = null;
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
    return this.secPointService.getFileDownloadUrl(id);
  }

  formatCcMail(cc: string[] | undefined): string {
    if (!cc?.length) return '-';
    return cc.filter(e => e?.trim()).join(', ') || '-';
  }
}
