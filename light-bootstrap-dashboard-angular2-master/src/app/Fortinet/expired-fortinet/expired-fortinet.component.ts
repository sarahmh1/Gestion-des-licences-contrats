import { Component, OnInit } from '@angular/core';
import { FortinetService } from 'app/Services/fortinet.service';
import { Fortinet } from 'app/Model/Fortinet';

@Component({
  selector: 'app-expired-fortinet',
  templateUrl: './expired-fortinet.component.html',
  styleUrls: ['./expired-fortinet.component.scss']
})
export class ExpiredFortinetComponent implements OnInit {
  expiredFortinets: Fortinet[] = [];
  filteredExpiredFortinets: Fortinet[] = [];
  pagedExpiredFortinets: Fortinet[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private fortinetService: FortinetService) {}

  ngOnInit(): void {
    this.loadApprovedFortinets();
  }

  // Load approved Fortinet licenses (without checking expiration date)
  loadApprovedFortinets(): void {
    this.fortinetService.getAllFortinets().subscribe(
      (data: Fortinet[]) => {
        console.log('All Fortinets from API:', data);

        // Filter only the approved Fortinets (ignore expiration date)
        this.expiredFortinets = data.filter(fortinet => fortinet.approuve === true);
        
        this.filteredExpiredFortinets = [...this.expiredFortinets];
        this.updatePagination();

        console.log('Filtered approved Fortinets:', this.expiredFortinets);
      },
      (error) => {
        console.error('Error loading Fortinets', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredFortinets = [...this.expiredFortinets];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredFortinets = this.expiredFortinets.filter(fortinet =>
        fortinet.client?.toLowerCase().includes(searchLower) ||
        fortinet.nomDuBoitier?.toLowerCase().includes(searchLower) ||
        fortinet.numeroSerie?.toLowerCase().includes(searchLower) ||
        fortinet.nomDuContact?.toLowerCase().includes(searchLower) ||
        fortinet.adresseEmailContact?.toLowerCase().includes(searchLower) ||
        fortinet.mailAdmin?.toLowerCase().includes(searchLower) ||
        (fortinet.licences && fortinet.licences.some(lic => 
          lic.nomDesLicences?.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredFortinets.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedFortinets();
  }

  updatePagedFortinets() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredFortinets = this.filteredExpiredFortinets.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedFortinets();
    }
  }

  // MÊME MÉTHODE QUE ESET - utilisation de activate() pour désapprouver
  desapprouve(id: number): void {
    this.fortinetService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Fortinet de la liste approuvée locale
      this.expiredFortinets = this.expiredFortinets.filter(fortinet => fortinet.fortinetId !== id);
      this.filteredExpiredFortinets = this.filteredExpiredFortinets.filter(fortinet => fortinet.fortinetId !== id);
      this.updatePagination();
      console.log('Fortinet désapprouvé avec succès');
    });
  }

  getCommandePasserParLabel(value: any): string {
    return String(value);
  }

  getFileDownloadUrl(id: number): string {
    return this.fortinetService.getFileDownloadUrlById(id);
  }
}
