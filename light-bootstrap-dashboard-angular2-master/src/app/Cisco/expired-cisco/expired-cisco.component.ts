import { Component, OnInit } from '@angular/core';
import { CiscoService } from 'app/Services/cisco.service';
import { Cisco } from 'app/Model/Cisco';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-cisco',
  templateUrl: './expired-cisco.component.html',
  styleUrls: ['./expired-cisco.component.scss']
})
export class ExpiredCiscoComponent implements OnInit {
  expiredCiscos: Cisco[] = [];
  filteredExpiredCiscos: Cisco[] = [];
  pagedExpiredCiscos: Cisco[] = [];
  searchTerm: string = '';
  selectedCisco: Cisco | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private ciscoService: CiscoService) {}

  ngOnInit(): void {
    this.loadApprovedCiscos();
  }

  // Load approved Cisco licenses
  loadApprovedCiscos(): void {
    this.ciscoService.getAllCiscos().subscribe(
      (data: Cisco[]) => {
        console.log('All Ciscos from API:', data);

        // Filter only the approved Ciscos
        this.expiredCiscos = data.filter(cisco => 
          cisco.approuve === true 
        );
        
        this.filteredExpiredCiscos = [...this.expiredCiscos];
        this.updatePagination();

        console.log('Filtered approved Ciscos:', this.expiredCiscos);
      },
      (error) => {
        console.error('Error loading Ciscos', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredCiscos = [...this.expiredCiscos];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredCiscos = this.expiredCiscos.filter(cisco =>
        (cisco.client && cisco.client.toLowerCase().includes(searchLower)) ||
        (cisco.nomDuContact && cisco.nomDuContact.toLowerCase().includes(searchLower)) ||
        (cisco.adresseEmailContact && cisco.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (cisco.mailAdmin && cisco.mailAdmin.toLowerCase().includes(searchLower)) ||
        (cisco.remarque && cisco.remarque.toLowerCase().includes(searchLower)) ||
        (cisco.ccMail && cisco.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (cisco.licences && cisco.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredCiscos.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedCiscos();
  }

  updatePagedCiscos() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredCiscos = this.filteredExpiredCiscos.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedCiscos();
    }
  }

  // Méthode pour désapprouver
  selectCisco(item: Cisco): void {
    this.selectedCisco = item;
  }

  closeDetail(): void {
    this.selectedCisco = null;
  }

  desapprouve(id: number): void {
    this.ciscoService.activate(id).subscribe(() => {
      if (this.selectedCisco?.ciscoId === id) {
        this.selectedCisco = null;
      }
      // Après désapprobation, retirer le Cisco de la liste approuvée locale
      this.expiredCiscos = this.expiredCiscos.filter(cisco => cisco.ciscoId !== id);
      this.filteredExpiredCiscos = this.filteredExpiredCiscos.filter(cisco => cisco.ciscoId !== id);
      this.updatePagination();
      console.log('Cisco désapprouvé avec succès');
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
    return this.ciscoService.getFileDownloadUrl(id);
  }
}
