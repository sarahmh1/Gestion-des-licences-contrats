import { Component, OnInit } from '@angular/core';
import { F5Service } from 'app/Services/f5.service';
import { F5 } from 'app/Model/F5';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-f5',
  templateUrl: './expired-f5.component.html',
  styleUrls: ['./expired-f5.component.scss']
})
export class ExpiredF5Component implements OnInit {
  expiredF5s: F5[] = [];
  filteredExpiredF5s: F5[] = [];
  pagedExpiredF5s: F5[] = [];
  searchTerm: string = '';
  selectedF5: F5 | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private f5Service: F5Service) {}

  ngOnInit(): void {
    this.loadApprovedF5s();
  }

  // Load approved F5 licenses
  loadApprovedF5s(): void {
    this.f5Service.getAllF5s().subscribe(
      (data: F5[]) => {
        console.log('All F5s from API:', data);

        // Filter only the approved F5s
        this.expiredF5s = data.filter(f5 => 
          f5.approuve === true 
        );
        
        this.filteredExpiredF5s = [...this.expiredF5s];
        this.updatePagination();

        console.log('Filtered approved F5s:', this.expiredF5s);
      },
      (error) => {
        console.error('Error loading F5s', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredF5s = [...this.expiredF5s];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredF5s = this.expiredF5s.filter(f5 =>
        (f5.client && f5.client.toLowerCase().includes(searchLower)) ||
        (f5.nomDuContact && f5.nomDuContact.toLowerCase().includes(searchLower)) ||
        (f5.adresseEmailContact && f5.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (f5.mailAdmin && f5.mailAdmin.toLowerCase().includes(searchLower)) ||
        (f5.remarque && f5.remarque.toLowerCase().includes(searchLower)) ||
        (f5.ccMail && f5.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (f5.licences && f5.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredF5s.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedF5s();
  }

  updatePagedF5s() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredF5s = this.filteredExpiredF5s.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedF5s();
    }
  }

  // Méthode pour désapprouver
  selectF5(item: F5): void {
    this.selectedF5 = item;
  }

  closeDetail(): void {
    this.selectedF5 = null;
  }

  desapprouve(id: number): void {
    this.f5Service.activate(id).subscribe(() => {
      if (this.selectedF5?.f5Id === id) {
        this.selectedF5 = null;
      }
      // Après désapprobation, retirer le F5 de la liste approuvée locale
      this.expiredF5s = this.expiredF5s.filter(f5 => f5.f5Id !== id);
      this.filteredExpiredF5s = this.filteredExpiredF5s.filter(f5 => f5.f5Id !== id);
      this.updatePagination();
      console.log('F5 désapprouvé avec succès');
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
    return this.f5Service.getFileDownloadUrl(id);
  }
}
