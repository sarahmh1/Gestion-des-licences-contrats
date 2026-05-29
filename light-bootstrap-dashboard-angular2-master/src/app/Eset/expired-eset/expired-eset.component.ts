import { Component, OnInit } from '@angular/core';
import { EsetService } from 'app/Services/eset.service';
import { Eset } from 'app/Model/Eset';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';

@Component({
  selector: 'app-expired-eset',
  templateUrl: './expired-eset.component.html',
  styleUrls: ['./expired-eset.component.scss']
})
export class ExpiredEsetComponent implements OnInit {
  expiredProducts: Eset[] = [];
  filteredExpiredProducts: Eset[] = [];
  pagedExpiredProducts: Eset[] = [];
  allEsets: Eset[] = []; // Ajouté pour le HTML
  searchTerm: string = '';
  selectedEset: Eset | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private esetService: EsetService) {}

  ngOnInit(): void {
    this.loadExpiredProducts();
  }

  // Load approved ESET products without considering expiration date
  loadExpiredProducts(): void {
    this.esetService.getAllEsets().subscribe(
      (data: Eset[]) => {
        console.log('All products from API:', data);
        this.allEsets = data; // Stocker tous les ESETs

        // Filter only the approved products (ignore the expiration date)
        this.expiredProducts = data.filter(eset => 
          eset.approuve === true 
        );
        
        this.filteredExpiredProducts = [...this.expiredProducts];
        this.updatePagination();

        // Log the filtered approved products
        console.log('Filtered approved products:', this.expiredProducts);
      },
      (error) => {
        console.error('Error loading products', error);
      }
    );
  }

  // Méthode de recherche
  onSearch() {
    if (!this.searchTerm) {
      this.filteredExpiredProducts = [...this.expiredProducts];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredExpiredProducts = this.expiredProducts.filter(eset =>
        (eset.client && eset.client.toLowerCase().includes(searchLower)) ||
        (eset.identifiant && eset.identifiant.toLowerCase().includes(searchLower)) ||
        (eset.cle_de_Licence && eset.cle_de_Licence.toLowerCase().includes(searchLower)) ||
        (eset.nom_produit && this.getProductName(eset.nom_produit).toLowerCase().includes(searchLower)) ||
        (eset.nom_contact && eset.nom_contact.toLowerCase().includes(searchLower)) ||
        (eset.mail && eset.mail.toLowerCase().includes(searchLower)) ||
        (eset.mailAdmin && eset.mailAdmin.toLowerCase().includes(searchLower)) ||
        (eset.typeAchat && this.getTypeAchatName(eset.typeAchat).toLowerCase().includes(searchLower)) ||
        (eset.remarque && eset.remarque.toLowerCase().includes(searchLower)) ||
        (eset.ccMail && eset.ccMail.some(email => 
          email && email.toLowerCase().includes(searchLower)
        ))
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  // Méthodes pour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExpiredProducts.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedProducts();
  }

  updatePagedProducts() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedExpiredProducts = this.filteredExpiredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedProducts();
    }
  }

  // Méthode pour désapprouver
  selectEset(item: Eset): void {
    this.selectedEset = item;
  }

  closeDetail(): void {
    this.selectedEset = null;
  }

  desapprouve(id: number): void {
    this.esetService.activate(id).subscribe(() => {
      if (this.selectedEset?.esetid === id) {
        this.selectedEset = null;
      }
      // Après désapprobation, retirer le produit de la liste approuvée locale
      this.expiredProducts = this.expiredProducts.filter(eset => eset.esetid !== id);
      this.filteredExpiredProducts = this.filteredExpiredProducts.filter(eset => eset.esetid !== id);
      this.updatePagination();
      console.log('Produit désapprouvé avec succès');
    });
  }

  // Méthodes d'affichage pour le HTML
  getProductName(productValue: any): string {
    if (!productValue) return 'N/A';
    if (typeof productValue === 'string') return productValue;
    if (typeof productValue === 'object' && productValue.value) return productValue.value;
    if (typeof productValue === 'object' && productValue.libelle) return productValue.libelle;
    return String(productValue);
  }

  getTypeAchatName(typeAchatValue: any): string {
    if (!typeAchatValue) return 'N/A';
    if (typeof typeAchatValue === 'string') return typeAchatValue;
    if (typeof typeAchatValue === 'object' && typeAchatValue.value) return typeAchatValue.value;
    if (typeof typeAchatValue === 'object' && typeAchatValue.libelle) return typeAchatValue.libelle;
    return String(typeAchatValue);
  }

  getCommandePasserParLabel(value: any): string {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.value) return value.value;
    if (typeof value === 'object' && value.libelle) return value.libelle;
    return String(value);
  }

  getFileDownloadUrl(id: number): string {
    return this.esetService.getFileDownloadUrlById(id);
  }
}
