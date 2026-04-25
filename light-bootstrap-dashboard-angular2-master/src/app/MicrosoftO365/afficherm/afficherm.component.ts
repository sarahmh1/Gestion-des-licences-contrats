import { Component, OnInit } from '@angular/core';
import { MicrosoftO365Service } from 'app/Services/microsoft-o365.service';
import { MicrosoftO365 } from 'app/Model/MicrosoftO365';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficherm',
  templateUrl: './afficherm.component.html',
  styleUrls: ['./afficherm.component.scss']
})
export class AffichermComponent implements OnInit {
 
   searchTerm: string = '';
  selectedMicrosoftO365: MicrosoftO365 | null = null;
    microsofts: MicrosoftO365[] = [];
    filteredMicrosofts: MicrosoftO365[] = [];
  unapprovedMicrosofts: MicrosoftO365[] = [];
     currentPage = 0;
      pageSize = 10;
      totalPages: number = 0;
      pagedMicrosoftO365s:MicrosoftO365[] = [];
  
    constructor(private microsoftO365Service: MicrosoftO365Service, private router: Router, public permissionService: PermissionService) {}
  
   ngOnInit(): void {
       this.getAllMicrosoftO365s();
     }
   
     onSearch() {
       this.filteredMicrosofts = this.filterMicrosoftO365s();
       this.calculatePagination();
       this.changePage(0);
     }
   
     getAllMicrosoftO365s(): void {
       this.microsoftO365Service.getAllMicrosoftO365s().subscribe(
         (data: MicrosoftO365[]) => {
           this.microsofts = data;
           this.filteredMicrosofts = data;
           this.calculatePagination();
           this.changePage(0);
         },
         (error) => {
           console.error('Erreur r�cup�ration MicrosoftO365s', error);
         }
       );
     }
   
     filterMicrosoftO365s(): MicrosoftO365[] {
       const term = this.searchTerm.toLowerCase();
       return this.microsofts.filter((microsoftO365) => {
         const inLicences = microsoftO365.licences?.some(lic =>
           lic.nomDesLicences?.toLowerCase().includes(term) ||
           lic.quantite?.toLowerCase().includes(term) ||
           (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
         );
   
         const inMainFields =
           microsoftO365.client?.toLowerCase().includes(term) ||
           microsoftO365.nomDuContact?.toLowerCase().includes(term) ||
           microsoftO365.adresseEmailContact?.toLowerCase().includes(term) ||
           microsoftO365.numero?.toLowerCase().includes(term) ||
           microsoftO365.dureeDeLicence?.toLowerCase?.().includes(term);
   
         return inMainFields || inLicences;
       });
     }
   
     calculatePagination() {
       this.totalPages = Math.ceil(this.filteredMicrosofts.length / this.pageSize);
     }
   
     changePage(pageIndex: number) {
       this.currentPage = pageIndex;
       const start = this.currentPage * this.pageSize;
       const end = start + this.pageSize;
       this.pagedMicrosoftO365s = this.filteredMicrosofts.slice(start, end);
     }
   
     approveMicrosoftO365(id: number): void {
       this.microsoftO365Service.activate(id).subscribe(() => {
      this.unapprovedMicrosofts = this.unapprovedMicrosofts.filter(microsoft => microsoft.microsoftO365Id !== id);
      this.filteredMicrosofts = this.filteredMicrosofts.filter(microsoft => microsoft.microsoftO365Id !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
   
     deleteMicrosoftO365(id: number | undefined | null): void {
       if (id != null && confirm('Confirmer la suppression ?')) {
         this.microsoftO365Service.deleteMicrosoftO365(id).subscribe(
           () => {
             this.getAllMicrosoftO365s();
             alert('MicrosoftO365 supprim� avec succ�s');
           },
           error => {
             console.error('Erreur suppression MicrosoftO365', error);
             alert('�chec suppression');
           }
         );
       }
     }
   
     updateMicrosoftO365(microsoftO365: MicrosoftO365): void {
       this.router.navigate(['/edit-micro', microsoftO365.microsoftO365Id]);
     }
   
     goToAddmicrosoftO365() {
       this.router.navigate(['/Ajoutermicro']);
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
      return this.microsoftO365Service.getFileDownloadUrl(id);
    }
   
  selectMicrosoftO365(x: MicrosoftO365): void { this.selectedMicrosoftO365 = this.selectedMicrosoftO365?.microsoftO365Id === x.microsoftO365Id ? null : x; }
  closeDetail(): void { this.selectedMicrosoftO365 = null; }
}
