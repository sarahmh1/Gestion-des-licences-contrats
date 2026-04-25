import { Component, OnInit } from '@angular/core';
import { NetskopeService } from 'app/Services/neskope.service';
import { Netskope } from 'app/Model/Netskope';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-netskope',
  templateUrl: './expired-netskope.component.html',
  styleUrls: ['./expired-netskope.component.scss']
})
export class ExpiredNetskopeComponent implements OnInit {
  expiredNetskopes: Netskope[] = [];
  filteredExpiredNetskopes: Netskope[] = [];
  pagedExpiredNetskopes: Netskope[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private netskopeService: NetskopeService) {}

  ngOnInit(): void {
    this.loadApprovedNetskopes();
  }

  // Load approved Netskope licenses
  loadApprovedNetskopes(): void {
    this.netskopeService.getAllNetskopes().subscribe(
      (data: Netskope[]) => {
        console.log('All Netskopes from API:', data);

        // Filter only the approved Netskopes
        this.expiredNetskopes = data.filter(netskope => 
          netskope.approuve === true 
        );
        
        this.filteredExpiredNetskopes = [...this.expiredNetskopes];
        this.updatePagination();

        console.log('Filtered approved Netskopes:', this.expiredNetskopes);
      },
      (error) => {
        console.error('Error loading Netskopes', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredNetskopes = [...this.expiredNetskopes];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredNetskopes = this.expiredNetskopes.filter(netskope =>
        (netskope.client && netskope.client.toLowerCase().includes(searchLower)) ||
        (netskope.nomDuContact && netskope.nomDuContact.toLowerCase().includes(searchLower)) ||
        (netskope.adresseEmailContact && netskope.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (netskope.mailAdmin && netskope.mailAdmin.toLowerCase().includes(searchLower)) ||
        (netskope.remarque && netskope.remarque.toLowerCase().includes(searchLower)) ||
        (netskope.ccMail && netskope.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (netskope.licences && netskope.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredNetskopes.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedNetskopes();
  }

  updatePagedNetskopes() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredNetskopes = this.filteredExpiredNetskopes.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedNetskopes();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.netskopeService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Netskope de la liste approuvée locale
      this.expiredNetskopes = this.expiredNetskopes.filter(netskope => netskope.netskopeId !== id);
      this.filteredExpiredNetskopes = this.filteredExpiredNetskopes.filter(netskope => netskope.netskopeId !== id);
      this.updatePagination();
      console.log('Netskope désapprouvé avec succès');
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
    return this.netskopeService.getFileDownloadUrl(id);
  }
}
