import { Component, OnInit, ViewChild } from '@angular/core';
import { MicrosoftO365Service } from 'app/Services/microsoft-o365.service';
import { MicrosoftO365 } from 'app/Model/MicrosoftO365';
import { PermissionService } from 'app/Services/permission.service';
import { AjoutermComponent } from '../ajouterm/ajouterm.component';

@Component({
  selector: 'app-afficherm',
  templateUrl: './afficherm.component.html',
  styleUrls: ['./afficherm.component.scss']
})
export class AffichermComponent implements OnInit {
  searchTerm = '';
  selectedMicrosoftO365: MicrosoftO365 | null = null;
  microsofts: MicrosoftO365[] = [];
  filteredMicrosofts: MicrosoftO365[] = [];
  unapprovedMicrosofts: MicrosoftO365[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedMicrosoftO365s: MicrosoftO365[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedMicrosoftToUpdate: MicrosoftO365 | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjoutermComponent) ajouterComponent?: AjoutermComponent;

  constructor(
    private microsoftO365Service: MicrosoftO365Service,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.getAllMicrosoftO365s();
  }

  onSearch(): void {
    this.filteredMicrosofts = this.filterMicrosoftO365s();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllMicrosoftO365s(): void {
    this.microsoftO365Service.getAllMicrosoftO365s().subscribe({
      next: (data: MicrosoftO365[]) => {
        this.microsofts = data;
        this.filteredMicrosofts = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: error => console.error('Erreur récupération Microsoft O365', error)
    });
  }

  filterMicrosoftO365s(): MicrosoftO365[] {
    const term = this.searchTerm.toLowerCase();
    return this.microsofts.filter(microsoftO365 => {
      const inLicences = microsoftO365.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const ccJoined = (microsoftO365.ccMail || []).join(' ').toLowerCase();

      const inMainFields =
        microsoftO365.client?.toLowerCase().includes(term) ||
        microsoftO365.nomDuContact?.toLowerCase().includes(term) ||
        microsoftO365.adresseEmailContact?.toLowerCase().includes(term) ||
        microsoftO365.mailAdmin?.toLowerCase().includes(term) ||
        microsoftO365.numero?.toLowerCase().includes(term) ||
        microsoftO365.remarque?.toLowerCase().includes(term) ||
        ccJoined.includes(term) ||
        microsoftO365.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredMicrosofts.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedMicrosoftO365s = this.filteredMicrosofts.slice(start, start + this.pageSize);
  }

  approveMicrosoftO365(id: number): void {
    this.microsoftO365Service.activate(id).subscribe({
      next: () => {
        this.unapprovedMicrosofts = this.unapprovedMicrosofts.filter(m => m.microsoftO365Id !== id);
        this.filteredMicrosofts = this.filteredMicrosofts.filter(m => m.microsoftO365Id !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteMicrosoftO365(item: { microsoftO365Id?: number; client?: string }): void {
    const id = item?.microsoftO365Id;
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

  confirmDeleteMicrosoftO365(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.microsoftO365Service.deleteMicrosoftO365(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedMicrosoftO365?.microsoftO365Id === id) {
          this.selectedMicrosoftO365 = null;
        }
        this.getAllMicrosoftO365s();
        alert('Licence Microsoft O365 supprimée avec succès');
      },
      error: error => {
        console.error('Erreur suppression Microsoft O365', error);
        alert('Échec suppression');
      }
    });
  }

  updateMicrosoftO365(microsoftO365: MicrosoftO365): void {
    this.selectedMicrosoftToUpdate = microsoftO365;
    this.showUpdateModal = true;
  }

  selectMicrosoftO365(x: MicrosoftO365): void {
    this.selectedMicrosoftO365 =
      this.selectedMicrosoftO365?.microsoftO365Id === x.microsoftO365Id ? null : x;
  }

  closeDetail(): void {
    this.selectedMicrosoftO365 = null;
  }

  goToAddmicrosoftO365(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onMicrosoftAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedMicrosoftToUpdate = null;
    this.getAllMicrosoftO365s();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedMicrosoftToUpdate = null;
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
    return this.microsoftO365Service.getFileDownloadUrl(id);
  }
}
