import { Component, OnInit } from '@angular/core';
import { ImpervaService } from 'app/Services/imperva.service';
import { Imperva } from 'app/Model/Imperva';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-imperva',
  templateUrl: './expired-imperva.component.html',
  styleUrls: ['./expired-imperva.component.scss']
})
export class ExpiredImpervaComponent implements OnInit {
  expiredImpervas: Imperva[] = [];
  filteredExpiredImpervas: Imperva[] = [];
  pagedExpiredImpervas: Imperva[] = [];
  searchTerm: string = '';
  selectedImperva: Imperva | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private impervaService: ImpervaService) {}

  ngOnInit(): void {
    this.loadApprovedImpervas();
  }

  // Load approved Imperva licenses
  loadApprovedImpervas(): void {
    this.impervaService.getAllImpervas().subscribe(
      (data: Imperva[]) => {
        console.log('All Impervas from API:', data);

        // Filter only the approved Impervas
        this.expiredImpervas = data.filter(imperva => 
          imperva.approuve === true 
        );
        
        this.filteredExpiredImpervas = [...this.expiredImpervas];
        this.updatePagination();

        console.log('Filtered approved Impervas:', this.expiredImpervas);
      },
      (error) => {
        console.error('Error loading Impervas', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredImpervas = [...this.expiredImpervas];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredImpervas = this.expiredImpervas.filter(imperva =>
        (imperva.client && imperva.client.toLowerCase().includes(searchLower)) ||
        (imperva.nomDuContact && imperva.nomDuContact.toLowerCase().includes(searchLower)) ||
        (imperva.adresseEmailContact && imperva.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (imperva.mailAdmin && imperva.mailAdmin.toLowerCase().includes(searchLower)) ||
        (imperva.remarque && imperva.remarque.toLowerCase().includes(searchLower)) ||
        (imperva.ccMail && imperva.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (imperva.licences && imperva.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredImpervas.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedImpervas();
  }

  updatePagedImpervas() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredImpervas = this.filteredExpiredImpervas.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedImpervas();
    }
  }

  // Méthode pour désapprouver
  selectImperva(item: Imperva): void {
    this.selectedImperva = item;
  }

  closeDetail(): void {
    this.selectedImperva = null;
  }

  desapprouve(id: number): void {
    this.impervaService.activate(id).subscribe(() => {
      if (this.selectedImperva?.impervaId === id) {
        this.selectedImperva = null;
      }
      // Après désapprobation, retirer le Imperva de la liste approuvée locale
      this.expiredImpervas = this.expiredImpervas.filter(imperva => imperva.impervaId !== id);
      this.filteredExpiredImpervas = this.filteredExpiredImpervas.filter(imperva => imperva.impervaId !== id);
      this.updatePagination();
      console.log('Imperva désapprouvé avec succès');
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
    return this.impervaService.getFileDownloadUrl(id);
  }
}
