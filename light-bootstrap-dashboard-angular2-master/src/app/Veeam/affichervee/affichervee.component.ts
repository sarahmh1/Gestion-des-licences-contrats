import { Component, OnInit, ViewChild } from '@angular/core';
import { VeeamService } from 'app/Services/veeam.service';
import { Veeam } from 'app/Model/Veeam';
import { PermissionService } from 'app/Services/permission.service';
import { AjouterVeeComponent } from '../ajoutervee/ajoutervee.component';

@Component({
  selector: 'app-affichervee',
  templateUrl: './affichervee.component.html',
  styleUrls: ['./affichervee.component.scss']
})
export class AfficherveeComponent implements OnInit {
  searchTerm: string = '';
  veeams: Veeam[] = [];
  filteredVeeams: Veeam[] = [];
  unapprovedVeeams: Veeam[] = [];
  selectedVeeam: Veeam | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedVeeams: Veeam[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedVeeamToUpdate: Veeam | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjouterVeeComponent) ajouterComponent?: AjouterVeeComponent;

  constructor(
    private veeamService: VeeamService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.getAllVeeams();
  }

  onSearch() {
    this.filteredVeeams = this.filterVeeams();
    this.calculatePagination();
    this.changePage(0);
  }

  /** Les plus récents en premier (id décroissant). */
  private sortVeeamsNewestFirst(list: Veeam[]): Veeam[] {
    return [...list].sort((a, b) => (b.veeamId ?? 0) - (a.veeamId ?? 0));
  }

  getAllVeeams(): void {
    this.veeamService.getAllVeeams().subscribe(
      (data: Veeam[]) => {
        this.veeams = this.sortVeeamsNewestFirst(data);
        this.filteredVeeams = this.filterVeeams();
        this.calculatePagination();
        this.changePage(0);
      },
      (error) => {
        console.error('Erreur récupération Veeams', error);
      }
    );
  }

  filterVeeams(): Veeam[] {
    const term = this.searchTerm.toLowerCase();
    return this.veeams.filter((veeam) => {
      const inLicences = veeam.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        veeam.client?.toLowerCase().includes(term) ||
        veeam.nomDuContact?.toLowerCase().includes(term) ||
        veeam.adresseEmailContact?.toLowerCase().includes(term) ||
        veeam.numero?.toLowerCase().includes(term) ||
        veeam.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredVeeams.length / this.pageSize);
  }

  changePage(pageIndex: number) {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedVeeams = this.filteredVeeams.slice(start, end);
  }

  approveVeeam(id: number): void {
    this.veeamService.activate(id).subscribe(() => {
      this.unapprovedVeeams = this.unapprovedVeeams.filter(veeam => veeam.veeamId !== id);
      this.filteredVeeams = this.filteredVeeams.filter(veeam => veeam.veeamId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
    });
  }

  requestDeleteVeeam(item: { veeamId?: number; client?: string }): void {
    const id = item?.veeamId;
    if (id == null) return;
    this.pendingDeleteId = id;
    this.deleteModalDetail = item.client ? 'Client : ' + item.client : '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
    this.deleteModalDetail = '';
  }

  confirmDeleteVeeam(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.veeamService.deleteVeeam(id).subscribe(
      () => {
        this.closeDeleteModal();
        if (this.selectedVeeam?.veeamId === id) {
          this.selectedVeeam = null;
        }
        this.getAllVeeams();
        alert('Veeam supprimé avec succès');
      },
      error => {
        console.error('Erreur suppression Veeam', error);
        alert('Échec suppression');
      }
    );
  }

  goToAddVeeam(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onVeeamAdded(): void {
    this.showAddModal = false;
    this.searchTerm = '';
    this.selectedVeeam = null;
    this.getAllVeeams();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  updateVeeam(veeam: Veeam): void {
    this.selectedVeeamToUpdate = veeam;
    this.showUpdateModal = true;
  }

  onVeeamUpdated(): void {
    this.showUpdateModal = false;
    this.selectedVeeamToUpdate = null;
    this.getAllVeeams();
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedVeeamToUpdate = null;
  }

  onModalBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isInteractive = target?.closest('input, button, select, .scs-dropdown');
    if (!isInteractive) {
      this.ajouterComponent?.closeClientDropdown();
    }
  }

  selectVeeam(v: Veeam): void {
    this.selectedVeeam = this.selectedVeeam?.veeamId === v.veeamId ? null : v;
  }

  closeDetail(): void {
    this.selectedVeeam = null;
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

  getFileDownloadUrl(veeamId: number): string {
    return this.veeamService.getFileDownloadUrlById(veeamId);
  }
}
