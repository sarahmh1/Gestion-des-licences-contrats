import { Component, OnInit, ViewChild } from '@angular/core';
import { PaloService } from 'app/Services/palo.service';
import { Palo } from 'app/Model/Palo';
import { Router } from '@angular/router';
import { AjouterPaloComponent } from '../ajouter-palo/ajouter-palo.component';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficher-palo',
  templateUrl: './afficher-palo.component.html',
  styleUrls: ['./afficher-palo.component.scss']
})
export class AfficherPaloComponent implements OnInit {
  searchTerm: string = '';
  selectedPalo: Palo | null = null;
    palos: Palo[] = [];
    filteredPalos: Palo[] = [];
    unapprovedPalos: Palo[] = [];
  
    currentPage = 0;
    pageSize = 10;
    totalPages: number = 0;
    pagedPalos: Palo[] = [];

    showAddModal: boolean = false;
    showUpdateModal: boolean = false;
    selectedPaloToUpdate: Palo | null = null;

    @ViewChild(AjouterPaloComponent) ajouterComponent!: AjouterPaloComponent;
  
    constructor(private paloService: PaloService, private router: Router, public permissionService: PermissionService) {}
  
    ngOnInit(): void {
      this.getAllPalos();
    }
  
    onSearch() {
      this.filteredPalos = this.filterPalos();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllPalos(): void {
      this.paloService.getAllPalos().subscribe(
        (data: Palo[]) => {
          this.palos = data;
          this.filteredPalos = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur récupération Fortinets', error);
        }
      );
    }
  
    filterPalos(): Palo[] {
      const term = this.searchTerm.toLowerCase();
      return this.palos.filter((palo) => {
        const inLicences = palo.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          palo.client?.toLowerCase().includes(term) ||
          palo.nomDuBoitier?.toLowerCase().includes(term) ||
          palo.numeroSerieBoitier?.toLowerCase().includes(term) ||
          palo.nomDuContact?.toLowerCase().includes(term) ||
          palo.adresseEmailContact?.toLowerCase().includes(term) ||
          palo.numero?.toLowerCase().includes(term) ||
          palo.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredPalos.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedPalos = this.filteredPalos.slice(start, end);
    }
  
    approvePalo(id: number): void {
      this.paloService.activate(id).subscribe(() => {
      // Retirer l'ESET approuvé de la liste des non approuvés
      this.unapprovedPalos = this.unapprovedPalos.filter(palo => palo.paloId !== id);
      this.filteredPalos = this.filteredPalos.filter(palo => palo.paloId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuvé et retiré de la liste');
    });
  }
  
    deletePalo(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.paloService.deletePalo(id).subscribe(
          () => {
            this.getAllPalos();
            alert('Palo supprimé avec succès');
          },
          error => {
            console.error('Erreur suppression Palo', error);
            alert('Échec suppression');
          }
        );
      }
    }
  
    updatePalo(palo: Palo): void {
      this.selectedPaloToUpdate = palo;
      this.showUpdateModal = true;
    }
  
    goToAddPalo() {
      this.showAddModal = true;
    }

    closeAddModal() {
      this.showAddModal = false;
    }

    onPaloAdded() {
      this.showAddModal = false;
      this.getAllPalos();
    }

    onAddCancelled() {
      this.showAddModal = false;
    }

    closeUpdateModal() {
      this.showUpdateModal = false;
      this.selectedPaloToUpdate = null;
    }

    onPaloUpdated() {
      this.showUpdateModal = false;
      this.getAllPalos();
    }

    onUpdateCancelled() {
      this.showUpdateModal = false;
      this.selectedPaloToUpdate = null;
    }

    onModalBodyClick(event: MouseEvent): void {
      const target = event.target as HTMLElement;
      const isClickedOnInteractive = target?.closest('input, button, select, .scs-dropdown');
      
      if (!isClickedOnInteractive && this.ajouterComponent) {
        if (this.ajouterComponent.clientSelect) {
          this.ajouterComponent.clientSelect.closeDropdown();
        }
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

    getFileDownloadUrl(paloId: number): string {
      return this.paloService.getFileDownloadUrlById(paloId);
    }
  
  selectPalo(x: Palo): void { this.selectedPalo = this.selectedPalo?.paloId === x.paloId ? null : x; }
  closeDetail(): void { this.selectedPalo = null; }
}
