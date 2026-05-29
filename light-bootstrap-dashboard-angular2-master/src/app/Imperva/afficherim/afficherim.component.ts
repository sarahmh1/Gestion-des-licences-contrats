import { Component, OnInit, ViewChild } from '@angular/core';
import { ImpervaService } from 'app/Services/imperva.service';
import { Imperva } from 'app/Model/Imperva';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterimComponent } from '../ajouterim/ajouterim.component';

@Component({
  selector: 'app-afficherim',
  templateUrl: './afficherim.component.html',
  styleUrls: ['./afficherim.component.scss']
})
export class AfficherimComponent implements OnInit {
  searchTerm = '';
  selectedImperva: Imperva | null = null;
  impervas: Imperva[] = [];
  filteredImpervas: Imperva[] = [];
  unapprovedImpervas: Imperva[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedImpervas: Imperva[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedImpervaToUpdate: Imperva | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterimComponent) ajouterComponent?: AjouterimComponent;

  constructor(
    private impervaService: ImpervaService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.getAllImpervas();
  }

  onSearch(): void {
    this.filteredImpervas = this.filterImpervas();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllImpervas(): void {
    this.impervaService.getAllImpervas().subscribe({
      next: (data: Imperva[]) => {
        this.impervas = data;
        this.filteredImpervas = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: error => console.error('Erreur récupération Imperva', error)
    });
  }

  filterImpervas(): Imperva[] {
    const term = this.searchTerm.toLowerCase();
    return this.impervas.filter(imperva => {
      const inLicences = imperva.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const ccJoined = (imperva.ccMail || []).join(' ').toLowerCase();

      const inMainFields =
        imperva.client?.toLowerCase().includes(term) ||
        imperva.nomDuContact?.toLowerCase().includes(term) ||
        imperva.adresseEmailContact?.toLowerCase().includes(term) ||
        imperva.mailAdmin?.toLowerCase().includes(term) ||
        imperva.numero?.toLowerCase().includes(term) ||
        imperva.remarque?.toLowerCase().includes(term) ||
        ccJoined.includes(term) ||
        imperva.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredImpervas.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedImpervas = this.filteredImpervas.slice(start, start + this.pageSize);
  }

  approveImperva(id: number): void {
    this.impervaService.activate(id).subscribe({
      next: () => {
        this.unapprovedImpervas = this.unapprovedImpervas.filter(v => v.impervaId !== id);
        this.filteredImpervas = this.filteredImpervas.filter(v => v.impervaId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteImperva(item: { impervaId?: number; client?: string }): void {
    const id = item?.impervaId;
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

  confirmDeleteImperva(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.impervaService.deleteImperva(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedImperva?.impervaId === id) {
          this.selectedImperva = null;
        }
        this.getAllImpervas();
        alert('Licence Imperva supprimée avec succès');
      },
      error: error => {
        console.error('Erreur suppression Imperva', error);
        alert('Échec suppression');
      }
    });
  }

  updateImperva(imperva: Imperva): void {
    this.selectedImpervaToUpdate = imperva;
    this.showUpdateModal = true;
  }

  selectImperva(x: Imperva): void {
    this.selectedImperva = this.selectedImperva?.impervaId === x.impervaId ? null : x;
  }

  closeDetail(): void {
    this.selectedImperva = null;
  }

  goToAddImperva(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onImpervaAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedImpervaToUpdate = null;
    this.getAllImpervas();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedImpervaToUpdate = null;
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
    return this.impervaService.getFileDownloadUrl(id);
  }
}
