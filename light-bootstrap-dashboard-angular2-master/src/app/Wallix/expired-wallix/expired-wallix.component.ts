import { Component, OnInit } from '@angular/core';
import { WallixService } from 'app/Services/wallix.service';
import { Wallix } from 'app/Model/Wallix';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { TypeLicence } from 'app/Model/TypeLicence';

@Component({
  selector: 'app-expired-wallix',
  templateUrl: './expired-wallix.component.html',
  styleUrls: ['./expired-wallix.component.scss']
})
export class ExpiredWallixComponent implements OnInit {
  expiredWallixs: Wallix[] = [];
  filteredExpiredWallixs: Wallix[] = [];
  pagedExpiredWallixs: Wallix[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private wallixService: WallixService) {}

  ngOnInit(): void {
    this.loadApprovedWallixs();
  }

  // Load approved Wallix licenses
  loadApprovedWallixs(): void {
    this.wallixService.getAllWallixs().subscribe(
      (data: Wallix[]) => {
        console.log('All Wallixs from API:', data);

        // Filter only the approved Wallixs
        this.expiredWallixs = data.filter(wallix => 
          wallix.approuve === true 
        );
        
        this.filteredExpiredWallixs = [...this.expiredWallixs];
        this.updatePagination();

        console.log('Filtered approved Wallixs:', this.expiredWallixs);
      },
      (error) => {
        console.error('Error loading Wallixs', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredWallixs = [...this.expiredWallixs];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredWallixs = this.expiredWallixs.filter(wallix =>
        (wallix.client && wallix.client.toLowerCase().includes(searchLower)) ||
        (wallix.nomDuContact && wallix.nomDuContact.toLowerCase().includes(searchLower)) ||
        (wallix.adresseEmailContact && wallix.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (wallix.mailAdmin && wallix.mailAdmin.toLowerCase().includes(searchLower)) ||
        (wallix.remarque && wallix.remarque.toLowerCase().includes(searchLower)) ||
        (wallix.ccMail && wallix.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (wallix.licences && wallix.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredWallixs.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedWallixs();
  }

  updatePagedWallixs() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredWallixs = this.filteredExpiredWallixs.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedWallixs();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.wallixService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Wallix de la liste approuvée locale
      this.expiredWallixs = this.expiredWallixs.filter(wallix => wallix.wallixId !== id);
      this.filteredExpiredWallixs = this.filteredExpiredWallixs.filter(wallix => wallix.wallixId !== id);
      this.updatePagination();
      console.log('Wallix désapprouvé avec succès');
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

  getTypeLabel(typeValue: TypeLicence | any): string {
    if (!typeValue) return 'N/A';
    
    if (typeof typeValue === 'string') {
      return typeValue;
    } else if (typeof typeValue === 'object' && typeValue.value) {
      return typeValue.value;
    } else if (typeof typeValue === 'object' && typeValue.libelle) {
      return typeValue.libelle;
    }
    
    return String(typeValue);
  }

  getFileDownloadUrl(id: number): string {
    return this.wallixService.getFileDownloadUrlById(id);
  }
}
