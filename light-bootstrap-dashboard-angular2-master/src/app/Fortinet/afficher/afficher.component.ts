import { Component, OnInit, ViewChild } from '@angular/core';
import { FortinetService } from 'app/Services/fortinet.service';
import { Fortinet } from 'app/Model/Fortinet';
import { Router } from '@angular/router';
import { AjouterComponent } from '../ajouter/ajouter.component';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficher',
  templateUrl: './afficher.component.html',
  styleUrls: ['./afficher.component.scss']
})
export class AfficherComponent implements OnInit {
  searchTerm: string = '';
  fortinets: Fortinet[] = [];
  unapprovedFortinets: Fortinet[] = [];
  filteredFortinets: Fortinet[] = [];
  selectedFortinet: Fortinet | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedFortinets: Fortinet[] = [];

  showAddModal: boolean = false;
  showUpdateModal: boolean = false;
  selectedFortinetToUpdate: Fortinet | null = null;

  @ViewChild(AjouterComponent) ajouterComponent!: AjouterComponent;

  constructor(private fortinetService: FortinetService, private router: Router, public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.getAllFortinets();
  }

  onSearch() {
    this.filteredFortinets = this.filterFortinets();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllFortinets(): void {
  console.log('Début de getAllFortinets');
  this.fortinetService.getAllFortinets().subscribe(
    (data: Fortinet[]) => {
      console.log('Données reçues du service:', data);
      console.log('Nombre d\'éléments:', data.length);
      this.fortinets = data;
      this.filteredFortinets = data;
      this.calculatePagination();
      this.changePage(0);
    },
    (error) => {
      console.error('Erreur récupération Fortinets', error);
      console.error('Status:', error.status);
      console.error('Message:', error.message);
    }
  );
}
  filterFortinets(): Fortinet[] {
    const term = this.searchTerm.toLowerCase();
    return this.fortinets.filter((fortinet) => {
      const inLicences = fortinet.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        fortinet.client?.toLowerCase().includes(term) ||
        fortinet.nomDuBoitier?.toLowerCase().includes(term) ||
        fortinet.numeroSerie?.toLowerCase().includes(term) ||
        fortinet.nomDuContact?.toLowerCase().includes(term) ||
        fortinet.adresseEmailContact?.toLowerCase().includes(term) ||
        fortinet.numero?.toLowerCase().includes(term) ||
        fortinet.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredFortinets.length / this.pageSize);
  }

  changePage(pageIndex: number) {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedFortinets = this.filteredFortinets.slice(start, end);
  }

  approveFortinet(id: number): void {
    this.fortinetService.activate(id).subscribe(() => {
      this.unapprovedFortinets = this.unapprovedFortinets.filter(fortinet => fortinet.fortinetId !== id);
      this.filteredFortinets = this.filteredFortinets.filter(fortinet => fortinet.fortinetId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuvé et retiré de la liste');
    });
  }

  showDeleteModal = false;
  deleteModalDetail = '';
  private pendingDeleteId: number | null = null;

  requestDeleteFortinet(f: { fortinetId?: number; client?: string }): void {
    if (f?.fortinetId == null) return;
    this.pendingDeleteId = f.fortinetId;
    this.deleteModalDetail = f.client ? `Client : ${f.client}` : '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
    this.deleteModalDetail = '';
  }

  confirmDeleteFortinet(): void {
    const id = this.pendingDeleteId;
    if (id == null) return;
    this.fortinetService.deleteFortinet(id).subscribe(
      () => {
        this.getAllFortinets();
        this.closeDeleteModal();
        if (this.selectedFortinet?.fortinetId === id) this.selectedFortinet = null;
        alert('Fortinet supprimé avec succès');
      },
      error => {
        console.error('Erreur suppression Fortinet', error);
        alert('Échec suppression');
      }
    );
  }

  selectFortinet(f: Fortinet): void {
    this.selectedFortinet = this.selectedFortinet?.fortinetId === f.fortinetId ? null : f;
  }

  closeDetail(): void {
    this.selectedFortinet = null;
  }

  goToAddFortinet() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  onFortinetAdded() {
    this.showAddModal = false;
    this.getAllFortinets();
  }

  onAddCancelled() {
    this.showAddModal = false;
  }

  updateFortinet(fortinet: Fortinet) {
    this.selectedFortinetToUpdate = fortinet;
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.selectedFortinetToUpdate = null;
  }

  onFortinetUpdated() {
    this.showUpdateModal = false;
    this.getAllFortinets();
  }

  onUpdateCancelled() {
    this.showUpdateModal = false;
    this.selectedFortinetToUpdate = null;
  }

  /**
   * Gère les clics sur le corps du modal pour fermer les dropdowns
   */
  onModalBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Vérifier si le clic provient d'un élément interactif
    const isClickedOnInteractive = target?.closest('input, button, select, .scs-dropdown');
    
    // Si le clic n'est pas sur un élément interactif, fermer les dropdowns
    if (!isClickedOnInteractive && this.ajouterComponent) {
      this.ajouterComponent.closeClientDropdown();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  getCommandePasserParLabel(value: any): string {
  switch (value) {
    case 'GI_TN': return 'GI_TN';
    case 'GI_FR': return 'GI_FR';
    case 'GI_CI': return 'GI_CI';
    default: return value;
  }
}

  getFileDownloadUrlById(fortinetId: number): string {
    return this.fortinetService.getFileDownloadUrlById(fortinetId);
  }

}
