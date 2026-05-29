import { Component, OnInit, ViewChild } from '@angular/core';
import { NetskopeService } from 'app/Services/neskope.service';
import { Netskope } from 'app/Model/Netskope';
import { PermissionService } from 'app/Services/permission.service';
import { AjouternComponent } from '../ajoutern/ajoutern.component';

@Component({
  selector: 'app-affichern',
  templateUrl: './affichern.component.html',
  styleUrls: ['./affichern.component.scss']
})
export class AffichernComponent implements OnInit {

  searchTerm = '';
  selectedNetskope: Netskope | null = null;
  netskopes: Netskope[] = [];
  filteredNetskopes: Netskope[] = [];
  unapprovedNetskopes: Netskope[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedNetskopes: Netskope[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedNetskopeToUpdate: Netskope | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouternComponent) ajouterComponent?: AjouternComponent;

  constructor(
    private netskopeService: NetskopeService,
    public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.netskopeService.getFileDownloadUrl(id);
  }

  ngOnInit(): void {
    this.getAllNetskopes();
  }

  onSearch(): void {
    this.filteredNetskopes = this.filterNetskopes();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllNetskopes(): void {
    this.netskopeService.getAllNetskopes().subscribe({
      next: (data: Netskope[]) => {
        this.netskopes = data;
        this.filteredNetskopes = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération Netskopes', error)
    });
  }

  filterNetskopes(): Netskope[] {
    const term = this.searchTerm.toLowerCase();
    return this.netskopes.filter((netskope) => {
      const inLicences = netskope.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        netskope.client?.toLowerCase().includes(term) ||
        netskope.nomDuContact?.toLowerCase().includes(term) ||
        netskope.adresseEmailContact?.toLowerCase().includes(term) ||
        netskope.numero?.toLowerCase().includes(term) ||
        netskope.remarque?.toLowerCase().includes(term) ||
        netskope.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredNetskopes.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedNetskopes = this.filteredNetskopes.slice(start, start + this.pageSize);
  }

  approveNetskope(id: number): void {
    this.netskopeService.activate(id).subscribe({
      next: () => {
        this.unapprovedNetskopes = this.unapprovedNetskopes.filter(n => n.netskopeId !== id);
        this.filteredNetskopes = this.filteredNetskopes.filter(n => n.netskopeId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteNetskope(item: { netskopeId?: number; client?: string }): void {
    const id = item?.netskopeId;
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

  confirmDeleteNetskope(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.netskopeService.deleteNetskope(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedNetskope?.netskopeId === id) {
          this.selectedNetskope = null;
        }
        this.getAllNetskopes();
        alert('Netskope supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression Netskope', error);
        alert('Échec suppression');
      }
    });
  }

  updateNetskope(netskope: Netskope): void {
    this.selectedNetskopeToUpdate = netskope;
    this.showUpdateModal = true;
  }

  selectNetskope(n: Netskope): void {
    this.selectedNetskope = this.selectedNetskope?.netskopeId === n.netskopeId ? null : n;
  }

  closeDetail(): void {
    this.selectedNetskope = null;
  }

  goToAddNetskope(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onNetskopeAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedNetskopeToUpdate = null;
    this.getAllNetskopes();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedNetskopeToUpdate = null;
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
