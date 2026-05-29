import { Component, OnInit, ViewChild } from '@angular/core';
import { OneIdentityService } from 'app/Services/oneIdentity.service';
import { OneIdentity } from 'app/Model/OneIdentity';
import { PermissionService } from 'app/Services/permission.service';
import { AjouteroComponent } from '../ajoutero/ajoutero.component';

@Component({
  selector: 'app-affichero',
  templateUrl: './affichero.component.html',
  styleUrls: ['./affichero.component.scss']
})
export class AfficheroComponent implements OnInit {

  searchTerm = '';
  selectedOneIdentity: OneIdentity | null = null;
  oneIdentitys: OneIdentity[] = [];
  filteredOneIdentitys: OneIdentity[] = [];
  unapprovedOneIdentitys: OneIdentity[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedOneIdentitys: OneIdentity[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedOneIdentityToUpdate: OneIdentity | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouteroComponent) ajouterComponent?: AjouteroComponent;

  constructor(
    private oneIdentityService: OneIdentityService,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllOneIdentitys();
  }

  onSearch(): void {
    this.filteredOneIdentitys = this.filterOneIdentitys();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllOneIdentitys(): void {
    this.oneIdentityService.getAllOneIdentitys().subscribe({
      next: (data: OneIdentity[]) => {
        this.oneIdentitys = data;
        this.filteredOneIdentitys = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération OneIdentitys', error)
    });
  }

  filterOneIdentitys(): OneIdentity[] {
    const term = this.searchTerm.toLowerCase();
    return this.oneIdentitys.filter((oneIdentity) => {
      const inLicences = oneIdentity.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        oneIdentity.client?.toLowerCase().includes(term) ||
        oneIdentity.nomDuContact?.toLowerCase().includes(term) ||
        oneIdentity.adresseEmailContact?.toLowerCase().includes(term) ||
        oneIdentity.numero?.toLowerCase().includes(term) ||
        oneIdentity.remarque?.toLowerCase().includes(term) ||
        oneIdentity.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOneIdentitys.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedOneIdentitys = this.filteredOneIdentitys.slice(start, start + this.pageSize);
  }

  approveOneIdentity(id: number): void {
    this.oneIdentityService.activate(id).subscribe({
      next: () => {
        this.unapprovedOneIdentitys = this.unapprovedOneIdentitys.filter(o => o.oneIdentityId !== id);
        this.filteredOneIdentitys = this.filteredOneIdentitys.filter(o => o.oneIdentityId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteOneIdentity(item: { oneIdentityId?: number; client?: string }): void {
    const id = item?.oneIdentityId;
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

  confirmDeleteOneIdentity(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.oneIdentityService.deleteOneIdentity(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedOneIdentity?.oneIdentityId === id) {
          this.selectedOneIdentity = null;
        }
        this.getAllOneIdentitys();
        alert('OneIdentity supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression OneIdentity', error);
        alert('Échec suppression');
      }
    });
  }

  updateOneIdentity(oneIdentity: OneIdentity): void {
    this.selectedOneIdentityToUpdate = oneIdentity;
    this.showUpdateModal = true;
  }

  selectOneIdentity(o: OneIdentity): void {
    this.selectedOneIdentity = this.selectedOneIdentity?.oneIdentityId === o.oneIdentityId ? null : o;
  }

  closeDetail(): void {
    this.selectedOneIdentity = null;
  }

  goToAddOneIdentity(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onOneIdentityAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedOneIdentityToUpdate = null;
    this.getAllOneIdentitys();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedOneIdentityToUpdate = null;
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
    return this.oneIdentityService.getFileDownloadUrl(id);
  }

  formatCcMail(cc: string[] | undefined): string {
    if (!cc?.length) return '-';
    return cc.filter(e => e?.trim()).join(', ') || '-';
  }
}
