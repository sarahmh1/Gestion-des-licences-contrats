import { Component, OnInit } from '@angular/core';
import { FortraService } from 'app/Services/fortra.service';
import { Fortra } from 'app/Model/Fortra';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-afficherfortra',
  templateUrl: './afficherfortra.component.html',
  styleUrls: ['./afficherfortra.component.scss']
})
export class AfficherfortraComponent implements OnInit {

  searchTerm: string = '';
  selectedFortra: Fortra | null = null;
   fortras: Fortra[] = [];
   filteredFortras: Fortra[] = [];
 
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedFortras:Fortra[] = [];
     unapprovedFortras:Fortra[] = [];
 
   constructor(private fortraService: FortraService, private router: Router, public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.fortraService.getFileDownloadUrl(id);
  }
 
  ngOnInit(): void {
      this.getAllFortras();
    }
  
    onSearch() {
      this.filteredFortras = this.filterFortras();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllFortras(): void {
      this.fortraService.getAllFortras().subscribe(
        (data: Fortra[]) => {
          this.fortras = data;
          this.filteredFortras = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration Fortras', error);
        }
      );
    }
  
    filterFortras(): Fortra[] {
      const term = this.searchTerm.toLowerCase();
      return this.fortras.filter((fortra) => {
        const inLicences = fortra.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          fortra.client?.toLowerCase().includes(term) ||
          fortra.nomDuContact?.toLowerCase().includes(term) ||
          fortra.adresseEmailContact?.toLowerCase().includes(term) ||
          fortra.numero?.toLowerCase().includes(term) ||
          fortra.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredFortras.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedFortras = this.filteredFortras.slice(start, end);
    }
  
    approveFortra(id: number): void {
      this.fortraService.activate(id).subscribe(() => {
       this.unapprovedFortras = this.unapprovedFortras.filter(fortra => fortra.fortraId !== id);
      this.filteredFortras = this.filteredFortras.filter(fortra => fortra.fortraId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteFortra(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.fortraService.deleteFortra(id).subscribe(
          () => {
            this.getAllFortras();
            alert('Fortra supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression fortra', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateFortra(fortra: Fortra): void {
      this.router.navigate(['/edit-fortra', fortra.fortraId]);
    }
  
    goToAddFortra() {
      this.router.navigate(['/Ajouterfortra']);
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
  
  selectFortra(x: Fortra): void { this.selectedFortra = this.selectedFortra?.fortraId === x.fortraId ? null : x; }
  closeDetail(): void { this.selectedFortra = null; }
}
