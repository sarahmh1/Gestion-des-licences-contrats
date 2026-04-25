import { Component, OnInit } from '@angular/core';
import { BitdefenderService } from 'app/Services/bitdefender.service';
import { Bitdefender } from 'app/Model/Bitdefender';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-afficherb',
  templateUrl: './afficherb.component.html',
  styleUrls: ['./afficherb.component.scss']
})
export class AfficherbComponent implements OnInit {

  searchTerm: string = '';
  selectedBitdefender: Bitdefender | null = null;
   bitdefenders: Bitdefender[] = [];
   filteredBitdefenders: Bitdefender[] = [];
 unapprovedBitdefenders: Bitdefender[] = [];
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedBitdefenders:Bitdefender[] = [];
 
   constructor(private bitdefenderService: BitdefenderService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllBitdefenders();
    }
  
    onSearch() {
      this.filteredBitdefenders = this.filterBitdefenders();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllBitdefenders(): void {
      this.bitdefenderService.getAllBitdefenders().subscribe(
        (data: Bitdefender[]) => {
          this.bitdefenders = data;
          this.filteredBitdefenders = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration bitdefenders', error);
        }
      );
    }
  
    filterBitdefenders(): Bitdefender[] {
      const term = this.searchTerm.toLowerCase();
      return this.bitdefenders.filter((bitdefender) => {
        const inLicences = bitdefender.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          bitdefender.client?.toLowerCase().includes(term) ||
          bitdefender.nomDuContact?.toLowerCase().includes(term) ||
          bitdefender.adresseEmailContact?.toLowerCase().includes(term) ||
          bitdefender.numero?.toLowerCase().includes(term) ||
          bitdefender.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredBitdefenders.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedBitdefenders = this.filteredBitdefenders.slice(start, end);
    }
  
    approveBitdefender(id: number): void {
      this.bitdefenderService.activate(id).subscribe(() => {
       this.unapprovedBitdefenders = this.unapprovedBitdefenders.filter(bitdefender => bitdefender.bitdefenderId !== id);
      this.filteredBitdefenders = this.filteredBitdefenders.filter(bitdefender => bitdefender.bitdefenderId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteBitdefender(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.bitdefenderService.deleteBitdefender(id).subscribe(
          () => {
            this.getAllBitdefenders();
            alert('Bitdefender supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression Bitdefender', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateBitdefender(bitdefender: Bitdefender): void {
      this.router.navigate(['/edit-bitdefender', bitdefender.bitdefenderId]);
    }
  
    goToAddBitdefender() {
      this.router.navigate(['/Ajouterb']);
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
  return this.bitdefenderService.getFileDownloadUrl(id);
}
  
  selectBitdefender(x: Bitdefender): void { this.selectedBitdefender = this.selectedBitdefender?.bitdefenderId === x.bitdefenderId ? null : x; }
  closeDetail(): void { this.selectedBitdefender = null; }
}
