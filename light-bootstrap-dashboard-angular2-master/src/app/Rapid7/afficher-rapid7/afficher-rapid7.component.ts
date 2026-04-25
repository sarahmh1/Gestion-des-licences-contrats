import { Component, OnInit } from '@angular/core';
import { Rapid7Service } from 'app/Services/rapid7.service';
import { Rapid7 } from 'app/Model/Rapid7';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficher-rapid7',
  templateUrl: './afficher-rapid7.component.html',
  styleUrls: ['./afficher-rapid7.component.scss']
})
export class AfficherRapid7Component implements OnInit {
   searchTerm: string = '';
  selectedRapid7: Rapid7 | null = null;
    rapid7s: Rapid7[] = [];
    filteredRapid7s: Rapid7[] = []; 
    unapprovedRapid7s: Rapid7[] = [];
  
     currentPage = 0;
      pageSize = 10;
      totalPages: number = 0;
      pagedRapid7s: Rapid7[] = [];
  
    constructor(private rapid7Service: Rapid7Service, private router: Router, public permissionService: PermissionService) {}
  
   ngOnInit(): void {
       this.getAllRapid7s();
     }
   
     onSearch() {
       this.filteredRapid7s = this.filterRapid7s();
       this.calculatePagination();
       this.changePage(0);
     }
   
     getAllRapid7s(): void {
       this.rapid7Service.getAllRapid7s().subscribe(
         (data: Rapid7[]) => {
           this.rapid7s = data;
           this.filteredRapid7s = data;
           this.calculatePagination();
           this.changePage(0);
         },
         (error) => {
           console.error('Erreur r�cup�ration Rapid7s', error);
         }
       );
     }
   
     filterRapid7s(): Rapid7[] {
       const term = this.searchTerm.toLowerCase();
       return this.rapid7s.filter((rapid7) => {
         const inLicences = rapid7.licences?.some(lic =>
           lic.nomDesLicences?.toLowerCase().includes(term) ||
           lic.quantite?.toLowerCase().includes(term) ||
           (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
         );
   
         const inMainFields =
           rapid7.client?.toLowerCase().includes(term) ||
           rapid7.nomDuContact?.toLowerCase().includes(term) ||
           rapid7.adresseEmailContact?.toLowerCase().includes(term) ||
           rapid7.numero?.toLowerCase().includes(term) ||
           rapid7.cleLicences?.toLowerCase().includes(term) ||
           rapid7.dureeDeLicence?.toLowerCase?.().includes(term);
   
         return inMainFields || inLicences;
       });
     }
   
     calculatePagination() {
       this.totalPages = Math.ceil(this.filteredRapid7s.length / this.pageSize);
     }
   
     changePage(pageIndex: number) {
       this.currentPage = pageIndex;
       const start = this.currentPage * this.pageSize;
       const end = start + this.pageSize;
       this.pagedRapid7s = this.filteredRapid7s.slice(start, end);
     }
   
     approveRapid7(id: number): void {
       this.rapid7Service.activate(id).subscribe(() => {
      this.unapprovedRapid7s = this.unapprovedRapid7s.filter(rapid7 => rapid7.rapid7Id !== id);
      this.filteredRapid7s = this.filteredRapid7s.filter(rapid7 => rapid7.rapid7Id !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
   
     deleteRapid7(id: number | undefined | null): void {
       if (id != null && confirm('Confirmer la suppression ?')) {
         this.rapid7Service.deleteRapid7(id).subscribe(
           () => {
             this.getAllRapid7s();
             alert('rapid7 supprim� avec succ�s');
           },
           error => {
             console.error('Erreur suppression rapid7', error);
             alert('�chec suppression');
           }
         );
       }
     }
   
     updateRapid7(rapid7: Rapid7): void {
       this.router.navigate(['/edit-rapid7', rapid7.rapid7Id]);
     }
   
     goToAddRapid7() {
       this.router.navigate(['/Ajouterrapid7']);
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

  getFileDownloadUrl(rapid7Id: number): string {
    return this.rapid7Service.getFileDownloadUrlById(rapid7Id);
  }
   
  selectRapid7(x: Rapid7): void { this.selectedRapid7 = this.selectedRapid7?.rapid7Id === x.rapid7Id ? null : x; }
  closeDetail(): void { this.selectedRapid7 = null; }
}
