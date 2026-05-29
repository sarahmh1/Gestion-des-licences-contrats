import { Component, OnInit } from '@angular/core';
import { MicrosoftO365Service } from 'app/Services/microsoft-o365.service';
import { MicrosoftO365 } from 'app/Model/MicrosoftO365';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-microsoft-o365',
  templateUrl: './expired-microsoft-o365.component.html',
  styleUrls: ['./expired-microsoft-o365.component.scss']
})
export class ExpiredMicrosoftO365Component implements OnInit {
  expiredMicrosoftO365s: MicrosoftO365[] = [];
  filteredExpiredMicrosoftO365s: MicrosoftO365[] = [];
  pagedExpiredMicrosoftO365s: MicrosoftO365[] = [];
  searchTerm: string = '';
  selectedMicrosoftO365: MicrosoftO365 | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private microsoftO365Service: MicrosoftO365Service) {}

  ngOnInit(): void {
    this.loadApprovedMicrosoftO365s();
  }

  // Load approved MicrosoftO365 licenses
  loadApprovedMicrosoftO365s(): void {
    this.microsoftO365Service.getAllMicrosoftO365s().subscribe(
      (data: MicrosoftO365[]) => {
        console.log('All MicrosoftO365s from API:', data);

        // Filter only the approved MicrosoftO365s
        this.expiredMicrosoftO365s = data.filter(microsoftO365 => 
          microsoftO365.approuve === true 
        );
        
        this.filteredExpiredMicrosoftO365s = [...this.expiredMicrosoftO365s];
        this.updatePagination();

        console.log('Filtered approved MicrosoftO365s:', this.expiredMicrosoftO365s);
      },
      (error) => {
        console.error('Error loading MicrosoftO365s', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredMicrosoftO365s = [...this.expiredMicrosoftO365s];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredMicrosoftO365s = this.expiredMicrosoftO365s.filter(microsoftO365 =>
        (microsoftO365.client && microsoftO365.client.toLowerCase().includes(searchLower)) ||
        (microsoftO365.nomDuContact && microsoftO365.nomDuContact.toLowerCase().includes(searchLower)) ||
        (microsoftO365.adresseEmailContact && microsoftO365.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (microsoftO365.mailAdmin && microsoftO365.mailAdmin.toLowerCase().includes(searchLower)) ||
        (microsoftO365.remarque && microsoftO365.remarque.toLowerCase().includes(searchLower)) ||
        (microsoftO365.ccMail && microsoftO365.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (microsoftO365.licences && microsoftO365.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredMicrosoftO365s.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedMicrosoftO365s();
  }

  updatePagedMicrosoftO365s() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredMicrosoftO365s = this.filteredExpiredMicrosoftO365s.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedMicrosoftO365s();
    }
  }

  // Méthode pour désapprouver
  selectMicrosoftO365(item: MicrosoftO365): void {
    this.selectedMicrosoftO365 = item;
  }

  closeDetail(): void {
    this.selectedMicrosoftO365 = null;
  }

  desapprouve(id: number): void {
    this.microsoftO365Service.activate(id).subscribe(() => {
      if (this.selectedMicrosoftO365?.microsoftO365Id === id) {
        this.selectedMicrosoftO365 = null;
      }
      // Après désapprobation, retirer le MicrosoftO365 de la liste approuvée locale
      this.expiredMicrosoftO365s = this.expiredMicrosoftO365s.filter(microsoftO365 => microsoftO365.microsoftO365Id !== id);
      this.filteredExpiredMicrosoftO365s = this.filteredExpiredMicrosoftO365s.filter(microsoftO365 => microsoftO365.microsoftO365Id !== id);
      this.updatePagination();
      console.log('Microsoft O365 désapprouvé avec succès');
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
    return this.microsoftO365Service.getFileDownloadUrl(id);
  }
}
