import { Component, OnInit } from '@angular/core';
import { SentineIOneService } from 'app/Services/sentineIOne.service';
import { SentineIOne } from 'app/Model/SentineIOne';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-sentineione',
  templateUrl: './expired-sentineione.component.html',
  styleUrls: ['./expired-sentineione.component.scss']
})
export class ExpiredSentineIOneComponent implements OnInit {
  expiredSentineIOnes: SentineIOne[] = [];
  filteredExpiredSentineIOnes: SentineIOne[] = [];
  pagedExpiredSentineIOnes: SentineIOne[] = [];
  searchTerm: string = '';
  selectedSentineIOne: SentineIOne | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private sentineIOneService: SentineIOneService) {}

  ngOnInit(): void {
    this.loadApprovedSentineIOnes();
  }

  // Load approved SentineIOne licenses
  loadApprovedSentineIOnes(): void {
    this.sentineIOneService.getAllSentineIOnes().subscribe(
      (data: SentineIOne[]) => {
        console.log('All SentineIOnes from API:', data);

        // Filter only the approved SentineIOnes
        this.expiredSentineIOnes = data.filter(sentineIOne => 
          sentineIOne.approuve === true 
        );
        
        this.filteredExpiredSentineIOnes = [...this.expiredSentineIOnes];
        this.updatePagination();

        console.log('Filtered approved SentineIOnes:', this.expiredSentineIOnes);
      },
      (error) => {
        console.error('Error loading SentineIOnes', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredSentineIOnes = [...this.expiredSentineIOnes];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredSentineIOnes = this.expiredSentineIOnes.filter(sentineIOne =>
        (sentineIOne.client && sentineIOne.client.toLowerCase().includes(searchLower)) ||
        (sentineIOne.nomDuContact && sentineIOne.nomDuContact.toLowerCase().includes(searchLower)) ||
        (sentineIOne.adresseEmailContact && sentineIOne.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (sentineIOne.mailAdmin && sentineIOne.mailAdmin.toLowerCase().includes(searchLower)) ||
        (sentineIOne.remarque && sentineIOne.remarque.toLowerCase().includes(searchLower)) ||
        (sentineIOne.ccMail && sentineIOne.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (sentineIOne.licences && sentineIOne.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredSentineIOnes.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedSentineIOnes();
  }

  updatePagedSentineIOnes() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredSentineIOnes = this.filteredExpiredSentineIOnes.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedSentineIOnes();
    }
  }

  // Méthode pour désapprouver
  selectSentineIOne(item: SentineIOne): void {
    this.selectedSentineIOne = item;
  }

  closeDetail(): void {
    this.selectedSentineIOne = null;
  }

  desapprouve(id: number): void {
    this.sentineIOneService.activate(id).subscribe(() => {
      if (this.selectedSentineIOne?.sentineIOneId === id) {
        this.selectedSentineIOne = null;
      }
      // Après désapprobation, retirer le SentineIOne de la liste approuvée locale
      this.expiredSentineIOnes = this.expiredSentineIOnes.filter(sentineIOne => sentineIOne.sentineIOneId !== id);
      this.filteredExpiredSentineIOnes = this.filteredExpiredSentineIOnes.filter(sentineIOne => sentineIOne.sentineIOneId !== id);
      this.updatePagination();
      console.log('SentineIOne désapprouvé avec succès');
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
    return this.sentineIOneService.getFileDownloadUrl(id);
  }
}
