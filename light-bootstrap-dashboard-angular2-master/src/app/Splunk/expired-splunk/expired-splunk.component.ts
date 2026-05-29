import { Component, OnInit } from '@angular/core';
import { SplunkService } from 'app/Services/splunk.service';
import { Splunk } from 'app/Model/Splunk';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-splunk',
  templateUrl: './expired-splunk.component.html',
  styleUrls: ['./expired-splunk.component.scss']
})
export class ExpiredSplunkComponent implements OnInit {
  expiredSplunks: Splunk[] = [];
  filteredExpiredSplunks: Splunk[] = [];
  pagedExpiredSplunks: Splunk[] = [];
  searchTerm: string = '';
  selectedSplunk: Splunk | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private splunkService: SplunkService) {}

  ngOnInit(): void {
    this.loadApprovedSplunks();
  }

  // Load approved Splunk licenses
  loadApprovedSplunks(): void {
    this.splunkService.getAllSplunks().subscribe(
      (data: Splunk[]) => {
        console.log('All Splunks from API:', data);

        // Filter only the approved Splunks
        this.expiredSplunks = data.filter(splunk => 
          splunk.approuve === true 
        );
        
        this.filteredExpiredSplunks = [...this.expiredSplunks];
        this.updatePagination();

        console.log('Filtered approved Splunks:', this.expiredSplunks);
      },
      (error) => {
        console.error('Error loading Splunks', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredSplunks = [...this.expiredSplunks];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredSplunks = this.expiredSplunks.filter(splunk =>
        (splunk.client && splunk.client.toLowerCase().includes(searchLower)) ||
        (splunk.nomDuContact && splunk.nomDuContact.toLowerCase().includes(searchLower)) ||
        (splunk.adresseEmailContact && splunk.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (splunk.mailAdmin && splunk.mailAdmin.toLowerCase().includes(searchLower)) ||
        (splunk.remarques && splunk.remarques.toLowerCase().includes(searchLower)) ||
        (splunk.ccMail && splunk.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (splunk.licences && splunk.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredSplunks.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedSplunks();
  }

  updatePagedSplunks() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredSplunks = this.filteredExpiredSplunks.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedSplunks();
    }
  }

  // Méthode pour désapprouver
  selectSplunk(item: Splunk): void {
    this.selectedSplunk = item;
  }

  closeDetail(): void {
    this.selectedSplunk = null;
  }

  desapprouve(id: number): void {
    this.splunkService.activate(id).subscribe(() => {
      if (this.selectedSplunk?.splunkid === id) {
        this.selectedSplunk = null;
      }
      // Après désapprobation, retirer le Splunk de la liste approuvée locale
      this.expiredSplunks = this.expiredSplunks.filter(splunk => splunk.splunkid !== id);
      this.filteredExpiredSplunks = this.filteredExpiredSplunks.filter(splunk => splunk.splunkid !== id);
      this.updatePagination();
      console.log('Splunk désapprouvé avec succès');
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
    return this.splunkService.getFileDownloadUrl(id);
  }
}
