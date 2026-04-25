import { Component, OnInit } from '@angular/core';
import { OneIdentityService } from 'app/Services/oneIdentity.service';
import { Router } from '@angular/router';
import { OneIdentity } from 'app/Model/OneIdentity';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-affichero',
  templateUrl: './affichero.component.html',
  styleUrls: ['./affichero.component.scss']
})
export class AfficheroComponent implements OnInit {

  searchTerm: string = '';
  selectedOneIdentity: OneIdentity | null = null;
   oneIdentitys: OneIdentity[] = [];
   filteredOneIdentitys: OneIdentity[] = [];
   unapprovedOneIdentitys: OneIdentity[] = [];
 
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedOneIdentitys:OneIdentity[] = [];
 
   constructor(private oneIdentityService: OneIdentityService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllOneIdentitys();
    }
  
    onSearch() {
      this.filteredOneIdentitys = this.filterOneIdentitys();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllOneIdentitys(): void {
      this.oneIdentityService.getAllOneIdentitys().subscribe(
        (data: OneIdentity[]) => {
          this.oneIdentitys = data;
          this.filteredOneIdentitys = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration OneIdentitys', error);
        }
      );
    }
  
    filterOneIdentitys(): OneIdentity[] {
      const term = this.searchTerm.toLowerCase();
      return this.oneIdentitys.filter((oneIdentity) => {
        const inLicences = oneIdentity.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          oneIdentity.client?.toLowerCase().includes(term) ||
          oneIdentity.nomDuContact?.toLowerCase().includes(term) ||
          oneIdentity.adresseEmailContact?.toLowerCase().includes(term) ||
          oneIdentity.numero?.toLowerCase().includes(term) ||
          oneIdentity.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredOneIdentitys.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedOneIdentitys = this.filteredOneIdentitys.slice(start, end);
    }
  
    approveOneIdentity(id: number): void {
      this.oneIdentityService.activate(id).subscribe(() => {
       this.unapprovedOneIdentitys = this.unapprovedOneIdentitys.filter(oneIdentity => oneIdentity.oneIdentityId !== id);
      this.filteredOneIdentitys = this.filteredOneIdentitys.filter(oneIdentity => oneIdentity.oneIdentityId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteOneIdentity(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.oneIdentityService.deleteOneIdentity(id).subscribe(
          () => {
            this.getAllOneIdentitys();
            alert('OneIdentity supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression OneIdentity', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateOneIdentity(oneIdentity: OneIdentity): void {
      this.router.navigate(['/edit-oneIdentity', oneIdentity.oneIdentityId]);
    }
  
    goToAddOneIdentity() {
      this.router.navigate(['/Ajoutero']);
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
  return this.oneIdentityService.getFileDownloadUrl(id);
}
  
  selectOneIdentity(x: OneIdentity): void { this.selectedOneIdentity = this.selectedOneIdentity?.oneIdentityId === x.oneIdentityId ? null : x; }
  closeDetail(): void { this.selectedOneIdentity = null; }
}
