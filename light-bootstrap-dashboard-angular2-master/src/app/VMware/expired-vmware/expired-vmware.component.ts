import { Component, OnInit } from '@angular/core';
import { VMwareService } from 'app/Services/vmware.service';
import { VMware } from 'app/Model/VMware';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-vmware',
  templateUrl: './expired-vmware.component.html',
  styleUrls: ['./expired-vmware.component.scss']
})
export class ExpiredVMwareComponent implements OnInit {
  expiredVMwares: VMware[] = [];
  filteredExpiredVMwares: VMware[] = [];
  pagedExpiredVMwares: VMware[] = [];
  searchTerm: string = '';
  selectedVMware: VMware | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private vmwareService: VMwareService) {}

  ngOnInit(): void {
    this.loadApprovedVMwares();
  }

  // Load approved VMware licenses
  loadApprovedVMwares(): void {
    this.vmwareService.getAllVMwares().subscribe(
      (data: VMware[]) => {
        console.log('All VMwares from API:', data);

        // Filter only the approved VMwares
        this.expiredVMwares = data.filter(vmware => 
          vmware.approuve === true 
        );
        
        this.filteredExpiredVMwares = [...this.expiredVMwares];
        this.updatePagination();

        console.log('Filtered approved VMwares:', this.expiredVMwares);
      },
      (error) => {
        console.error('Error loading VMwares', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredVMwares = [...this.expiredVMwares];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredVMwares = this.expiredVMwares.filter(vmware =>
        (vmware.client && vmware.client.toLowerCase().includes(searchLower)) ||
        (vmware.nomDuContact && vmware.nomDuContact.toLowerCase().includes(searchLower)) ||
        (vmware.adresseEmailContact && vmware.adresseEmailContact.toLowerCase().includes(searchLower)) ||
        (vmware.mailAdmin && vmware.mailAdmin.toLowerCase().includes(searchLower)) ||
        (vmware.remarque && vmware.remarque.toLowerCase().includes(searchLower)) ||
        (vmware.ccMail && vmware.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        )) ||
        (vmware.licences && vmware.licences.some(lic => 
          lic.nomDesLicences && lic.nomDesLicences.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredVMwares.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedVMwares();
  }

  updatePagedVMwares() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredVMwares = this.filteredExpiredVMwares.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedVMwares();
    }
  }

  // Méthode pour désapprouver
  selectVMware(item: VMware): void {
    this.selectedVMware = item;
  }

  closeDetail(): void {
    this.selectedVMware = null;
  }

  desapprouve(id: number): void {
    this.vmwareService.activate(id).subscribe(() => {
      if (this.selectedVMware?.vmwareId === id) {
        this.selectedVMware = null;
      }
      // Après désapprobation, retirer le VMware de la liste approuvée locale
      this.expiredVMwares = this.expiredVMwares.filter(vmware => vmware.vmwareId !== id);
      this.filteredExpiredVMwares = this.filteredExpiredVMwares.filter(vmware => vmware.vmwareId !== id);
      this.updatePagination();
      console.log('VMware désapprouvé avec succès');
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
    return this.vmwareService.getFileDownloadUrl(id);
  }
}
