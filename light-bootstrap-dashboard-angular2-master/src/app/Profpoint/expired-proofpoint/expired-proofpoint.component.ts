import { Component, OnInit } from '@angular/core';
import { ProofpointService } from 'app/Services/proofpoint.service';
import { Proofpoint } from 'app/Model/Proofpoint';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-proofpoint',
  templateUrl: './expired-proofpoint.component.html',
  styleUrls: ['./expired-proofpoint.component.scss']
})
export class ExpiredProofpointComponent implements OnInit {
  expiredProofpoints: Proofpoint[] = [];
  filteredExpiredProofpoints: Proofpoint[] = [];
  pagedExpiredProofpoints: Proofpoint[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private proofpointService: ProofpointService) {}

  ngOnInit(): void {
    this.loadApprovedProofpoints();
  }

  // Load approved Proofpoint licenses
  loadApprovedProofpoints(): void {
    this.proofpointService.getAllProofpoints().subscribe(
      (data: Proofpoint[]) => {
        console.log('All Proofpoints from API:', data);

        // Filter only the approved Proofpoints
        this.expiredProofpoints = data.filter(proofpoint => 
          proofpoint.approuve === true 
        );
        
        this.filteredExpiredProofpoints = [...this.expiredProofpoints];
        this.updatePagination();

        console.log('Filtered approved Proofpoints:', this.expiredProofpoints);
      },
      (error) => {
        console.error('Error loading Proofpoints', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredProofpoints = [...this.expiredProofpoints];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredProofpoints = this.expiredProofpoints.filter(proofpoint =>
        (proofpoint.client && proofpoint.client.toLowerCase().includes(searchLower)) ||
        (proofpoint.nomDuContact && proofpoint.nomDuContact.toLowerCase().includes(searchLower)) ||
        (proofpoint.adresseEmailContact && proofpoint.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (proofpoint.mailAdmin && proofpoint.mailAdmin.toLowerCase().includes(searchLower)) ||
        (proofpoint.remarque && proofpoint.remarque.toLowerCase().includes(searchLower)) ||
        (proofpoint.ccMail && proofpoint.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (proofpoint.licences && proofpoint.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredProofpoints.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedProofpoints();
  }

  updatePagedProofpoints() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredProofpoints = this.filteredExpiredProofpoints.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedProofpoints();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.proofpointService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Proofpoint de la liste approuvée locale
      this.expiredProofpoints = this.expiredProofpoints.filter(proofpoint => proofpoint.proofpointId !== id);
      this.filteredExpiredProofpoints = this.filteredExpiredProofpoints.filter(proofpoint => proofpoint.proofpointId !== id);
      this.updatePagination();
      console.log('Proofpoint désapprouvé avec succès');
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
    return this.proofpointService.getFileDownloadUrlById(id);
  }
}
