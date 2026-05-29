import { Component, OnInit, ViewChild } from '@angular/core';
import { VMwareService } from 'app/Services/vmware.service';
import { VMware } from 'app/Model/VMware';
import { PermissionService } from 'app/Services/permission.service';
import { AjoutervComponent } from '../ajouterv/ajouterv.component';

@Component({
  selector: 'app-afficherv',
  templateUrl: './afficherv.component.html',
  styleUrls: ['./afficherv.component.scss']
})
export class AffichervComponent implements OnInit {

  searchTerm = '';
  vmwares: VMware[] = [];
  filteredVMwares: VMware[] = [];
  selectedVMware: VMware | null = null;
  unapprovedVmwares: VMware[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagedVMwares: VMware[] = [];

  showAddModal = false;
  showUpdateModal = false;
  selectedVmwareToUpdate: VMware | null = null;

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  @ViewChild(AjoutervComponent) ajouterComponent?: AjoutervComponent;

  constructor(
    private vmwareService: VMwareService,
    public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllVMwares();
  }

  onSearch(): void {
    this.filteredVMwares = this.filterVMwares();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllVMwares(): void {
    this.vmwareService.getAllVMwares().subscribe({
      next: (data: VMware[]) => {
        this.vmwares = data;
        this.filteredVMwares = data;
        this.calculatePagination();
        this.changePage(0);
      },
      error: (error) => console.error('Erreur recuperation VMwares', error)
    });
  }

  filterVMwares(): VMware[] {
    const term = this.searchTerm.toLowerCase();
    return this.vmwares.filter((vmware) => {
      const inLicences = vmware.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        vmware.client?.toLowerCase().includes(term) ||
        vmware.nomDuContact?.toLowerCase().includes(term) ||
        vmware.adresseEmailContact?.toLowerCase().includes(term) ||
        vmware.numero?.toLowerCase().includes(term) ||
        vmware.remarque?.toLowerCase().includes(term) ||
        vmware.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVMwares.length / this.pageSize);
  }

  changePage(pageIndex: number): void {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    this.pagedVMwares = this.filteredVMwares.slice(start, start + this.pageSize);
  }

  approveVMware(id: number): void {
    this.vmwareService.activate(id).subscribe({
      next: () => {
        this.unapprovedVmwares = this.unapprovedVmwares.filter(vm => vm.vmwareId !== id);
        this.filteredVMwares = this.filteredVMwares.filter(vm => vm.vmwareId !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
      },
      error: err => console.error('Erreur approbation', err)
    });
  }

  requestDeleteVMware(item: { vmwareId?: number; client?: string }): void {
    const id = item?.vmwareId;
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

  confirmDeleteVMware(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.vmwareService.deleteVMware(id).subscribe({
      next: () => {
        this.closeDeleteModal();
        if (this.selectedVMware?.vmwareId === id) {
          this.selectedVMware = null;
        }
        this.getAllVMwares();
        alert('VMware supprime avec succes');
      },
      error: (error) => {
        console.error('Erreur suppression VMware', error);
        alert('Echec suppression');
      }
    });
  }

  updateVMware(vmware: VMware): void {
    this.selectedVmwareToUpdate = vmware;
    this.showUpdateModal = true;
  }

  selectVMware(v: VMware): void {
    this.selectedVMware = this.selectedVMware?.vmwareId === v.vmwareId ? null : v;
  }

  closeDetail(): void {
    this.selectedVMware = null;
  }

  goToAddVMware(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onVmwareAdded(): void {
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.selectedVmwareToUpdate = null;
    this.getAllVMwares();
  }

  onAddCancelled(): void {
    this.showAddModal = false;
  }

  onUpdateCancelled(): void {
    this.showUpdateModal = false;
    this.selectedVmwareToUpdate = null;
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
    return this.vmwareService.getFileDownloadUrl(id);
  }
}
