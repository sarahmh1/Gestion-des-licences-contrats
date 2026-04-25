import { Component, OnInit } from '@angular/core';
import { WallixService } from 'app/Services/wallix.service';
import { Wallix } from 'app/Model/Wallix';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficherw',
  templateUrl: './afficherw.component.html',
  styleUrls: ['./afficherw.component.scss']
})
export class AfficherwComponent implements OnInit {
  searchTerm: string = '';
   wallixs: Wallix[] = [];
   filteredWallixs: Wallix[] = [];
   selectedWallix: Wallix | null = null;
   unapprovedWallixs: Wallix[] = [];

     currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedWallix: Wallix[] = [];
 
   constructor(private wallixService: WallixService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllWallixs();
    }
  
    onSearch() {
      this.filteredWallixs = this.filterWallixs();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllWallixs(): void {
      this.wallixService.getAllWallixs().subscribe(
        (data: Wallix[]) => {
          this.wallixs = data;
          this.filteredWallixs = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur récupération Wallixs', error);
        }
      );
    }
  
    filterWallixs(): Wallix[] {
      const term = this.searchTerm.toLowerCase();
      return this.wallixs.filter((wallix) => {
        const inLicences = wallix.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          wallix.client?.toLowerCase().includes(term) ||
          wallix.nomDuContact?.toLowerCase().includes(term) ||
          wallix.adresseEmailContact?.toLowerCase().includes(term) ||
          wallix.numero?.toLowerCase().includes(term) ||
          wallix.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredWallixs.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedWallix = this.filteredWallixs.slice(start, end);
    }
  
    approveWallix(id: number): void {
      this.wallixService.activate(id).subscribe(() => {
     this.unapprovedWallixs = this.unapprovedWallixs.filter(wallix => wallix.wallixId !== id);
      this.filteredWallixs = this.filteredWallixs.filter(wallix => wallix.wallixId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuvé et retiré de la liste');
    });
  }

    deleteWallix(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.wallixService.deleteWallix(id).subscribe(
          () => {
            this.getAllWallixs();
            alert('wallix supprimé avec succès');
          },
          error => {
            console.error('Erreur suppression wallix', error);
            alert('Échec suppression');
          }
        );
      }
    }
  
    updateWallix(wallix: Wallix): void {
      this.router.navigate(['/edit-wallix', wallix.wallixId]);
    }
  
    goToAddWallix() {
      this.router.navigate(['/Ajouterwallix']);
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

  getFileDownloadUrl(wallixId: number): string {
    return this.wallixService.getFileDownloadUrlById(wallixId);
  }
  selectWallix(w: Wallix): void { this.selectedWallix = this.selectedWallix?.wallixId === w.wallixId ? null : w; }
  closeDetail(): void { this.selectedWallix = null; }
}
  
