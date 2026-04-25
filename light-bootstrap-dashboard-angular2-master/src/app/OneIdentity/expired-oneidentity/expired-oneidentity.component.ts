import { Component, OnInit } from '@angular/core';
import { OneIdentityService } from 'app/Services/oneIdentity.service';
import { OneIdentity } from 'app/Model/OneIdentity';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-oneidentity',
  templateUrl: './expired-oneidentity.component.html',
  styleUrls: ['./expired-oneidentity.component.scss']
})
export class ExpiredOneIdentityComponent implements OnInit {
  expiredOneIdentitys: OneIdentity[] = [];
  filteredExpiredOneIdentitys: OneIdentity[] = [];
  pagedExpiredOneIdentitys: OneIdentity[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private oneIdentityService: OneIdentityService) {}

  ngOnInit(): void {
    this.loadApprovedOneIdentitys();
  }

  // Load approved OneIdentity licenses
  loadApprovedOneIdentitys(): void {
    this.oneIdentityService.getAllOneIdentitys().subscribe(
      (data: OneIdentity[]) => {
        console.log('All OneIdentitys from API:', data);

        // Filter only the approved OneIdentitys
        this.expiredOneIdentitys = data.filter(oneIdentity => 
          oneIdentity.approuve === true
        );
        
        this.filteredExpiredOneIdentitys = [...this.expiredOneIdentitys];
        this.updatePagination();

        console.log('Filtered approved OneIdentitys:', this.expiredOneIdentitys);
      },
      (error) => {
        console.error('Error loading OneIdentitys', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredOneIdentitys = [...this.expiredOneIdentitys];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredOneIdentitys = this.expiredOneIdentitys.filter(oneIdentity =>
        (oneIdentity.client && oneIdentity.client.toLowerCase().includes(searchLower)) ||
        (oneIdentity.nomDuContact && oneIdentity.nomDuContact.toLowerCase().includes(searchLower)) ||
        (oneIdentity.adresseEmailContact && oneIdentity.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (oneIdentity.mailAdmin && oneIdentity.mailAdmin.toLowerCase().includes(searchLower)) ||
        (oneIdentity.remarque && oneIdentity.remarque.toLowerCase().includes(searchLower)) ||
        (oneIdentity.ccMail && oneIdentity.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (oneIdentity.licences && oneIdentity.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredOneIdentitys.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedOneIdentitys();
  }

  updatePagedOneIdentitys() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredOneIdentitys = this.filteredExpiredOneIdentitys.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedOneIdentitys();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.oneIdentityService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le OneIdentity de la liste approuvée locale
      this.expiredOneIdentitys = this.expiredOneIdentitys.filter(oneIdentity => oneIdentity.oneIdentityId !== id);
      this.filteredExpiredOneIdentitys = this.filteredExpiredOneIdentitys.filter(oneIdentity => oneIdentity.oneIdentityId !== id);
      this.updatePagination();
      console.log('OneIdentity désapprouvé avec succès');
    });
  }

  getCommandePasserParLabel(value: CommandePasserPar | any): string {
    if (!value) return 'N/A';
    
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'object' && value.value) {
      return value.value;
    } else if (typeof value === 'object' && value.libelle) {
      return value.libelle;
    }
    
    return String(value);
  }

  getFileDownloadUrl(id: number): string {
    return this.oneIdentityService.getFileDownloadUrl(id);
  }
}
