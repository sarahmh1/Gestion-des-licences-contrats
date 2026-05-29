import { Component, OnInit } from '@angular/core';
import { SecPointService } from 'app/Services/sec-point.service';
import { SecPoint } from 'app/Model/SecPoint';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-secpoint',
  templateUrl: './expired-secpoint.component.html',
  styleUrls: ['./expired-secpoint.component.scss']
})
export class ExpiredSecPointComponent implements OnInit {
  expiredSecPoints: SecPoint[] = [];
  filteredExpiredSecPoints: SecPoint[] = [];
  pagedExpiredSecPoints: SecPoint[] = [];
  searchTerm: string = '';
  selectedSecPoint: SecPoint | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private secPointService: SecPointService) {}

  ngOnInit(): void {
    this.loadApprovedSecPoints();
  }

  // Load approved SecPoint licenses
  loadApprovedSecPoints(): void {
    this.secPointService.getAllSecPoints().subscribe(
      (data: SecPoint[]) => {
        console.log('All SecPoints from API:', data);

        // Filter only the approved SecPoints
        this.expiredSecPoints = data.filter(secPoint => 
          secPoint.approuve === true 
        );
        
        this.filteredExpiredSecPoints = [...this.expiredSecPoints];
        this.updatePagination();

        console.log('Filtered approved SecPoints:', this.expiredSecPoints);
      },
      (error) => {
        console.error('Error loading SecPoints', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredSecPoints = [...this.expiredSecPoints];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredSecPoints = this.expiredSecPoints.filter(secPoint =>
        (secPoint.client && secPoint.client.toLowerCase().includes(searchLower)) ||
        (secPoint.nomDuContact && secPoint.nomDuContact.toLowerCase().includes(searchLower)) ||
        (secPoint.adresseEmailContact && secPoint.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (secPoint.mailAdmin && secPoint.mailAdmin.toLowerCase().includes(searchLower)) ||
        (secPoint.remarque && secPoint.remarque.toLowerCase().includes(searchLower)) ||
        (secPoint.ccMail && secPoint.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (secPoint.licences && secPoint.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredSecPoints.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedSecPoints();
  }

  updatePagedSecPoints() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredSecPoints = this.filteredExpiredSecPoints.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedSecPoints();
    }
  }

  // Méthode pour désapprouver
  selectSecPoint(item: SecPoint): void {
    this.selectedSecPoint = item;
  }

  closeDetail(): void {
    this.selectedSecPoint = null;
  }

  desapprouve(id: number): void {
    this.secPointService.activate(id).subscribe(() => {
      if (this.selectedSecPoint?.secPointId === id) {
        this.selectedSecPoint = null;
      }
      // Après désapprobation, retirer le SecPoint de la liste approuvée locale
      this.expiredSecPoints = this.expiredSecPoints.filter(secPoint => secPoint.secPointId !== id);
      this.filteredExpiredSecPoints = this.filteredExpiredSecPoints.filter(secPoint => secPoint.secPointId !== id);
      this.updatePagination();
      console.log('SecPoint désapprouvé avec succès');
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
    return this.secPointService.getFileDownloadUrl(id);
  }
}
