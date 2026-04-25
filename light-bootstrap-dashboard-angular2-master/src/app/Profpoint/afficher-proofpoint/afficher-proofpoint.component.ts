import { Component, OnInit } from '@angular/core';
import { ProofpointService } from 'app/Services/proofpoint.service';
import { Proofpoint } from 'app/Model/Proofpoint';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-afficher-proofpoint',
  templateUrl: './afficher-proofpoint.component.html',
  styleUrls: ['./afficher-proofpoint.component.scss']
})
export class AfficherProofpointComponent implements OnInit {
  searchTerm: string = '';
  selectedProofpoint: Proofpoint | null = null;
  proofpoints: Proofpoint[] = [];
  filteredProofpoints: Proofpoint[] = [];
  unapprovedProofpoints: Proofpoint[] = [];

   currentPage = 0;
    pageSize = 10;
    totalPages: number = 0;
    pagedProofpoints: Proofpoint[] = [];

  constructor(private proofpointService: ProofpointService, private router: Router, public permissionService: PermissionService) {}

 ngOnInit(): void {
     this.getAllProofpoints();
   }
 
   onSearch() {
     this.filteredProofpoints = this.filterProofpoints();
     this.calculatePagination();
     this.changePage(0);
   }
 
   getAllProofpoints(): void {
     this.proofpointService.getAllProofpoints().subscribe(
       (data: Proofpoint[]) => {
         this.proofpoints = data;
         this.filteredProofpoints = data;
         this.calculatePagination();
         this.changePage(0);
       },
       (error) => {
         console.error('Erreur r�cup�ration Proofpoints', error);
       }
     );
   }
 
   filterProofpoints(): Proofpoint[] {
     const term = this.searchTerm.toLowerCase();
     return this.proofpoints.filter((proofpoint) => {
       const inLicences = proofpoint.licences?.some(lic =>
         lic.nomDesLicences?.toLowerCase().includes(term) ||
         lic.quantite?.toLowerCase().includes(term) ||
         (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
       );
 
       const inMainFields =
         proofpoint.client?.toLowerCase().includes(term) ||
         proofpoint.nomDuContact?.toLowerCase().includes(term) ||
         proofpoint.adresseEmailContact?.toLowerCase().includes(term) ||
         proofpoint.numero?.toLowerCase().includes(term) ||
         proofpoint.dureeDeLicence?.toLowerCase?.().includes(term);
 
       return inMainFields || inLicences;
     });
   }
 
   calculatePagination() {
     this.totalPages = Math.ceil(this.filteredProofpoints.length / this.pageSize);
   }
 
   changePage(pageIndex: number) {
     this.currentPage = pageIndex;
     const start = this.currentPage * this.pageSize;
     const end = start + this.pageSize;
     this.pagedProofpoints = this.filteredProofpoints.slice(start, end);
   }
 
   approveProofpoint(id: number): void {
     this.proofpointService.activate(id).subscribe(() => {
      this.unapprovedProofpoints = this.unapprovedProofpoints.filter(proofpoint => proofpoint.proofpointId !== id);
      this.filteredProofpoints = this.filteredProofpoints.filter(proofpoint => proofpoint.proofpointId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
 
   deleteProofpoint(id: number | undefined | null): void {
     if (id != null && confirm('Confirmer la suppression ?')) {
       this.proofpointService.deleteProofpoint(id).subscribe(
         () => {
           this.getAllProofpoints();
           alert('proofpoint supprim� avec succ�s');
         },
         error => {
           console.error('Erreur suppression proofpoint', error);
           alert('�chec suppression');
         }
       );
     }
   }
 
   updateProofpoint(proofpoint: Proofpoint): void {
     this.router.navigate(['/edit-proofpoint', proofpoint.proofpointId]);
   }
 
   goToAddProofpoint() {
     this.router.navigate(['/Ajouterproof']);
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

  getFileDownloadUrl(proofpointId: number): string {
    return this.proofpointService.getFileDownloadUrlById(proofpointId);
  }
 
  selectProofpoint(x: Proofpoint): void { this.selectedProofpoint = this.selectedProofpoint?.proofpointId === x.proofpointId ? null : x; }
  closeDetail(): void { this.selectedProofpoint = null; }
}
