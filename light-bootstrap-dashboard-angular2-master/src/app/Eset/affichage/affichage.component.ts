import { Component, OnInit } from '@angular/core';
import { EsetService } from 'app/Services/eset.service';
import { Eset } from 'app/Model/Eset';
import { Router } from '@angular/router';
import { ViewChild } from '@angular/core';
import { ProductsComponent } from 'app/products/products.component';
import { ProduitService } from 'app/Services/produit.service';
import { PermissionService } from 'app/Services/permission.service';

@Component({
  selector: 'app-affichage',
  templateUrl: './affichage.component.html',
  styleUrls: ['./affichage.component.scss']
})
export class AffichageComponent implements OnInit {
  searchTerm: string = '';
  esets: Eset[] = [];
  unapprovedEsets: Eset[] = [];
  filteredEsets: Eset[] = [];
  selectedEset: Eset | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedEsets: Eset[] = [];

  // Modal pour afficher le formulaire d'ajout
  showAddModal: boolean = false;
  showUpdateModal: boolean = false;
  showAddProductsModal: boolean = false;
  selectedEsetToUpdate: Eset | null = null;
  currentUserRole: string | null = null;
  showSuccessModal: boolean = false;
  successMessage: string = '';
  successTitle: string = '';

  productNameMapping = {
    'eset_protect_entry': 'ESET PROTECT Entry',
    'eset_protect_entry_on_prem': 'ESET PROTECT Entry On-Prem',
    'eset_protect_advanced': 'ESET PROTECT Advanced',
    'eset_protect_advanced_on_prem': 'ESET PROTECT Advanced On-Prem',
    'eset_protect_essential': 'ESET PROTECT Essential',
    'eset_protect_essential_on_prem': 'ESET PROTECT Essential On-Prem',
    'eset_protect_essential_plus_on': 'ESET PROTECT Essential Plus On-Prem',
    'eset_protect_enterprise_on_prem': 'ESET PROTECT Enterprise On-Prem',




    'eset_home_security_essential' :'Eset Home Security Essential' ,
    'eset_protect_enterprise' : 'Eset Protect Enterprise',
    'eset_endpoint_encryption' : 'Eset Endpoint Encryption',
    'eset_endpoint_encryption_pro': 'Eset Endpoint Encryption Pro',
    'eset_mail_security': 'Eset Mail Security',
    'eset_smart_security_premium': 'Eset Smart Security Premium',
    'eset_secure_authentification': 'Eset Secure Authentification',
    'eset_internet_security': 'Eset Internet Security',
    'eset_server_security': 'Eset Server Security',
    'eset_protect_mail_plus': 'Eset Protect Mail Plus',
    'eset_protect_complete': 'Eset Protect Complete'
  };

  TypeAchatNameMapping = {
    'RENOUVELLEMENT': 'Renouvellemnt',
    'upgrade': 'Upgrade',
    'nouvel_licence': 'Nouvel Licence',
    'businessTrial': 'Business Trial',
    'Augmentation': 'Augmentation',
    'DownGrade': 'Down Grade',
    'licence_gratuit': 'Licence Gratuit',
  };

  @ViewChild(ProductsComponent) productsComponent!: ProductsComponent;

  // Variable pour ajouter un produit
  newProductName: string = '';
  newProductError: string = '';

  constructor(private esetService: EsetService, 
              private router: Router,
              private produitService: ProduitService,
              public permissionService: PermissionService) { }

