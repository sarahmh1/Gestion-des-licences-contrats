import { Component, OnInit } from '@angular/core';
import { ImpervaService } from 'app/Services/imperva.service';
import { Imperva} from 'app/Model/Imperva';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-afficherim',
  templateUrl: './afficherim.component.html',
  styleUrls: ['./afficherim.component.scss']
})
export class AfficherimComponent implements OnInit {

  searchTerm: string = '';
  selectedImperva: Imperva | null = null;
   impervas: Imperva[] = [];
   filteredImpervas: Imperva[] = [];
 unapprovedImpervas: Imperva[] = [];
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedImpervas:Imperva[] = [];
 
   constructor(private impervaService: ImpervaService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllImpervas();
    }
  
    onSearch() {
      this.filteredImpervas = this.filterImpervas();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllImpervas(): void {
      this.impervaService.getAllImpervas().subscribe(
        (data: Imperva[]) => {
          this.impervas = data;
          this.filteredImpervas = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration impervas', error);
        }
      );
    }
  
    filterImpervas(): Imperva[] {
      const term = this.searchTerm.toLowerCase();
      return this.impervas.filter((imperva) => {
        const inLicences = imperva.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          imperva.client?.toLowerCase().includes(term) ||
          imperva.nomDuContact?.toLowerCase().includes(term) ||
          imperva.adresseEmailContact?.toLowerCase().includes(term) ||
          imperva.numero?.toLowerCase().includes(term) ||
          imperva.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredImpervas.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedImpervas = this.filteredImpervas.slice(start, end);
    }
  
    approveImperva(id: number): void {
      this.impervaService.activate(id).subscribe(() => {
         this.unapprovedImpervas = this.unapprovedImpervas.filter(imperva => imperva.impervaId !== id);
      this.filteredImpervas = this.filteredImpervas.filter(imperva=> imperva.impervaId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteImperva(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.impervaService.deleteImperva(id).subscribe(
          () => {
            this.getAllImpervas();
            alert('Imperva supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression Imperva', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateImperva(imperva: Imperva): void {
      this.router.navigate(['/edit-imperva', imperva.impervaId]);
    }
  
    goToAddImperva() {
      this.router.navigate(['/Ajouterim']);
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
      return this.impervaService.getFileDownloadUrl(id);
    }
  
  selectImperva(x: Imperva): void { this.selectedImperva = this.selectedImperva?.impervaId === x.impervaId ? null : x; }
  closeDetail(): void { this.selectedImperva = null; }
}
