import { Component, OnInit } from '@angular/core';
import { VaronisService } from 'app/Services/varonis.service';
import { Varonis } from 'app/Model/Varonis';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-affichervr',
  templateUrl: './affichervr.component.html',
  styleUrls: ['./affichervr.component.scss']
})
export class AffichervrComponent implements OnInit {

  searchTerm: string = '';
  selectedVaronis: Varonis | null = null;
   varoniss: Varonis[] = [];
   filteredVaroniss: Varonis[] = [];
   unapprovedVaronis: Varonis[] = [];
 
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedVaroniss:Varonis[] = [];
 
   constructor(private varonisService: VaronisService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllVaronis();
    }
  
    onSearch() {
      this.filteredVaroniss = this.filterVaroniss();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllVaronis(): void {
      this.varonisService.getAllVaronis().subscribe(
        (data: Varonis[]) => {
          this.varoniss = data;
          this.filteredVaroniss = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration Varoniss', error);
        }
      );
    }
  
    filterVaroniss(): Varonis[] {
      const term = this.searchTerm.toLowerCase();
      return this.varoniss.filter((varonis) => {
        const inLicences = varonis.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          varonis.client?.toLowerCase().includes(term) ||
          varonis.nomDuContact?.toLowerCase().includes(term) ||
          varonis.adresseEmailContact?.toLowerCase().includes(term) ||
          varonis.numero?.toLowerCase().includes(term) ||
          varonis.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredVaroniss.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedVaroniss = this.filteredVaroniss.slice(start, end);
    }
  
    approveVaronis(id: number): void {
      this.varonisService.activate(id).subscribe(() => {
     this.unapprovedVaronis = this.unapprovedVaronis.filter(varonis => varonis.varonisId !== id);
      this.filteredVaroniss = this.filteredVaroniss.filter(varonis=> varonis.varonisId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteVaronis(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.varonisService.deleteVaronis(id).subscribe(
          () => {
            this.getAllVaronis();
            alert('Varonis supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression Varonis', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateVaronis(varonis: Varonis): void {
      this.router.navigate(['/edit-varonis', varonis.varonisId]);
    }
  
    goToAddVaronis() {
      this.router.navigate(['/Ajoutervr']);
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

    getFileDownloadUrl(id: number): string {
      return this.varonisService.getFileDownloadUrl(id);
    }
  
  selectVaronis(x: Varonis): void { this.selectedVaronis = this.selectedVaronis?.varonisId === x.varonisId ? null : x; }
  closeDetail(): void { this.selectedVaronis = null; }
}
