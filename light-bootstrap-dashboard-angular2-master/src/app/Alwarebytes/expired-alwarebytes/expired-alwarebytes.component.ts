import { Component, OnInit } from '@angular/core';
import { AlwarebytesService } from 'app/Services/alwarebytes.service';
import { Alwarebytes } from 'app/Model/Alwarebytes';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-alwarebytes',
  templateUrl: './expired-alwarebytes.component.html',
  styleUrls: ['./expired-alwarebytes.component.scss']
})
export class ExpiredAlwarebytesComponent implements OnInit {
  expiredAlwarebytess: Alwarebytes[] = [];
  filteredExpiredAlwarebytess: Alwarebytes[] = [];
  pagedExpiredAlwarebytess: Alwarebytes[] = [];
  searchTerm: string = '';

  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private alwarebytesService: AlwarebytesService) { }

  ngOnInit(): void {
    this.loadApprovedAlwarebytess();
  }

  // Load approved Alwarebytes licenses
  loadApprovedAlwarebytess(): void {
    this.alwarebytesService.getAllAlwarebytess().subscribe(
      (data: Alwarebytes[]) => {
        console.log('All Alwarebytess from API:', data);

        // Filter only the approved Alwarebytess
        this.expiredAlwarebytess = data.filter(alwarebytes =>
          alwarebytes.approuve === true
        );

        this.filteredExpiredAlwarebytess = [...this.expiredAlwarebytess];
        this.updatePagination();

        console.log('Filtered approved Alwarebytess:', this.expiredAlwarebytess);
      },
      (error) => {
        console.error('Error loading Alwarebytess', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredAlwarebytess = [...this.expiredAlwarebytess];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredAlwarebytess = this.expiredAlwarebytess.filter(alwarebytes =>
        (alwarebytes.client && alwarebytes.client.toLowerCase().includes(searchLower)) ||
        (alwarebytes.nomDuContact && alwarebytes.nomDuContact.toLowerCase().includes(searchLower)) ||
        (alwarebytes.adresseEmailContact && alwarebytes.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (alwarebytes.mailAdmin && alwarebytes.mailAdmin.toLowerCase().includes(searchLower)) ||
        (alwarebytes.remarque && alwarebytes.remarque.toLowerCase().includes(searchLower)) ||
        (alwarebytes.ccMail && alwarebytes.ccMail.some(email =>
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (alwarebytes.licences && alwarebytes.licences.some(lic =>
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredAlwarebytess.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedAlwarebytess();
  }

  updatePagedAlwarebytess() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredAlwarebytess = this.filteredExpiredAlwarebytess.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedAlwarebytess();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.alwarebytesService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Alwarebytes de la liste approuvée locale
      this.expiredAlwarebytess = this.expiredAlwarebytess.filter(alwarebytes => alwarebytes.alwarebytesId !== id);
      this.filteredExpiredAlwarebytess = this.filteredExpiredAlwarebytess.filter(alwarebytes => alwarebytes.alwarebytesId !== id);
      this.updatePagination();
      console.log('Alwarebytes désapprouvé avec succès');
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
    return this.alwarebytesService.getFileDownloadUrl(id);
  }
}
