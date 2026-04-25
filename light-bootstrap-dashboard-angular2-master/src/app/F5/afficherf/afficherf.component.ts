import { Component, OnInit } from '@angular/core';
import { F5Service } from 'app/Services/f5.service';
import { F5 } from 'app/Model/F5';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-afficherf',
  templateUrl: './afficherf.component.html',
  styleUrls: ['./afficherf.component.scss']
})
export class AfficherfComponent implements OnInit {

  searchTerm: string = '';
  selectedF5: F5 | null = null;
   f5s: F5[] = [];
   filteredF5s: F5[] = [];
 
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedF5s:F5[] = [];
     unapprovedF5s:F5[] = [];
 
   constructor(private f5Service: F5Service, private router: Router, public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.f5Service.getFileDownloadUrl(id);
  }
 
  ngOnInit(): void {
      this.getAllF5s();
    }
  
    onSearch() {
      this.filteredF5s = this.filterF5s();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllF5s(): void {
      this.f5Service.getAllF5s().subscribe(
        (data: F5[]) => {
          this.f5s = data;
          this.filteredF5s = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration F5s', error);
        }
      );
    }
  
    filterF5s(): F5[] {
      const term = this.searchTerm.toLowerCase();
      return this.f5s.filter((f5) => {
        const inLicences = f5.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          f5.client?.toLowerCase().includes(term) ||
          f5.nomDuContact?.toLowerCase().includes(term) ||
          f5.adresseEmailContact?.toLowerCase().includes(term) ||
          f5.numero?.toLowerCase().includes(term) ||
          f5.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredF5s.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedF5s = this.filteredF5s.slice(start, end);
    }
  
    approveF5(id: number): void {
      this.f5Service.activate(id).subscribe(() => {
      this.unapprovedF5s = this.unapprovedF5s.filter(f5 => f5.f5Id !== id);
      this.filteredF5s= this.filteredF5s.filter(f5 => f5.f5Id !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteF5(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.f5Service.deleteF5(id).subscribe(
          () => {
            this.getAllF5s();
            alert('F5 supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression F5', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateF5(f5: F5): void {
      this.router.navigate(['/edit-f5', f5.f5Id]);
    }
  
    goToAddF5() {
      this.router.navigate(['/Ajouterf']);
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
  
  selectF5(x: F5): void { this.selectedF5 = this.selectedF5?.f5Id === x.f5Id ? null : x; }
  closeDetail(): void { this.selectedF5 = null; }
}
