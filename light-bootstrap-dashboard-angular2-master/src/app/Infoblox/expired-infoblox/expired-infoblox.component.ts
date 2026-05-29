import { Component, OnInit } from '@angular/core';
import { InfobloxService } from 'app/Services/infoblox.service';
import { Infoblox } from 'app/Model/Infoblox';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-infoblox',
  templateUrl: './expired-infoblox.component.html',
  styleUrls: ['./expired-infoblox.component.scss']
})
export class ExpiredInfobloxComponent implements OnInit {
  expiredInfobloxs: Infoblox[] = [];
  filteredExpiredInfobloxs: Infoblox[] = [];
  pagedExpiredInfobloxs: Infoblox[] = [];
  searchTerm: string = '';
  selectedInfoblox: Infoblox | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private infobloxService: InfobloxService) {}

  ngOnInit(): void {
    this.loadApprovedInfobloxs();
  }

  // Load approved Infoblox licenses
  loadApprovedInfobloxs(): void {
    this.infobloxService.getAllInfobloxs().subscribe(
      (data: Infoblox[]) => {
        console.log('All Infobloxs from API:', data);

        // Filter only the approved Infobloxs
        this.expiredInfobloxs = data.filter(infoblox => 
          infoblox.approuve === true 
        );
        
        this.filteredExpiredInfobloxs = [...this.expiredInfobloxs];
        this.updatePagination();

        console.log('Filtered approved Infobloxs:', this.expiredInfobloxs);
      },
      (error) => {
        console.error('Error loading Infobloxs', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredInfobloxs = [...this.expiredInfobloxs];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredInfobloxs = this.expiredInfobloxs.filter(infoblox =>
        (infoblox.client && infoblox.client.toLowerCase().includes(searchLower)) ||
        (infoblox.nomDuContact && infoblox.nomDuContact.toLowerCase().includes(searchLower)) ||
        (infoblox.adresseEmailContact && infoblox.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (infoblox.mailAdmin && infoblox.mailAdmin.toLowerCase().includes(searchLower)) ||
        (infoblox.remarque && infoblox.remarque.toLowerCase().includes(searchLower)) ||
        (infoblox.ccMail && infoblox.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (infoblox.licences && infoblox.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredInfobloxs.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedInfobloxs();
  }

  updatePagedInfobloxs() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredInfobloxs = this.filteredExpiredInfobloxs.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedInfobloxs();
    }
  }

  // Méthode pour désapprouver
  selectInfoblox(item: Infoblox): void {
    this.selectedInfoblox = item;
  }

  closeDetail(): void {
    this.selectedInfoblox = null;
  }

  desapprouve(id: number): void {
    this.infobloxService.activate(id).subscribe(() => {
      if (this.selectedInfoblox?.infobloxId === id) {
        this.selectedInfoblox = null;
      }
      // Après désapprobation, retirer le Infoblox de la liste approuvée locale
      this.expiredInfobloxs = this.expiredInfobloxs.filter(infoblox => infoblox.infobloxId !== id);
      this.filteredExpiredInfobloxs = this.filteredExpiredInfobloxs.filter(infoblox => infoblox.infobloxId !== id);
      this.updatePagination();
      console.log('Infoblox désapprouvé avec succès');
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
    return this.infobloxService.getFileDownloadUrl(id);
  }
}
