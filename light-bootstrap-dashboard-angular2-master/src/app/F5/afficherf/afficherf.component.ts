import { Component, OnInit, ViewChild } from '@angular/core';
import { F5Service } from 'app/Services/f5.service';
import { F5 } from 'app/Model/F5';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterfComponent } from '../ajouterf/ajouterf.component';

@Component({
  selector: 'app-afficherf',
  templateUrl: './afficherf.component.html',
  styleUrls: ['./afficherf.component.scss']
})
export class AfficherfComponent implements OnInit {

  searchTerm = '';
  selectedF5: F5 | null = null;
  f5s: F5[] = [];
  filteredF5s: F5[] = [];
  unapprovedF5s: F5[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedF5s: F5[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedF5ToUpdate: F5 | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterfComponent) ajouterComponent?: AjouterfComponent;

  constructor(
    private f5Service: F5Service,
    public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.f5Service.getFileDownloadUrl(id);
  }

  ngOnInit(): void {
    this.getAllF5s();
  }

  onSearch(): void {
    this.filteredF5s = this.filterF5s();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllF5s(): void {
    this.f5Service.getAllF5s().subscribe({
      next: (data: F5[]) => {
        this.f5s = data;
        this.filteredF5s = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération F5', error)
    });
  }

  filterF5s(): F5[] {
    const term = this.searchTerm.toLowerCase();
    return this.f5s.filter((f5) => {
      const inLicences = f5.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        f5.client?.toLowerCase().includes(term) ||
        f5.nomDuContact?.toLowerCase().includes(term) ||
        f5.adresseEmailContact?.toLowerCase().includes(term) ||
        f5.mailAdmin?.toLowerCase().includes(term) ||
        f5.numero?.toLowerCase().includes(term) ||
        f5.remarque?.toLowerCase().includes(term) ||
        f5.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredF5s.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedF5s = this.filteredF5s.slice(start, start + this.pageSize);
  }

  approveF5(id: number): void {
    this.f5Service.activate(id).subscribe({
      next: () => {
        this.unapprovedF5s = this.unapprovedF5s.filter(f5 => f5.f5Id !== id);
        this.filteredF5s = this.filteredF5s.filter(f5 => f5.f5Id !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteF5(item: { f5Id?: number; client?: string }): void {
    const id = item?.f5Id;
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

  confirmDeleteF5(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.f5Service.deleteF5(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedF5?.f5Id === id) {
          this.selectedF5 = null;
        }
        this.getAllF5s();
        alert('F5 supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression F5', error);
        alert('Échec suppression');
      }
    });
  }

  updateF5(f5: F5): void {
    this.selectedF5ToUpdate = f5;
    this.showUpdateModal = true;
  }

  selectF5(x: F5): void {
    this.selectedF5 = this.selectedF5?.f5Id === x.f5Id ? null : x;
  }

  closeDetail(): void {
    this.selectedF5 = null;
  }

  goToAddF5(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onF5Added(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedF5ToUpdate = null;
    this.getAllF5s();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedF5ToUpdate = null;
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
