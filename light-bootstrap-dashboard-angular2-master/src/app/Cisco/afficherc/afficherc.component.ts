import { Component, OnInit } from '@angular/core';
import { CiscoService } from 'app/Services/cisco.service';
import { Cisco } from 'app/Model/Cisco';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-afficherc',
  templateUrl: './afficherc.component.html',
  styleUrls: ['./afficherc.component.scss']
})
export class AffichercComponent implements OnInit {

  searchTerm: string = '';
  selectedCisco: Cisco | null = null;
   ciscos: Cisco[] = [];
   filteredCiscos: Cisco[] = [];
   unapprovedCiscos: Cisco[] = [];
 
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedCiscos:Cisco[] = [];
 
   constructor(private ciscoService: CiscoService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllCiscos();
    }
  
    onSearch() {
      this.filteredCiscos = this.filterCiscos();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllCiscos(): void {
      this.ciscoService.getAllCiscos().subscribe(
        (data: Cisco[]) => {
          this.ciscos = data;
          this.filteredCiscos = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur récupération Ciscos', error);
        }
      );
    }
  
    filterCiscos(): Cisco[] {
      const term = this.searchTerm.toLowerCase();
      return this.ciscos.filter((cisco) => {
        const inLicences = cisco.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          cisco.client?.toLowerCase().includes(term) ||
          cisco.nomDuContact?.toLowerCase().includes(term) ||
          cisco.adresseEmailContact?.toLowerCase().includes(term) ||
          cisco.numero?.toLowerCase().includes(term) ||
          cisco.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredCiscos.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedCiscos = this.filteredCiscos.slice(start, end);
    }
  
    approveCisco(id: number): void {
      this.ciscoService.activate(id).subscribe(() => {
      this.unapprovedCiscos = this.unapprovedCiscos.filter(cisco => cisco.ciscoId !== id);
      this.filteredCiscos = this.filteredCiscos.filter(cisco=> cisco.ciscoId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuvé et retiré de la liste');
    });
  }
  
    deleteCisco(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.ciscoService.deleteCisco(id).subscribe(
          () => {
            this.getAllCiscos();
            alert('Cisco supprimé avec succès');
          },
          error => {
            console.error('Erreur suppression Cisco', error);
            alert('Échec suppression');
          }
        );
      }
    }
  
    updateCisco(cisco: Cisco): void {
      this.router.navigate(['/edit-cisco', cisco.ciscoId]);
    }
  
    goToAddCisco() {
      this.router.navigate(['/Ajouterc']);
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
    return this.ciscoService.getFileDownloadUrl(id);
  }
  
  selectCisco(x: Cisco): void { this.selectedCisco = this.selectedCisco?.ciscoId === x.ciscoId ? null : x; }
  closeDetail(): void { this.selectedCisco = null; }
}
