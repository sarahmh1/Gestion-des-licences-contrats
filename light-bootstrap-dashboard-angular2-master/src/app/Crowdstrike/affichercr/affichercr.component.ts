import { Component, OnInit } from '@angular/core';
import { CrowdstrikeService } from 'app/Services/crowdstrike.service';
import { Crowdstrike } from 'app/Model/Crowdstrike';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficher-crowdstrike',
  templateUrl: './affichercr.component.html',
  styleUrls: ['./affichercr.component.scss']
})
export class AfficherCrowdstrikeComponent implements OnInit {
  searchTerm: string = '';
  selectedCrowdstrike: Crowdstrike | null = null;
  crowdstrikes: Crowdstrike[] = [];
  filteredCrowdstrikes: Crowdstrike[] = [];
  unapprovedCrowdstrikes: Crowdstrike[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedCrowdstrikes: Crowdstrike[] = [];

  constructor(private crowdstrikeService: CrowdstrikeService, private router: Router, public permissionService: PermissionService) {}

  ngOnInit(): void {
    console.log('Initialisation du composant AfficherCrowdstrike');
    this.getAllCrowdstrikes();
  }

  onSearch() {
    this.filteredCrowdstrikes = this.filterCrowdstrikes();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllCrowdstrikes(): void {
    console.log('D�but de la r�cup�ration des CrowdStrikes');
    this.crowdstrikeService.getAllCrowdstrikes().subscribe(
      (data: Crowdstrike[]) => {
        console.log('Donn�es re�ues du backend:', data);
        
        // Debug: V�rifiez les IDs
        data.forEach((item, index) => {
          console.log(`Item ${index}: ID =`, item.crowdstrikeid, 'Type:', typeof item.crowdstrikeid);
        });
        
        this.crowdstrikes = data;
        this.filteredCrowdstrikes = data;
        this.calculatePagination();
        this.changePage(0);
      },
      (error) => {
        console.error('Erreur r�cup�ration Crowdstrikes', error);
        alert('Erreur lors de la r�cup�ration des donn�es');
      }
    );
  }

  filterCrowdstrikes(): Crowdstrike[] {
    const term = this.searchTerm.toLowerCase();
    return this.crowdstrikes.filter((crowdstrike) => {
      const inLicences = crowdstrike.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        crowdstrike.client?.toLowerCase().includes(term) ||
        crowdstrike.nomDuContact?.toLowerCase().includes(term) ||
        crowdstrike.adresseEmailContact?.toLowerCase().includes(term) ||
        crowdstrike.numero?.toLowerCase().includes(term) ||
        crowdstrike.remarques?.toLowerCase().includes(term) ||
        crowdstrike.dureeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredCrowdstrikes.length / this.pageSize);
  }

  changePage(pageIndex: number) {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedCrowdstrikes = this.filteredCrowdstrikes.slice(start, end);
  }

  approveCrowdstrike(id: number | undefined | null): void {
    console.log('Tentative d\'approbation avec ID:', id);
    
    if (id == null || id === undefined) {
      console.error('ID est null ou undefined');
      alert('Erreur: ID non valide pour l\'approbation');
      return;
    }

    this.crowdstrikeService.activate(id).subscribe(
      () => {
        console.log('Approbation r�ussie pour ID:', id);
        this.unapprovedCrowdstrikes = this.unapprovedCrowdstrikes.filter(crowdstrike => crowdstrike.crowdstrikeid !== id);
        this.filteredCrowdstrikes = this.filteredCrowdstrikes.filter(crowdstrike => crowdstrike.crowdstrikeid !== id);
        this.calculatePagination();
        this.changePage(this.currentPage);
        alert('CrowdStrike approuv� avec succ�s');
      },
      error => {
        console.error('Erreur lors de l\'approbation:', error);
        alert('Erreur lors de l\'approbation: ' + (error.message || 'Unknown error'));
      }
    );
  }

  deleteCrowdstrike(id: number | undefined | null): void {
    console.log('Tentative de suppression avec ID:', id);
    
    if (id == null || id === undefined) {
      console.error('ID est null ou undefined');
      alert('Erreur: ID non valide pour la suppression');
      return;
    }

    if (confirm('Confirmer la suppression ?')) {
      this.crowdstrikeService.deleteCrowdstrike(id).subscribe(
        () => {
          console.log('Suppression r�ussie pour ID:', id);
          this.getAllCrowdstrikes();
          alert('CrowdStrike supprim� avec succ�s');
        },
        error => {
          console.error('Erreur suppression CrowdStrike', error);
          alert('Erreur lors de la suppression: ' + (error.message || 'Unknown error'));
        }
      );
    }
  }

  updateCrowdstrike(crowdstrike: Crowdstrike): void {
    console.log('Tentative de mise à jour avec CrowdStrike:', crowdstrike);
    
    if (!crowdstrike.crowdstrikeid) {
      console.error('crowdstrikeid est manquant');
      alert('Erreur: ID non valide pour la mise à jour');
      return;
    }

    // V�RIFIEZ QUE CETTE ROUTE EXISTE DANS VOTRE app-routing.module.ts
    this.router.navigate(['/edit-crowdstrike', crowdstrike.crowdstrikeid]);
  }

  goToAddCrowdstrike() {
    this.router.navigate(['/AjouterCrowdstrike']);
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

  getFileDownloadUrl(crowdstrikeid: number): string {
    return this.crowdstrikeService.getFileDownloadUrlById(crowdstrikeid);
  }

  selectCrowdstrike(x: Crowdstrike): void { this.selectedCrowdstrike = this.selectedCrowdstrike?.crowdstrikeid === x.crowdstrikeid ? null : x; }
  closeDetail(): void { this.selectedCrowdstrike = null; }
}

