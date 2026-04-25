import { Component, OnInit } from '@angular/core';
import { NetskopeService } from 'app/Services/neskope.service';
import { Netskope } from 'app/Model/Netskope';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-affichern',
  templateUrl: './affichern.component.html',
  styleUrls: ['./affichern.component.scss']
})
export class AffichernComponent implements OnInit {

  searchTerm: string = '';
  selectedNetskope: Netskope | null = null;
   netskopes: Netskope[] = [];
   filteredNetskopes: Netskope[] = [];
   unapprovedNetskopes: Netskope[] = [];
 
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedNetskopes:Netskope[] = [];
 
   constructor(private netskopeService: NetskopeService, private router: Router, public permissionService: PermissionService) {}

  getFileDownloadUrl(id: number): string {
    return this.netskopeService.getFileDownloadUrl(id);
  }
 
  ngOnInit(): void {
      this.getAllNetskopes();
    }
  
    onSearch() {
      this.filteredNetskopes = this.filterNetskopes();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllNetskopes(): void {
      this.netskopeService.getAllNetskopes().subscribe(
        (data: Netskope[]) => {
          this.netskopes = data;
          this.filteredNetskopes = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration Netskopes', error);
        }
      );
    }
  
    filterNetskopes(): Netskope[] {
      const term = this.searchTerm.toLowerCase();
      return this.netskopes.filter((netskope) => {
        const inLicences = netskope.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          netskope.client?.toLowerCase().includes(term) ||
          netskope.nomDuContact?.toLowerCase().includes(term) ||
          netskope.adresseEmailContact?.toLowerCase().includes(term) ||
          netskope.numero?.toLowerCase().includes(term) ||
          netskope.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredNetskopes.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedNetskopes = this.filteredNetskopes.slice(start, end);
    }
  
    approveNetskope(id: number): void {
      this.netskopeService.activate(id).subscribe(() => {
      this.unapprovedNetskopes = this.unapprovedNetskopes.filter(netskope => netskope.netskopeId !== id);
      this.filteredNetskopes = this.filteredNetskopes.filter(netskope => netskope.netskopeId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteNetskope(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.netskopeService.deleteNetskope(id).subscribe(
          () => {
            this.getAllNetskopes();
            alert('Netskope supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression Netskope', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateNetskope(netskope: Netskope): void {
      this.router.navigate(['/edit-netskope', netskope.netskopeId]);
    }
  
    goToAddNetskope() {
      this.router.navigate(['/Ajoutern']);
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
  
  selectNetskope(x: Netskope): void { this.selectedNetskope = this.selectedNetskope?.netskopeId === x.netskopeId ? null : x; }
  closeDetail(): void { this.selectedNetskope = null; }
}
