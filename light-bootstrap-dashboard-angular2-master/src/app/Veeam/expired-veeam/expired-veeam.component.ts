import { Component, OnInit } from '@angular/core';
import { VeeamService } from 'app/Services/veeam.service';
import { Veeam } from 'app/Model/Veeam';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-veeam',
  templateUrl: './expired-veeam.component.html',
  styleUrls: ['./expired-veeam.component.scss']
})
export class ExpiredVeeamComponent implements OnInit {
  expiredVeeams: Veeam[] = [];
  filteredExpiredVeeams: Veeam[] = [];
  pagedExpiredVeeams: Veeam[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private veeamService: VeeamService) {}

  ngOnInit(): void {
    this.loadApprovedVeeams();
  }

  // Load approved Veeam licenses
  loadApprovedVeeams(): void {
    this.veeamService.getAllVeeams().subscribe(
      (data: Veeam[]) => {
        console.log('All Veeams from API:', data);

        // Filter only the approved Veeams
        this.expiredVeeams = data.filter(veeam => veeam.approuve === true);
        
        this.filteredExpiredVeeams = [...this.expiredVeeams];
        this.updatePagination();

        console.log('Filtered approved Veeams:', this.expiredVeeams);
      },
      (error) => {
        console.error('Error loading Veeams', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredVeeams = [...this.expiredVeeams];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredVeeams = this.expiredVeeams.filter(veeam =>
        veeam.client?.toLowerCase().includes(searchLower) ||
        veeam.nomDuContact?.toLowerCase().includes(searchLower) ||
        veeam.adresseEmailContact?.toLowerCase().includes(searchLower) ||
        veeam.mailAdmin?.toLowerCase().includes(searchLower) ||
        veeam.remarque?.toLowerCase().includes(searchLower) ||
        (veeam.ccMail && veeam.ccMail.some(email => 
          email.toLowerCase().includes(searchLower)
        )) ||
        (veeam.licences && veeam.licences.some(lic => 
          lic.nomDesLicences?.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredVeeams.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedVeeams();
  }

  updatePagedVeeams() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredVeeams = this.filteredExpiredVeeams.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedVeeams();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.veeamService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Veeam de la liste approuvée locale
      this.expiredVeeams = this.expiredVeeams.filter(veeam => veeam.veeamId !== id);
      this.filteredExpiredVeeams = this.filteredExpiredVeeams.filter(veeam => veeam.veeamId !== id);
      this.updatePagination();
      console.log('Veeam désapprouvé avec succès');
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
    return this.veeamService.getFileDownloadUrlById(id);
  }
}
