import { Component, OnInit } from '@angular/core';
import { SentineIOneService } from 'app/Services/sentineIOne.service';
import { SentineIOne } from 'app/Model/SentineIOne';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-affichers',
  templateUrl: './affichers.component.html',
  styleUrls: ['./affichers.component.scss']
})
export class AfficherssComponent implements OnInit {

  searchTerm: string = '';
  selectedSentineIOne: SentineIOne | null = null;
   sentineIOnes: SentineIOne[] = [];
   filteredSentineIOnes: SentineIOne[] = [];
   unapprovedSentineIOnes: SentineIOne[] = [];
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedSentineIOnes:SentineIOne[] = [];
 
   constructor(private sentineIOneService: SentineIOneService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllSentineIOnes();
    }
  
    onSearch() {
      this.filteredSentineIOnes = this.filterSentineIOnes();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllSentineIOnes(): void {
      this.sentineIOneService.getAllSentineIOnes().subscribe(
        (data: SentineIOne[]) => {
          this.sentineIOnes = data;
          this.filteredSentineIOnes = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur récupération SentineIOnes', error);
        }
      );
    }
  
    filterSentineIOnes(): SentineIOne[] {
      const term = this.searchTerm.toLowerCase();
      return this.sentineIOnes.filter((sentineIOne) => {
        const inLicences = sentineIOne.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          sentineIOne.client?.toLowerCase().includes(term) ||
          sentineIOne.nomDuContact?.toLowerCase().includes(term) ||
          sentineIOne.adresseEmailContact?.toLowerCase().includes(term) ||
          sentineIOne.numero?.toLowerCase().includes(term) ||
          sentineIOne.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredSentineIOnes.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedSentineIOnes = this.filteredSentineIOnes.slice(start, end);
    }
  
    approveSentineIOne(id: number): void {
      this.sentineIOneService.activate(id).subscribe(() => {
       this.unapprovedSentineIOnes = this.unapprovedSentineIOnes.filter(sentineIOne => sentineIOne.sentineIOneId !== id);
      this.filteredSentineIOnes = this.filteredSentineIOnes.filter(sentineIOne => sentineIOne.sentineIOneId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuvé et retiré de la liste');
    });
  }
  
    deleteSentineIOne(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.sentineIOneService.deleteSentineIOne(id).subscribe(
          () => {
            this.getAllSentineIOnes();
            alert('SentineIOne supprimé avec succès');
          },
          error => {
            console.error('Erreur suppression SentineIOne', error);
            alert('Échec suppression');
          }
        );
      }
    }
  
    updateSentineIOne(sentineIOne: SentineIOne): void {
      this.router.navigate(['/edit-sentineIOne', sentineIOne.sentineIOneId]);
    }
  
    goToAddSentineIOne() {
      this.router.navigate(['/Ajouters']);
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
      return this.sentineIOneService.getFileDownloadUrl(id);
    }

  selectSentineIOne(x: SentineIOne): void { this.selectedSentineIOne = this.selectedSentineIOne?.sentineIOneId === x.sentineIOneId ? null : x; }
  closeDetail(): void { this.selectedSentineIOne = null; }
}
