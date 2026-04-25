import { Component, OnInit } from '@angular/core';
import { Rapid7Service } from 'app/Services/rapid7.service';
import { Rapid7 } from 'app/Model/Rapid7';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-rapid7',
  templateUrl: './expired-rapid7.component.html',
  styleUrls: ['./expired-rapid7.component.scss']
})
export class ExpiredRapid7Component implements OnInit {
  expiredRapid7s: Rapid7[] = [];
  filteredExpiredRapid7s: Rapid7[] = [];
  pagedExpiredRapid7s: Rapid7[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private rapid7Service: Rapid7Service) {}

  ngOnInit(): void {
    this.loadApprovedRapid7s();
  }

  // Load approved Rapid7 licenses
  loadApprovedRapid7s(): void {
    this.rapid7Service.getAllRapid7s().subscribe(
      (data: Rapid7[]) => {
        console.log('All Rapid7s from API:', data);

        // Filter only the approved Rapid7s
        this.expiredRapid7s = data.filter(rapid7 => 
          rapid7.approuve === true 
        );
        
        this.filteredExpiredRapid7s = [...this.expiredRapid7s];
        this.updatePagination();

        console.log('Filtered approved Rapid7s:', this.expiredRapid7s);
      },
      (error) => {
        console.error('Error loading Rapid7s', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredRapid7s = [...this.expiredRapid7s];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredRapid7s = this.expiredRapid7s.filter(rapid7 =>
        (rapid7.client && rapid7.client.toLowerCase().includes(searchLower)) ||
        (rapid7.cleLicences && rapid7.cleLicences.toLowerCase().includes(searchLower)) ||
        (rapid7.nomDuContact && rapid7.nomDuContact.toLowerCase().includes(searchLower)) ||
        (rapid7.adresseEmailContact && rapid7.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (rapid7.mailAdmin && rapid7.mailAdmin.toLowerCase().includes(searchLower)) ||
        (rapid7.remarque && rapid7.remarque.toLowerCase().includes(searchLower)) ||
        (rapid7.ccMail && rapid7.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (rapid7.licences && rapid7.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredRapid7s.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedRapid7s();
  }

  updatePagedRapid7s() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredRapid7s = this.filteredExpiredRapid7s.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedRapid7s();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.rapid7Service.activate(id).subscribe(() => {
      // Après désapprobation, retirer le Rapid7 de la liste approuvée locale
      this.expiredRapid7s = this.expiredRapid7s.filter(rapid7 => rapid7.rapid7Id !== id);
      this.filteredExpiredRapid7s = this.filteredExpiredRapid7s.filter(rapid7 => rapid7.rapid7Id !== id);
      this.updatePagination();
      console.log('Rapid7 désapprouvé avec succès');
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
    return this.rapid7Service.getFileDownloadUrlById(id);
  }
}
