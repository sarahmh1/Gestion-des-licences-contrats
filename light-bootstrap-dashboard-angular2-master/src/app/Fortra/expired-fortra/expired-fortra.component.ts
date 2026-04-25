import { Component, OnInit } from '@angular/core';
import { FortraService } from 'app/Services/fortra.service';
import { Fortra } from 'app/Model/Fortra';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-fortra',
  templateUrl: './expired-fortra.component.html',
  styleUrls: ['./expired-fortra.component.scss']
})
export class ExpiredFortraComponent implements OnInit {
  expiredFortras: Fortra[] = [];
  filteredExpiredFortras: Fortra[] = [];
  pagedExpiredFortras: Fortra[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private fortraService: FortraService) {}

  ngOnInit(): void {
    this.loadApprovedFortras();
  }

  // Load approved Fortra licenses
  loadApprovedFortras(): void {
    this.fortraService.getAllFortras().subscribe(
      (data: Fortra[]) => {
        console.log('All Fortras from API:', data);

        // Filter only the approved Fortras
        this.expiredFortras = data.filter(fortra => 
          fortra.approuve === true 
        );
        
        this.filteredExpiredFortras = [...this.expiredFortras];
        this.updatePagination();

        console.log('Filtered approved Fortras:', this.expiredFortras);
      },
      (error) => {
        console.error('Error loading Fortras', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredFortras = [...this.expiredFortras];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredFortras = this.expiredFortras.filter(fortra =>
        (fortra.client && fortra.client.toLowerCase().includes(searchLower)) ||
        (fortra.nomDuContact && fortra.nomDuContact.toLowerCase().includes(searchLower)) ||
        (fortra.adresseEmailContact && fortra.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (fortra.mailAdmin && fortra.mailAdmin.toLowerCase().includes(searchLower)) ||
        (fortra.remarque && fortra.remarque.toLowerCase().includes(searchLower)) ||
        (fortra.ccMail && fortra.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (fortra.licences && fortra.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredFortras.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedFortras();
  }

  updatePagedFortras() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredFortras = this.filteredExpiredFortras.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedFortras();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.fortraService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Fortra de la liste approuvée locale
      this.expiredFortras = this.expiredFortras.filter(fortra => fortra.fortraId !== id);
      this.filteredExpiredFortras = this.filteredExpiredFortras.filter(fortra => fortra.fortraId !== id);
      this.updatePagination();
      console.log('Fortra désapprouvé avec succès');
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
    return this.fortraService.getFileDownloadUrl(id);
  }
}
