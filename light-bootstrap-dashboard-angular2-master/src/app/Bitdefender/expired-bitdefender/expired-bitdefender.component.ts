import { Component, OnInit } from '@angular/core';
import { BitdefenderService } from 'app/Services/bitdefender.service';
import { Bitdefender } from 'app/Model/Bitdefender';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-bitdefender',
  templateUrl: './expired-bitdefender.component.html',
  styleUrls: ['./expired-bitdefender.component.scss']
})
export class ExpiredBitdefenderComponent implements OnInit {
  expiredBitdefenders: Bitdefender[] = [];
  filteredExpiredBitdefenders: Bitdefender[] = [];
  pagedExpiredBitdefenders: Bitdefender[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private bitdefenderService: BitdefenderService) {}

  ngOnInit(): void {
    this.loadApprovedBitdefenders();
  }

  // Load approved Bitdefender licenses
  loadApprovedBitdefenders(): void {
    this.bitdefenderService.getAllBitdefenders().subscribe(
      (data: Bitdefender[]) => {
        console.log('All Bitdefenders from API:', data);

        // Filter only the approved Bitdefenders
        this.expiredBitdefenders = data.filter(bitdefender => 
          bitdefender.approuve === true 
        );
        
        this.filteredExpiredBitdefenders = [...this.expiredBitdefenders];
        this.updatePagination();

        console.log('Filtered approved Bitdefenders:', this.expiredBitdefenders);
      },
      (error) => {
        console.error('Error loading Bitdefenders', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredBitdefenders = [...this.expiredBitdefenders];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredBitdefenders = this.expiredBitdefenders.filter(bitdefender =>
        (bitdefender.client && bitdefender.client.toLowerCase().includes(searchLower)) ||
        (bitdefender.nomDuContact && bitdefender.nomDuContact.toLowerCase().includes(searchLower)) ||
        (bitdefender.adresseEmailContact && bitdefender.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (bitdefender.mailAdmin && bitdefender.mailAdmin.toLowerCase().includes(searchLower)) ||
        (bitdefender.remarque && bitdefender.remarque.toLowerCase().includes(searchLower)) ||
        (bitdefender.ccMail && bitdefender.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (bitdefender.licences && bitdefender.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredBitdefenders.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedBitdefenders();
  }

  updatePagedBitdefenders() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredBitdefenders = this.filteredExpiredBitdefenders.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedBitdefenders();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.bitdefenderService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Bitdefender de la liste approuvée locale
      this.expiredBitdefenders = this.expiredBitdefenders.filter(bitdefender => bitdefender.bitdefenderId !== id);
      this.filteredExpiredBitdefenders = this.filteredExpiredBitdefenders.filter(bitdefender => bitdefender.bitdefenderId !== id);
      this.updatePagination();
      console.log('Bitdefender désapprouvé avec succès');
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
    return this.bitdefenderService.getFileDownloadUrl(id);
  }
}
