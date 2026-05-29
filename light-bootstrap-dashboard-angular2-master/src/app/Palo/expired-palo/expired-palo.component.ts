import { Component, OnInit } from '@angular/core';
import { PaloService } from 'app/Services/palo.service';
import { Palo } from 'app/Model/Palo';

@Component({
  selector: 'app-expired-palo',
  templateUrl: './expired-palo.component.html',
  styleUrls: ['./expired-palo.component.scss']
})
export class ExpiredPaloComponent implements OnInit {
  expiredPalos: Palo[] = [];
  filteredExpiredPalos: Palo[] = [];
  pagedExpiredPalos: Palo[] = [];
  searchTerm: string = '';
  selectedPalo: Palo | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private paloService: PaloService) {}

  ngOnInit(): void {
    this.loadApprovedPalos();
  }

  // Load approved Palo licenses
  loadApprovedPalos(): void {
    this.paloService.getAllPalos().subscribe(
      (data: Palo[]) => {
        console.log('All Palos from API:', data);

        // Filter only the approved Palos
        this.expiredPalos = data.filter(palo => palo.approuve === true);
        
        this.filteredExpiredPalos = [...this.expiredPalos];
        this.updatePagination();

        console.log('Filtered approved Palos:', this.expiredPalos);
      },
      (error) => {
        console.error('Error loading Palos', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredPalos = [...this.expiredPalos];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredPalos = this.expiredPalos.filter(palo =>
        palo.client?.toLowerCase().includes(searchLower) ||
        palo.nomDuBoitier?.toLowerCase().includes(searchLower) ||
        palo.numeroSerieBoitier?.toLowerCase().includes(searchLower) ||
        palo.nomDuContact?.toLowerCase().includes(searchLower) ||
        palo.adresseEmailContact?.toLowerCase().includes(searchLower) ||
        palo.mailAdmin?.toLowerCase().includes(searchLower) ||
        (palo.licences && palo.licences.some(lic => 
          lic.nomDesLicences?.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredPalos.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedPalos();
  }

  updatePagedPalos() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredPalos = this.filteredExpiredPalos.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedPalos();
    }
  }

  // Méthode pour désapprouver
  selectPalo(item: Palo): void {
    this.selectedPalo = item;
  }

  closeDetail(): void {
    this.selectedPalo = null;
  }

  desapprouve(id: number): void {
    this.paloService.activate(id).subscribe(() => {
      if (this.selectedPalo?.paloId === id) {
        this.selectedPalo = null;
      }
      // Après désapprobation, retirer le Palo de la liste approuvée locale
      this.expiredPalos = this.expiredPalos.filter(palo => palo.paloId !== id);
      this.filteredExpiredPalos = this.filteredExpiredPalos.filter(palo => palo.paloId !== id);
      this.updatePagination();
      console.log('Palo désapprouvé avec succès');
    });
  }

  getCommandePasserParLabel(value: any): string {
    return String(value);
  }

  getFileDownloadUrl(id: number): string {
    return this.paloService.getFileDownloadUrlById(id);
  }
}
