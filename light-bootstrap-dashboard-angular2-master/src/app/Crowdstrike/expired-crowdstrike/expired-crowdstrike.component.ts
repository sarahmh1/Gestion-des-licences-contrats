import { Component, OnInit } from '@angular/core';
import { CrowdstrikeService } from 'app/Services/crowdstrike.service';
import { Crowdstrike } from 'app/Model/Crowdstrike';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-crowdstrike',
  templateUrl: './expired-crowdstrike.component.html',
  styleUrls: ['./expired-crowdstrike.component.scss']
})
export class ExpiredCrowdstrikeComponent implements OnInit {
  expiredCrowdstrikes: Crowdstrike[] = [];
  filteredExpiredCrowdstrikes: Crowdstrike[] = [];
  pagedExpiredCrowdstrikes: Crowdstrike[] = [];
  searchTerm: string = '';
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private crowdstrikeService: CrowdstrikeService) {}

  ngOnInit(): void {
    this.loadApprovedCrowdstrikes();
  }

  // Load approved CrowdStrike licenses
  loadApprovedCrowdstrikes(): void {
    this.crowdstrikeService.getAllCrowdstrikes().subscribe(
      (data: Crowdstrike[]) => {
        console.log('All CrowdStrikes from API:', data);

        // Filter only the approved CrowdStrikes
        this.expiredCrowdstrikes = data.filter(crowdstrike => 
          crowdstrike.approuve === true 
        );
        
        this.filteredExpiredCrowdstrikes = [...this.expiredCrowdstrikes];
        this.updatePagination();

        console.log('Filtered approved CrowdStrikes:', this.expiredCrowdstrikes);
      },
      (error) => {
        console.error('Error loading CrowdStrikes', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredCrowdstrikes = [...this.expiredCrowdstrikes];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredCrowdstrikes = this.expiredCrowdstrikes.filter(crowdstrike =>
        (crowdstrike.client && crowdstrike.client.toLowerCase().includes(searchLower)) ||
        (crowdstrike.nomDuContact && crowdstrike.nomDuContact.toLowerCase().includes(searchLower)) ||
        (crowdstrike.adresseEmailContact && crowdstrike.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (crowdstrike.mailAdmin && crowdstrike.mailAdmin.toLowerCase().includes(searchLower)) ||
        (crowdstrike.remarques && crowdstrike.remarques.toLowerCase().includes(searchLower)) ||
        (crowdstrike.ccMail && crowdstrike.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (crowdstrike.licences && crowdstrike.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredCrowdstrikes.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedCrowdstrikes();
  }

  updatePagedCrowdstrikes() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredCrowdstrikes = this.filteredExpiredCrowdstrikes.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedCrowdstrikes();
    }
  }

  // Méthode pour désapprouver
  desapprouve(id: number): void {
    this.crowdstrikeService.activate(id).subscribe(() => {
      // Après désapprobation, retirer le CrowdStrike de la liste approuvée locale
      this.expiredCrowdstrikes = this.expiredCrowdstrikes.filter(crowdstrike => crowdstrike.crowdstrikeid !== id);
      this.filteredExpiredCrowdstrikes = this.filteredExpiredCrowdstrikes.filter(crowdstrike => crowdstrike.crowdstrikeid !== id);
      this.updatePagination();
      console.log('CrowdStrike désapprouvé avec succès');
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
    return this.crowdstrikeService.getFileDownloadUrlById(id);
  }
}
