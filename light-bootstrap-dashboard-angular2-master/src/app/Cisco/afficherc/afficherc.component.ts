import { Component, OnInit, ViewChild } from '@angular/core';
import { CiscoService } from 'app/Services/cisco.service';
import { Cisco } from 'app/Model/Cisco';
import { PermissionService } from 'app/Services/permission.service';
import { AjoutercComponent } from '../ajouterc/ajouterc.component';

@Component({
  selector: 'app-afficherc',
  templateUrl: './afficherc.component.html',
  styleUrls: ['./afficherc.component.scss']
})
export class AffichercComponent implements OnInit {
  searchTerm = '';
  selectedCisco: Cisco | null = null;
  ciscos: Cisco[] = [];
  filteredCiscos: Cisco[] = [];
  unapprovedCiscos: Cisco[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedCiscos: Cisco[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedCiscoToUpdate: Cisco | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjoutercComponent) ajouterComponent?: AjoutercComponent;

  constructor(
    private ciscoService: CiscoService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.getAllCiscos();
  }

  onSearch(): void {
    this.filteredCiscos = this.filterCiscos();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllCiscos(): void {
    this.ciscoService.getAllCiscos().subscribe({
      next: (data: Cisco[]) => {
        this.ciscos = data;
        this.filteredCiscos = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: error => console.error('Erreur récupération Cisco', error)
    });
  }

  filterCiscos(): Cisco[] {
    const term = this.searchTerm.toLowerCase();
    return this.ciscos.filter(cisco => {
      const inLicences = cisco.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const ccJoined = (cisco.ccMail || []).join(' ').toLowerCase();

      const inMainFields =
        cisco.client?.toLowerCase().includes(term) ||
        cisco.nomDuContact?.toLowerCase().includes(term) ||
        cisco.adresseEmailContact?.toLowerCase().includes(term) ||
        cisco.mailAdmin?.toLowerCase().includes(term) ||
        cisco.numero?.toLowerCase().includes(term) ||
        cisco.remarque?.toLowerCase().includes(term) ||
        ccJoined.includes(term) ||
        cisco.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCiscos.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedCiscos = this.filteredCiscos.slice(start, start + this.pageSize);
  }

  approveCisco(id: number): void {
    this.ciscoService.activate(id).subscribe({
      next: () => {
        this.unapprovedCiscos = this.unapprovedCiscos.filter(c => c.ciscoId !== id);
        this.filteredCiscos = this.filteredCiscos.filter(c => c.ciscoId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteCisco(item: { ciscoId?: number; client?: string }): void {
    const id = item?.ciscoId;
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

  confirmDeleteCisco(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.ciscoService.deleteCisco(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedCisco?.ciscoId === id) {
          this.selectedCisco = null;
        }
        this.getAllCiscos();
        alert('Licence Cisco supprimée avec succès');
      },
      error: error => {
        console.error('Erreur suppression Cisco', error);
        alert('Échec suppression');
      }
    });
  }

  updateCisco(cisco: Cisco): void {
    this.selectedCiscoToUpdate = cisco;
    this.showUpdateModal = true;
  }

  selectCisco(x: Cisco): void {
    this.selectedCisco = this.selectedCisco?.ciscoId === x.ciscoId ? null : x;
  }

  closeDetail(): void {
    this.selectedCisco = null;
  }

  goToAddCisco(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onCiscoAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedCiscoToUpdate = null;
    this.getAllCiscos();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedCiscoToUpdate = null;
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
    return this.ciscoService.getFileDownloadUrl(id);
  }
}
