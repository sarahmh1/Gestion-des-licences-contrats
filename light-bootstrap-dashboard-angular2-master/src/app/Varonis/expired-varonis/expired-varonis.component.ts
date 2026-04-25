import { Component, OnInit } from '@angular/core';
import { VaronisService } from 'app/Services/varonis.service';
import { Varonis } from 'app/Model/Varonis';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-varonis',
  templateUrl: './expired-varonis.component.html',
  styleUrls: ['./expired-varonis.component.scss']
})
export class ExpiredVaronisComponent implements OnInit {
  expiredVaroniss: Varonis[] = [];
  filteredExpiredVaroniss: Varonis[] = [];
  pagedExpiredVaroniss: Varonis[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private varonisService: VaronisService) {}

  ngOnInit(): void {
    this.loadApprovedVaroniss();
  }

  // Load approved Varonis licenses
  loadApprovedVaroniss(): void {
    this.varonisService.getAllVaronis().subscribe(
      (data: Varonis[]) => {
        console.log('All Varoniss from API:', data);

        // Filter only the approved Varoniss
        this.expiredVaroniss = data.filter(varonis => 
          varonis.approuve === true 
        );
        
        this.filteredExpiredVaroniss = [...this.expiredVaroniss];
        this.updatePagination();

        console.log('Filtered approved Varoniss:', this.expiredVaroniss);
      },
      (error) => {
        console.error('Error loading Varoniss', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredVaroniss = [...this.expiredVaroniss];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredVaroniss = this.expiredVaroniss.filter(varonis =>
        (varonis.client && varonis.client.toLowerCase().includes(searchLower)) ||
        (varonis.nomDuContact && varonis.nomDuContact.toLowerCase().includes(searchLower)) ||
        (varonis.adresseEmailContact && varonis.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (varonis.mailAdmin && varonis.mailAdmin.toLowerCase().includes(searchLower)) ||
        (varonis.remarque && varonis.remarque.toLowerCase().includes(searchLower)) ||
        (varonis.ccMail && varonis.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (varonis.licences && varonis.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredVaroniss.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedVaroniss();
  }

  updatePagedVaroniss() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredVaroniss = this.filteredExpiredVaroniss.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedVaroniss();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.varonisService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Varonis de la liste approuvée locale
      this.expiredVaroniss = this.expiredVaroniss.filter(varonis => varonis.varonisId !== id);
      this.filteredExpiredVaroniss = this.filteredExpiredVaroniss.filter(varonis => varonis.varonisId !== id);
      this.updatePagination();
      console.log('Varonis désapprouvé avec succès');
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
    return this.varonisService.getFileDownloadUrl(id);
  }
}
