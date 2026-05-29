import { Component, OnInit, ViewChild } from '@angular/core';
import { InfobloxService } from 'app/Services/infoblox.service';
import { Infoblox } from 'app/Model/Infoblox';
import { PermissionService } from 'app/Services/permission.service';
import { AjouteriComponent } from '../ajouteri/ajouteri.component';

@Component({
  selector: 'app-afficheri',
  templateUrl: './afficheri.component.html',
  styleUrls: ['./afficheri.component.scss']
})
export class AfficheriComponent implements OnInit {

  searchTerm = '';
  selectedInfoblox: Infoblox | null = null;
  infobloxs: Infoblox[] = [];
  filteredInfobloxs: Infoblox[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedInfobloxs: Infoblox[] = [];
  unapprovedInfobloxs: Infoblox[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedInfobloxToUpdate: Infoblox | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouteriComponent) ajouterComponent?: AjouteriComponent;

  constructor(
    private infobloxService: InfobloxService,
    public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.infobloxService.getFileDownloadUrl(id);
  }

  ngOnInit(): void {
    this.getAllInfobloxs();
  }

  onSearch(): void {
    this.filteredInfobloxs = this.filterInfobloxs();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllInfobloxs(): void {
    this.infobloxService.getAllInfobloxs().subscribe({
      next: (data: Infoblox[]) => {
        this.infobloxs = data;
        this.filteredInfobloxs = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur récupération Infoblox', error)
    });
  }

  filterInfobloxs(): Infoblox[] {
    const term = this.searchTerm.toLowerCase();
    return this.infobloxs.filter((infoblox) => {
      const inLicences = infoblox.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        infoblox.client?.toLowerCase().includes(term) ||
        infoblox.nomDuContact?.toLowerCase().includes(term) ||
        infoblox.adresseEmailContact?.toLowerCase().includes(term) ||
        infoblox.mailAdmin?.toLowerCase().includes(term) ||
        infoblox.numero?.toLowerCase().includes(term) ||
        infoblox.remarque?.toLowerCase().includes(term) ||
        infoblox.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredInfobloxs.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedInfobloxs = this.filteredInfobloxs.slice(start, start + this.pageSize);
  }

  approveInfoblox(id: number): void {
    this.infobloxService.activate(id).subscribe({
      next: () => {
        this.unapprovedInfobloxs = this.unapprovedInfobloxs.filter(x => x.infobloxId !== id);
        this.filteredInfobloxs = this.filteredInfobloxs.filter(x => x.infobloxId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteInfoblox(item: { infobloxId?: number; client?: string }): void {
    const id = item?.infobloxId;
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

  confirmDeleteInfoblox(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.infobloxService.deleteInfoblox(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedInfoblox?.infobloxId === id) {
          this.selectedInfoblox = null;
        }
        this.getAllInfobloxs();
        alert('Licence supprimée avec succès');
      },
      error: error => {
        console.error('Erreur suppression Infoblox', error);
        alert('Échec suppression');
      }
    });
  }

  updateInfoblox(infoblox: Infoblox): void {
    this.selectedInfobloxToUpdate = infoblox;
    this.showUpdateModal = true;
  }

  selectInfoblox(x: Infoblox): void {
    this.selectedInfoblox = this.selectedInfoblox?.infobloxId === x.infobloxId ? null : x;
  }

  closeDetail(): void {
    this.selectedInfoblox = null;
  }

  goToAddInfoblox(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onInfobloxAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedInfobloxToUpdate = null;
    this.getAllInfobloxs();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedInfobloxToUpdate = null;
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
