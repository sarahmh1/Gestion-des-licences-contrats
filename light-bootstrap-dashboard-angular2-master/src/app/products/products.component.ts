import { TypeAchat } from './../Model/TypeAchat';
import { EsetService } from './../Services/eset.service';
import { ProduitService, Produit } from './../Services/produit.service';
import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Eset } from 'app/Model/Eset';
import { EsetImportAnalyzeResponse } from 'app/Model/EsetImportAnalyzeResponse';
import { NomProduit } from 'app/Model/NomProduit';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { HttpEventType } from '@angular/common/http';
import { ClientService, Client } from '../Services/client.service';
import { SearchableClientSelectComponent } from '../shared/searchable-client-select/searchable-client-select.component';
import { PermissionService } from '../Services/permission.service';
import { AppValidators } from '../shared/validators/app-validators';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  @Output() productAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  
  clients: Client[] = [];
  produitsFromApi: Produit[] = [];
  currentUserRole: string | null = null;

  productForm!: FormGroup;
  addProduitForm!: FormGroup;
  showAddProduitForm: boolean = false;
  productAddMessage: string | null = null;
  productAddSuccess: boolean = false;
  
  // Variables pour le modal simple d'ajout de produit
  showQuickAddProduit: boolean = false;
  quickProduitName: string = '';
  quickProduitError: string = '';
  
  // Variables pour l'upload de fichier
  selectedFile: File | null = null;
  uploadMessage: string | null = null;
  uploadSuccess: boolean = false;
  analyzeImportInProgress = false;
  /** Indique que la dernière analyse IA n'a pas rempli les champs (Ollama désactivé, erreur JSON, etc.) */
  lastAnalyzeSkipped = false;

  typeAchatOptions = [
    { value: TypeAchat.RENOUVELLEMENT, display: 'Renouvellemnt' },
    { value: TypeAchat.UPGRADE, display: 'Upgrade' },
    { value: TypeAchat.NOUVEL_LICENCE, display: 'Nouvel Licence' },
    { value: TypeAchat.BUSINESS_TRIAL, display: 'Business Trial' },
    { value: TypeAchat.AUGMENTATION, display: 'Augmentation' },
    { value: TypeAchat.DOWNGRADE, display: 'Down Grade' },
    { value: TypeAchat.LICENCE_GRATUIT, display: 'Licence Gratuit' }
  ];
  
  // Propriétés dynamiques qui seront remplies depuis l'API
  nomProduitOptions: { value: any; display: string }[] = [];
  filteredProducts: { value: any; display: string }[] = [];
  searchProduct: string = '';
  showProductDropdown: boolean = false;
  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  @ViewChild('productDropdownWrapper') productDropdownWrapper: ElementRef;
  @ViewChild('clientSelect') clientSelect: SearchableClientSelectComponent;

  constructor(private fb: FormBuilder, 
              private router: Router,
              private esetService: EsetService,
              private clientService: ClientService,
              private produitService: ProduitService,
              private elementRef: ElementRef,
              public permissionService: PermissionService) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Fermer le dropdown du produit si clic en dehors
    if (this.showProductDropdown) {
      const clickedInside = this.elementRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.showProductDropdown = false;
      }
    }
    // Fermer le dropdown du client si clic en dehors
    if (this.clientSelect) {
      const clientElement = this.clientSelect.getElement();
      if (clientElement && !clientElement.contains(event.target as Node)) {
        this.clientSelect.closeDropdown();
      }
    }
  }

  ngOnInit(): void {
    this.initForm();
    
    // Charger les clients
    this.clientService.getAllClients().subscribe(data => {
      this.clients = data;
    });

    // Charger les produits depuis l'API
    this.produitService.getAllProduitsActifs().subscribe(
      (produits) => {
        this.produitsFromApi = produits;
        // Convertir au format needed pour la liste déroulante
        this.nomProduitOptions = produits.map(p => ({
          value: p.code,
          display: p.label
        }));
        // Initialiser les produits filtrés
        this.filteredProducts = [...this.nomProduitOptions];
      },
      (error) => {
        console.error('Erreur lors du chargement des produits', error);
      }
    );

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

    // Auto-remplissage quand un client est selectionne
    this.productForm.get('client')!.valueChanges.subscribe(selectedName => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.productForm.patchValue({
          nom_contact: found.nosVisAVis?.[0] || '',
          nmb_tlf:     found.numTel?.[0]       || '',
          mail:        found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      client: ['', Validators.required],
      identifiant: ['', Validators.required],
      cle_de_Licence: ['', Validators.required],
      nom_produit: ['', Validators.required],
      remarque: [''],
      sousContrat: [false],
      nombre: ['', AppValidators.requiredQuantity],
      nmb_tlf: [''],
      commandePasserPar: ['', Validators.required],
      dureeDeLicence: [''],
      nom_contact: [''],
      mail: ['', [Validators.email]],
      mailAdmin: ['', [Validators.email]],
      dateEx: [null],
      typeAchat: ['', Validators.required],
      ccMail: this.fb.array([
        this.fb.control('', [Validators.email])
      ]),
      concernedPersonsEmails: this.fb.array([])
    });

    // Formulaire pour ajouter un nouveau produit (admins seulement)
    this.addProduitForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      label: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  /**
   * Vérifie si l'utilisateur est administrateur
   */
  isAdmin(): boolean {
    return this.currentUserRole === 'ROLE_ADMINISTRATEUR';
  }

  /**
   * Sélectionne un produit dans le dropdown personnalisé
   */
  selectProduct(productCode: string): void {
    this.productForm.patchValue({ nom_produit: productCode });
    // Afficher le nom du produit au lieu du code dans la barre de recherche
    const selectedProduct = this.nomProduitOptions.find(p => p.value === productCode);
    if (selectedProduct) {
      this.searchProduct = selectedProduct.display;
    }
    this.showProductDropdown = false;
  }

  /**
   * Filtre les produits basée sur le terme de recherche
   */
  filterProducts(searchTerm: string): void {
    this.searchProduct = searchTerm;
    this.showProductDropdown = true;
    if (!searchTerm.trim()) {
      this.filteredProducts = [...this.nomProduitOptions];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredProducts = this.nomProduitOptions.filter(product =>
        product.display.toLowerCase().includes(term)
      );
    }
  }

  /**
   * Gère le focus sur le champ de recherche
   */
  onProductSearchFocus(): void {
    this.showProductDropdown = true;
    this.filterProducts(this.searchProduct);
  }

  /**
   * Supprime un produit spécifique par son code
   */
  deleteProduct(productCode: string): void {
    // Trouver le produit à supprimer
    const produitToDelete = this.produitsFromApi.find(p => p.code === productCode);
    if (!produitToDelete || !produitToDelete.id) {
      alert('Produit non trouvé');
      return;
    }

    // Confirmation
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le produit "${produitToDelete.label}" ?`);
    if (!confirmed) {
      return;
    }

    this.produitService.desactiverProduit(produitToDelete.id).subscribe(
      (response) => {
        console.log('Produit supprimé avec succès', response);
        
        // Recharger la liste des produits
        this.produitService.rechargerProduits();
        
        // Rafraîchir les options du dropdown
        this.produitService.getAllProduitsActifs().subscribe(
          (produits) => {
            this.produitsFromApi = produits;
            this.nomProduitOptions = produits.map(p => ({
              value: p.code,
              display: p.label
            }));
          }
        );
      },
      (error) => {
        console.error('Erreur lors de la suppression', error);
        alert('Erreur lors de la suppression du produit');
      }
    );
  }

  /**
   * Bascule l'affichage du formulaire d'ajout de produit
   */
  toggleAddProduitForm(): void {
    this.showAddProduitForm = !this.showAddProduitForm;
    if (!this.showAddProduitForm) {
      this.addProduitForm.reset();
      this.productAddMessage = null;
    }
  }

  /**
   * Ajoute un nouveau produit à la BD
   */
  addNewProduit(): void {
    if (this.addProduitForm.valid) {
      const newProduit: Produit = {
        code: this.addProduitForm.value.code.trim(),
        label: this.addProduitForm.value.label.trim(),
        description: this.addProduitForm.value.description?.trim() || '',
        actif: true
      };

      this.produitService.addProduit(newProduit).subscribe(
        (response) => {
          console.log('Produit ajouté avec succès', response);
          this.productAddSuccess = true;
          this.productAddMessage = `Produit "${response.label}" ajouté avec succès!`;
          this.addProduitForm.reset();
          setTimeout(() => {
            this.showAddProduitForm = false;
            this.productAddMessage = null;
          }, 2000);
          // Les produits sont rechargés automatiquement via le service
        },
        (error) => {
          console.error("Erreur lors de l'ajout du produit", error);
          this.productAddSuccess = false;
          this.productAddMessage = `Erreur: ${error.error?.message || "Impossible d'ajouter le produit"}`;
        }
      );
    } else {
      this.productAddSuccess = false;
      this.productAddMessage = 'Veuillez remplir tous les champs obligatoires';
    }
  }

  /**
   * Annule l'ajout d'un produit
   */
  cancelAddProduit(): void {
    this.showAddProduitForm = false;
    this.addProduitForm.reset();
    this.productAddMessage = null;
  }

  get concernedPersonsEmails(): FormArray {
    return this.productForm.get('concernedPersonsEmails') as FormArray;
  }
  
  // Method to add a new email field
  addEmail() {
    this.concernedPersonsEmails.push(this.fb.control('', [Validators.required, Validators.email]));
  }
  
  // Method to remove an email field
  removeEmail(index: number) {
    this.concernedPersonsEmails.removeAt(index);
  }

  /**
   * Retourne le nom d'affichage du produit sélectionné
   */
  getSelectedProductDisplay(): string {
    const nomProduitValue = this.productForm.get('nom_produit')?.value;
    if (!nomProduitValue) {
      return '';
    }
    const selectedProduct = this.nomProduitOptions.find(p => p.value === nomProduitValue);
    return selectedProduct ? selectedProduct.display : '';
  }

  /**
   * Convertit un code produit en valeur d'enum NomProduit
   */
  private convertCodeToNomProduit(code: string): NomProduit {
    // Convertir le code (ex: ESET_PROTECT_ENTRY) en enum (ex: eset_protect_entry)
    return (code.toLowerCase() as NomProduit);
  }

  /**
   * Ferme le dropdown
   */
  closeDropdown(): void {
    this.showProductDropdown = false;
  }

  addProduct() {
    if (!this.productForm.valid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    console.log('Valeurs du formulaire:', this.productForm.value);

    const newProduct: Eset = {
        esetid: null!,
        client: this.productForm.value.client,
        identifiant: this.productForm.value.identifiant,
        sousContrat: this.productForm.value.sousContrat || false,
        remarque: this.productForm.value.remarque || '',
        cle_de_Licence: this.productForm.value.cle_de_Licence,
        nom_produit: this.productForm.value.nom_produit,  // Garder le code string tel quel, pas convertir en enum
        nombre: Number(this.productForm.value.nombre) || 0,
        nmb_tlf: Number(this.productForm.value.nmb_tlf) || 0,
        nom_contact: this.productForm.value.nom_contact || '',
        commandePasserPar: this.productForm.value.commandePasserPar,
        mailAdmin: this.productForm.value.mailAdmin || '',
        mail: this.productForm.value.mail || '',
        dateEx: this.productForm.value.dateEx,
        dureeDeLicence: this.productForm.value.dureeDeLicence || null,  // Garder comme chaîne ou null, pas chaîne vide
        typeAchat: this.productForm.value.typeAchat,
        ccMail: (this.ccMail.value || []).filter((email: string) => email && email.trim()), // Filtrer les emails vides
        approuve: false
      };

      console.log('JSON envoyé:', JSON.stringify(newProduct));
      console.log('Données envoyées au service:', newProduct);

      this.esetService.addEset(newProduct).subscribe(
        (response: any) => {
          console.log('Produit ajouté avec succès ', response);
          
          const esetId = response.esetid || response.id;
          if (this.selectedFile && esetId) {
            this.uploadFileAfterCreation(esetId);
          } else {
            this.uploadSuccess = true;
            this.lastAnalyzeSkipped = false;
            this.uploadMessage = 'Eset ajouté avec succès';
            this.productAdded.emit();
          }
        },
        error => {
          console.error('Erreur lors du l\'ajout du produit', error);
          const errorMsg = error.error?.message || error.message || 'Erreur inconnue';
          console.error('Détail de l\'erreur:', error);
          window.alert('Échec de l\'ajout du produit: ' + errorMsg);
        }
      );
  }

  // Méthode pour marquer tous les champs comme touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  get ccMail(): FormArray {
    return this.productForm.get('ccMail') as FormArray;
  }

  addCcMail(): void {
    this.ccMail.push(this.fb.control('', [Validators.email]));
  }

  removeCcMail(index: number): void {
    this.ccMail.removeAt(index);
  }

  onCancel(): void {
    // Émettre l'événement annulation si des observateurs écoutent (mode modal)
    if (this.cancelled.observers.length) {
      this.cancelled.emit();
    } else {
      // Sinon naviguer (mode standalone)
      this.router.navigate(['/affichage']);
    }
  }

  /**
   * Ouvre le modal pour ajouter rapidement un produit
   */
  openAddProduitModal(): void {
    this.showQuickAddProduit = true;
    this.quickProduitName = '';
    this.quickProduitError = '';
  }

  /**
   * Ferme le modal d'ajout de produit
   */
  closeAddProduitModal(): void {
    this.showQuickAddProduit = false;
    this.quickProduitName = '';
    this.quickProduitError = '';
  }

  /**
   * Ajoute un produit rapidement (juste le nom, le code est auto-généré)
   */
  quickAddProduit(): void {
    this.quickProduitError = '';
    
    if (!this.quickProduitName || this.quickProduitName.trim().length < 3) {
      this.quickProduitError = 'Le nom du produit doit contenir au moins 3 caractères';
      return;
    }

    // Auto-générer le code : slugify du nom
    const produitName = this.quickProduitName.trim();
    const autoCode = produitName
      .toLowerCase()
      .replace(/[éèê]/g, 'e')
      .replace(/[àâ]/g, 'a')
      .replace(/[ù]/g, 'u')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const newProduit: Produit = {
      code: autoCode,
      label: produitName,
      description: '',
      actif: true
    };

    this.produitService.addProduit(newProduit).subscribe(
      (response) => {
        console.log('Produit ajouté avec succès', response);
        this.closeAddProduitModal();
        // Le produit s'ajoute automatiquement à la liste via le service (BehaviorSubject)
      },
      (error) => {
        console.error('Erreur lors de l\'ajout du produit', error);
        this.quickProduitError = error.error?.message || 'Erreur lors de l\'ajout du produit';
      }
    );
  }

  /**
   * Supprime le produit actuellement sélectionné
   */
  deleteSelectedProduct(): void {
    const selectedCode = this.productForm.get('nom_produit')?.value;
    
    if (!selectedCode) {
      alert('Veuillez sélectionner un produit à supprimer');
      return;
    }

    // Trouver le produit sélectionné
    const produitToDelete = this.produitsFromApi.find(p => p.code === selectedCode);
    if (!produitToDelete || !produitToDelete.id) {
      alert('Produit non trouvé');
      return;
    }

    // Confirmation
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le produit "${produitToDelete.label}" ?`);
    if (!confirmed) {
      return;
    }

    this.produitService.desactiverProduit(produitToDelete.id).subscribe(
      (response) => {
        console.log('Produit supprimé avec succès', response);
        // Réinitialiser la sélection
        this.productForm.patchValue({ nom_produit: '' });
        // Reload la liste des produits
        this.produitService.rechargerProduits();
      },
      (error) => {
        console.error('Erreur lors de la suppression du produit', error);
        alert('Erreur lors de la suppression du produit');
      }
    );
  }

  // ==================== GESTION DES FICHIERS ====================

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.uploadMessage = null;
      this.lastAnalyzeSkipped = false;
      this.uploadSuccess = false;
      this.runAnalyzeImport();
    }
  }

  private runAnalyzeImport(): void {
    if (!this.selectedFile) {
      return;
    }
    this.analyzeImportInProgress = true;
    this.esetService.analyzeImport(this.selectedFile).subscribe({
      next: (r: EsetImportAnalyzeResponse) => {
        this.analyzeImportInProgress = false;
        this.lastAnalyzeSkipped = !!r.extractionSkipped;
        if (!r.extractionSkipped) {
          this.applyAnalyzeResponse(r);
          this.uploadSuccess = true;
          this.uploadMessage = r.infoMessage || 'Formulaire mis à jour depuis le document.';
        } else {
          this.uploadSuccess = false;
          this.uploadMessage = r.infoMessage || 'Analyse non disponible. Remplissez le formulaire manuellement.';
        }
      },
      error: (error) => {
        this.analyzeImportInProgress = false;
        this.lastAnalyzeSkipped = false;
        this.uploadSuccess = false;
        const body = error.error;
        const msg = typeof body === 'string' ? body : (body?.message || error.message || 'Erreur lors de l\'analyse');
        this.uploadMessage = msg;
      }
    });
  }

  private applyAnalyzeResponse(r: EsetImportAnalyzeResponse): void {
    const patch: Record<string, unknown> = {};
    if (r.client) {
      patch['client'] = r.client;
    }
    if (r.identifiant) {
      patch['identifiant'] = r.identifiant;
    }
    if (r.cle_de_Licence) {
      patch['cle_de_Licence'] = r.cle_de_Licence;
    }
    if (r.nombre != null && !Number.isNaN(Number(r.nombre))) {
      patch['nombre'] = Number(r.nombre);
    }
    if (r.nmb_tlf != null && String(r.nmb_tlf).trim() !== '') {
      patch['nmb_tlf'] = String(r.nmb_tlf).trim();
    }
    if (r.nom_contact) {
      patch['nom_contact'] = r.nom_contact;
    }
    if (r.mail) {
      patch['mail'] = r.mail;
    }
    if (r.mailAdmin) {
      patch['mailAdmin'] = r.mailAdmin;
    }
    if (r.dateEx) {
      patch['dateEx'] = r.dateEx;
    }
    if (r.dureeDeLicence) {
      patch['dureeDeLicence'] = r.dureeDeLicence;
    }
    if (r.typeAchat) {
      patch['typeAchat'] = r.typeAchat;
    }
    if (r.commandePasserPar) {
      patch['commandePasserPar'] = r.commandePasserPar;
    }
    if (r.remarque) {
      patch['remarque'] = r.remarque;
    }
    if (r.sousContrat === true || r.sousContrat === false) {
      patch['sousContrat'] = r.sousContrat;
    }

    this.productForm.patchValue(patch);

    if (r.nom_produit) {
      this.selectProduct(r.nom_produit);
    }

    if (r.ccMail && r.ccMail.length > 0) {
      while (this.ccMail.length) {
        this.ccMail.removeAt(0);
      }
      r.ccMail.forEach(email => {
        const trimmed = (email || '').trim();
        if (trimmed) {
          this.ccMail.push(this.fb.control(trimmed, [Validators.email]));
        }
      });
      if (this.ccMail.length === 0) {
        this.ccMail.push(this.fb.control('', [Validators.email]));
      }
    }
  }

  uploadFileAfterCreation(esetId: number): void {
    if (!this.selectedFile) {
      this.uploadSuccess = true;
      this.lastAnalyzeSkipped = false;
      this.uploadMessage = 'Eset ajouté avec succès';
      this.productAdded.emit();  // Émettre l'événement au lieu de naviguer
      return;
    }

    this.esetService.uploadFile(esetId, this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.Response) {
          if (event.body.success) {
            this.uploadSuccess = true;
            this.lastAnalyzeSkipped = false;
            this.uploadMessage = 'Fichier uploadé avec succès!';
            this.productAdded.emit();  // Émettre l'événement au lieu de naviguer
          } else {
            this.uploadSuccess = false;
            this.lastAnalyzeSkipped = false;
            this.uploadMessage = event.body.message || 'Erreur lors de l\'upload';
            this.productAdded.emit();  // Émettre l'événement même en cas d'erreur upload
          }
        }
      },
      error: (error) => {
        this.uploadSuccess = false;
        this.lastAnalyzeSkipped = false;
        this.uploadMessage = 'Erreur lors de l\'upload: ' + (error.error?.message || error.message);
        console.error('Erreur upload:', error);
        this.productAdded.emit();  // Émettre l'événement même en cas d'erreur upload
      }
    });
  }
}
