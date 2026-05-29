import { Component, OnInit, ViewChild } from '@angular/core';
import { FortraService } from 'app/Services/fortra.service';
import { Fortra } from 'app/Model/Fortra';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterfortraComponent } from '../ajouterfortra/ajouterfortra.component';

@Component({
  selector: 'app-afficherfortra',
  templateUrl: './afficherfortra.component.html',
  styleUrls: ['./afficherfortra.component.scss']
})
export class AfficherfortraComponent implements OnInit {

  searchTerm = '';
  selectedFortra: Fortra | null = null;
  fortras: Fortra[] = [];
  filteredFortras: Fortra[] = [];
  unapprovedFortras: Fortra[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedFortras: Fortra[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedFortraToUpdate: Fortra | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterfortraComponent) ajouterComponent?: AjouterfortraComponent;

  constructor(
    private fortraService: FortraService,
    public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.fortraService.getFileDownloadUrl(id);
  }

  ngOnInit(): void {
    this.getAllFortras();
  }

  onSearch(): void {
    this.filteredFortras = this.filterFortras();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllFortras(): void {
    this.fortraService.getAllFortras().subscribe({
      next: (data: Fortra[]) => {
        this.fortras = data;
        this.filteredFortras = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération Fortra', error)
    });
  }

  filterFortras(): Fortra[] {
    const term = this.searchTerm.toLowerCase();
    return this.fortras.filter((fortra) => {
      const inLicences = fortra.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        fortra.client?.toLowerCase().includes(term) ||
        fortra.nomDuContact?.toLowerCase().includes(term) ||
        fortra.adresseEmailContact?.toLowerCase().includes(term) ||
        fortra.mailAdmin?.toLowerCase().includes(term) ||
        fortra.numero?.toLowerCase().includes(term) ||
        fortra.remarque?.toLowerCase().includes(term) ||
        fortra.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredFortras.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedFortras = this.filteredFortras.slice(start, start + this.pageSize);
  }

  approveFortra(id: number): void {
    this.fortraService.activate(id).subscribe({
      next: () => {
        this.unapprovedFortras = this.unapprovedFortras.filter(f => f.fortraId !== id);
        this.filteredFortras = this.filteredFortras.filter(f => f.fortraId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteFortra(item: { fortraId?: number; client?: string }): void {
    const id = item?.fortraId;
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

  confirmDeleteFortra(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.fortraService.deleteFortra(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedFortra?.fortraId === id) {
          this.selectedFortra = null;
        }
        this.getAllFortras();
        alert('Fortra supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression Fortra', error);
        alert('Échec suppression');
      }
    });
  }

  updateFortra(fortra: Fortra): void {
    this.selectedFortraToUpdate = fortra;
    this.showUpdateModal = true;
  }

  selectFortra(x: Fortra): void {
    this.selectedFortra = this.selectedFortra?.fortraId === x.fortraId ? null : x;
  }

  closeDetail(): void {
    this.selectedFortra = null;
  }

  goToAddFortra(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onFortraAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedFortraToUpdate = null;
    this.getAllFortras();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedFortraToUpdate = null;
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
