import { Component, OnInit, ViewChild } from '@angular/core';
import { BitdefenderService } from 'app/Services/bitdefender.service';
import { Bitdefender } from 'app/Model/Bitdefender';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterbComponent } from '../ajouteb/ajouterb.component';

@Component({
  selector: 'app-afficherb',
  templateUrl: './afficherb.component.html',
  styleUrls: ['./afficherb.component.scss']
})
export class AfficherbComponent implements OnInit {

  searchTerm = '';
  selectedBitdefender: Bitdefender | null = null;
  bitdefenders: Bitdefender[] = [];
  filteredBitdefenders: Bitdefender[] = [];
  unapprovedBitdefenders: Bitdefender[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedBitdefenders: Bitdefender[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedBitdefenderToUpdate: Bitdefender | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterbComponent) ajouterComponent?: AjouterbComponent;

  constructor(
    private bitdefenderService: BitdefenderService,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllBitdefenders();
  }

  onSearch(): void {
    this.filteredBitdefenders = this.filterBitdefenders();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllBitdefenders(): void {
    this.bitdefenderService.getAllBitdefenders().subscribe({
      next: (data: Bitdefender[]) => {
        this.bitdefenders = data;
        this.filteredBitdefenders = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération bitdefenders', error)
    });
  }

  filterBitdefenders(): Bitdefender[] {
    const term = this.searchTerm.toLowerCase();
    return this.bitdefenders.filter((bitdefender) => {
      const inLicences = bitdefender.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        bitdefender.client?.toLowerCase().includes(term) ||
        bitdefender.nomDuContact?.toLowerCase().includes(term) ||
        bitdefender.adresseEmailContact?.toLowerCase().includes(term) ||
        bitdefender.numero?.toLowerCase().includes(term) ||
        bitdefender.remarque?.toLowerCase().includes(term) ||
        bitdefender.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBitdefenders.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedBitdefenders = this.filteredBitdefenders.slice(start, start + this.pageSize);
  }

  approveBitdefender(id: number): void {
    this.bitdefenderService.activate(id).subscribe({
      next: () => {
        this.unapprovedBitdefenders = this.unapprovedBitdefenders.filter(b => b.bitdefenderId !== id);
        this.filteredBitdefenders = this.filteredBitdefenders.filter(b => b.bitdefenderId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteBitdefender(item: { bitdefenderId?: number; client?: string }): void {
    const id = item?.bitdefenderId;
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

  confirmDeleteBitdefender(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.bitdefenderService.deleteBitdefender(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedBitdefender?.bitdefenderId === id) {
          this.selectedBitdefender = null;
        }
        this.getAllBitdefenders();
        alert('Bitdefender supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression Bitdefender', error);
        alert('Échec suppression');
      }
    });
  }

  updateBitdefender(bitdefender: Bitdefender): void {
    this.selectedBitdefenderToUpdate = bitdefender;
    this.showUpdateModal = true;
  }

  selectBitdefender(b: Bitdefender): void {
    this.selectedBitdefender = this.selectedBitdefender?.bitdefenderId === b.bitdefenderId ? null : b;
  }

  closeDetail(): void {
    this.selectedBitdefender = null;
  }

  goToAddBitdefender(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onBitdefenderAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedBitdefenderToUpdate = null;
    this.getAllBitdefenders();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedBitdefenderToUpdate = null;
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
    return this.bitdefenderService.getFileDownloadUrl(id);
  }

  formatCcMail(cc: string[] | undefined): string {
    if (!cc?.length) return '-';
    return cc.filter(e => e?.trim()).join(', ') || '-';
  }
}
