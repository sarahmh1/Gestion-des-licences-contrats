import { Component, OnInit, ViewChild } from '@angular/core';
import { SentineIOneService } from 'app/Services/sentineIOne.service';
import { SentineIOne } from 'app/Model/SentineIOne';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterssComponent } from '../ajouters/ajouters.component';

@Component({
  selector: 'app-affichers',
  templateUrl: './affichers.component.html',
  styleUrls: ['./affichers.component.scss']
})
export class AfficherssComponent implements OnInit {

  searchTerm = '';
  selectedSentineIOne: SentineIOne | null = null;
  sentineIOnes: SentineIOne[] = [];
  filteredSentineIOnes: SentineIOne[] = [];
  unapprovedSentineIOnes: SentineIOne[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedSentineIOnes: SentineIOne[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedSentineIOneToUpdate: SentineIOne | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterssComponent) ajouterComponent?: AjouterssComponent;

  constructor(
    private sentineIOneService: SentineIOneService,
    public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.sentineIOneService.getFileDownloadUrl(id);
  }

  ngOnInit(): void {
    this.getAllSentineIOnes();
  }

  onSearch(): void {
    this.filteredSentineIOnes = this.filterSentineIOnes();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllSentineIOnes(): void {
    this.sentineIOneService.getAllSentineIOnes().subscribe({
      next: (data: SentineIOne[]) => {
        this.sentineIOnes = data;
        this.filteredSentineIOnes = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération SentinelOne', error)
    });
  }

  filterSentineIOnes(): SentineIOne[] {
    const term = this.searchTerm.toLowerCase();
    return this.sentineIOnes.filter((sentineIOne) => {
      const inLicences = sentineIOne.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        sentineIOne.client?.toLowerCase().includes(term) ||
        sentineIOne.nomDuContact?.toLowerCase().includes(term) ||
        sentineIOne.adresseEmailContact?.toLowerCase().includes(term) ||
        sentineIOne.mailAdmin?.toLowerCase().includes(term) ||
        sentineIOne.numero?.toLowerCase().includes(term) ||
        sentineIOne.remarque?.toLowerCase().includes(term) ||
        sentineIOne.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSentineIOnes.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedSentineIOnes = this.filteredSentineIOnes.slice(start, start + this.pageSize);
  }

  approveSentineIOne(id: number): void {
    this.sentineIOneService.activate(id).subscribe({
      next: () => {
        this.unapprovedSentineIOnes = this.unapprovedSentineIOnes.filter(s => s.sentineIOneId !== id);
        this.filteredSentineIOnes = this.filteredSentineIOnes.filter(s => s.sentineIOneId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteSentineIOne(item: { sentineIOneId?: number; client?: string }): void {
    const id = item?.sentineIOneId;
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

  confirmDeleteSentineIOne(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.sentineIOneService.deleteSentineIOne(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedSentineIOne?.sentineIOneId === id) {
          this.selectedSentineIOne = null;
        }
        this.getAllSentineIOnes();
        alert('Licence supprimée avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression SentinelOne', error);
        alert('Échec suppression');
      }
    });
  }

  updateSentineIOne(sentineIOne: SentineIOne): void {
    this.selectedSentineIOneToUpdate = sentineIOne;
    this.showUpdateModal = true;
  }

  selectSentineIOne(x: SentineIOne): void {
    this.selectedSentineIOne = this.selectedSentineIOne?.sentineIOneId === x.sentineIOneId ? null : x;
  }

  closeDetail(): void {
    this.selectedSentineIOne = null;
  }

  goToAddSentineIOne(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onSentineIOneAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedSentineIOneToUpdate = null;
    this.getAllSentineIOnes();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedSentineIOneToUpdate = null;
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