  ngOnInit(): void {
    this.getAllEsets();
    // Récupérer le rôle de l'utilisateur depuis localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserRole = user.role || user.userRole;
      } catch (e) {
        console.error('Erreur parsing user:', e);
      }
    }
  }

  isAdmin(): boolean {
    return this.currentUserRole === 'admin' || this.currentUserRole === 'Admin' || this.currentUserRole === 'Administrateur' || this.currentUserRole === 'ROLE_ADMINISTRATEUR';
  }

  onModalBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Ne pas fermer les dropdowns si le clic provient d'un élément interactif
    if (target?.closest('input, button, select, .scs-dropdown, .product-dropdown-content')) {
      return;
    }
    
    // Vérifier si c'est un clic en dehors des éléments de formulaire
    const isFormControl = target?.closest('.form-control, .form-group input');
    if (isFormControl) return;
    
    // Sinon, fermer les dropdowns quand on clique en dehors
    if (this.productsComponent) {
      this.productsComponent.showProductDropdown = false;
      if (this.productsComponent.clientSelect) {
        this.productsComponent.clientSelect.closeDropdown();
      }
    }
  }

  onSearch() {
    this.filteredEsets = this.filterEsets();
    this.calculatePagination();
    this.changePage(0);
  }

  // Charger tous les ESETs mais filtrer seulement les non approuvés pour l'affichage
  getAllEsets(): void {
    this.esetService.getAllEsets().subscribe(
      (data: Eset[]) => {
        this.esets = data;
        // Filtrer seulement les ESETs non approuvés
        this.unapprovedEsets = data.filter(eset => !eset.approuve);
        this.filteredEsets = [...this.unapprovedEsets]; // Copie pour le filtrage
        this.calculatePagination();
        this.changePage(0);
        console.log('ESETs non approuvés chargés avec succès', this.unapprovedEsets);
      },
      (error) => {
        console.error('Error fetching ESETs', error);
      }
    );
  }

  filterEsets(): Eset[] {
    const term = this.searchTerm.toLowerCase();
    return this.unapprovedEsets.filter((eset) => {
      return (
        (eset.cle_de_Licence && eset.cle_de_Licence.toString().toLowerCase().includes(term)) ||
        (eset.client && eset.client.toLowerCase().includes(term)) ||
        (eset.dureeDeLicence && eset.dureeDeLicence.toLowerCase().includes(term)) ||
        (eset.identifiant && eset.identifiant.toString().toLowerCase().includes(term)) ||
        (eset.mailAdmin && eset.mailAdmin.toLowerCase().includes(term)) ||
        (eset.nmb_tlf && eset.nmb_tlf.toString().toLowerCase().includes(term)) ||
        (eset.nom_contact && eset.nom_contact.toLowerCase().includes(term)) ||
        (eset.nom_produit && eset.nom_produit.toLowerCase().includes(term)) ||
        (eset.typeAchat && eset.typeAchat.toLowerCase().includes(term)) ||
        (eset.nombre && eset.nombre.toString().toLowerCase().includes(term))
      );
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredEsets.length / this.pageSize);
  }

  changePage(pageIndex: number) {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedEsets = this.filteredEsets.slice(start, end);
  }

  // Méthode d'approbation - retire l'ESET approuvé de la liste
  aprouve(id: number) {
    this.esetService.activate(id).subscribe(() => {
      // Retirer l'ESET approuvé de la liste des non approuvés
      this.unapprovedEsets = this.unapprovedEsets.filter(eset => eset.esetid !== id);
      this.filteredEsets = this.filteredEsets.filter(eset => eset.esetid !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuvé et retiré de la liste');
    });
  }

  updateEset(eset: Eset): void {
    // Afficher le modal d'édition au lieu de naviguer
    this.selectedEsetToUpdate = eset;
    this.showUpdateModal = true;
  }

  selectEset(eset: Eset): void {
    this.selectedEset = this.selectedEset?.esetid === eset.esetid ? null : eset;
  }

  closeDetail(): void {
    this.selectedEset = null;
  }

  deleteEset(id: number | undefined | null): void {
    if (id != null && confirm("Are you sure you want to delete this ESET?")) {
      this.esetService.deleteEset(id).subscribe(
        () => {
          // Retirer l'ESET supprimé de la liste
          this.unapprovedEsets = this.unapprovedEsets.filter(eset => eset.esetid !== id);
          this.filteredEsets = this.filteredEsets.filter(eset => eset.esetid !== id);
          this.calculatePagination();
          this.changePage(this.currentPage);
          window.alert('Eset deleted successfully');
        },
        (error) => {
          console.error('Error deleting ESET', error);
          window.alert('Failed to delete ESET');
        }
      );
    }
  }

  getProductName(nom_produit: string): string {
    return this.productNameMapping[nom_produit] || nom_produit;
  }

  getTypeAchatName(TypeAchat: string): string {
    return this.TypeAchatNameMapping[TypeAchat] || TypeAchat;
  }

  goToProducts() {
    this.showAddModal = true;
  }

  openAddEsetModal(): void {
    this.showAddModal = true;
  }

  openAddProductModal(): void {
    this.showAddProductsModal = true;
    this.newProductName = '';
    this.newProductError = '';
  }

  closeAddProductModal(): void {
    this.showAddProductsModal = false;
    this.newProductName = '';
    this.newProductError = '';
  }

  /** Règle métier : le libellé doit commencer par « ESET » (casse ignorée). */
  productNameStartsWithEset(name: string): boolean {
    const t = (name || '').trim();
    if (!t) {
      return false;
    }
    return t.toLowerCase().startsWith('eset');
  }

  newProductNameValidForSubmit(): boolean {
    const t = (this.newProductName || '').trim();
    return t.length >= 3 && this.productNameStartsWithEset(t);
  }

  onNewProductNameInput(): void {
    this.newProductError = '';
  }

  submitNewProduct(): void {
    const t = (this.newProductName || '').trim();
    this.newProductError = '';

    if (!t) {
      this.newProductError = 'Le nom du produit est obligatoire';
      return;
    }
    if (!this.productNameStartsWithEset(t)) {
      this.newProductError = 'Le nom du produit doit commencer par ESET (ex. ESET PROTECT Entry).';
      return;
    }
    if (t.length < 3) {
      this.newProductError = 'Le nom du produit doit contenir au moins 3 caractères';
      return;
    }

    const newProduct = {
      code: t.toLowerCase().replace(/\s+/g, '_'),
      label: t
    };

    this.produitService.addProduit(newProduct).subscribe(
      (result) => {
        console.log('Produit ajouté avec succès', result);
        this.newProductError = '';
        this.newProductName = '';
        this.closeAddProductModal();
      },
      (error) => {
        console.error('Erreur lors de l\'ajout du produit', error);
        const status = error?.status;
        const msg = (error?.error?.message || error?.message || '') as string;
        if (
          status === 409 ||
          /existe déjà|déjà existant|deja exist|already exists|conflict/i.test(msg)
        ) {
          this.newProductError = 'Produit déjà existant';
        } else if (msg && typeof msg === 'string') {
          this.newProductError = msg;
        } else {
          this.newProductError = 'Erreur lors de l\'ajout du produit';
        }
      }
    );
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onProductAdded(): void {
    // Fermer le modal d'ajout
    this.showAddModal = false;
    
    // Recharger la liste après un court délai pour que le backend traite
    setTimeout(() => {
      this.getAllEsets();
    }, 300);
    
    // Naviguer vers la page d'affichage si on n'y est pas déjà
    this.router.navigate(['/affichage']);
  }

  onProductCancelled(): void {
    // Fermer le modal d'ajout sans recharger
    this.showAddModal = false;
  }

  onEsetUpdated(): void {
    // Fermer le modal d'édition
    this.showUpdateModal = false;
    this.selectedEsetToUpdate = null;
    
    // Recharger la liste après un court délai
    setTimeout(() => {
      this.getAllEsets();
    }, 300);
  }

  onUpdateCancelled(): void {
    // Fermer le modal d'édition sans action
    this.showUpdateModal = false;
    this.selectedEsetToUpdate = null;
  }
  
  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  getCommandePasserParLabel(value: any): string {
    switch (value) {
      case 'GI_TN': return 'GI_TN';
      case 'GI_FR': return 'GI_FR';
      case 'GI_CI': return 'GI_CI';
      default: return value;
    }
  }

  getFileDownloadUrl(filename: string): string {
    return this.esetService.getFileDownloadUrl(filename);
  }

  getFileDownloadUrlById(esetId: number): string {
    return this.esetService.getFileDownloadUrlById(esetId);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
